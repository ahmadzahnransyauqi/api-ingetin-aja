const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Apply auth middleware ke semua routes notes
router.use(authMiddleware);

// GET /api/notes - Get all notes for current user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = require("../config/db");

    const result = await pool.query(
      `
      SELECT n.*, 
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', ci.id,
                   'text', ci.text,
                   'checked', ci.checked,
                   'position', ci.position
                 )
               ) FILTER (WHERE ci.id IS NOT NULL),
               '[]'
             ) as checklist,
             COALESCE(
               array_agg(DISTINCT c.user_id) FILTER (WHERE c.user_id IS NOT NULL),
               '{}'
             ) as collaborators,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', m.id,
                   'type', m.type,
                   'filename', m.filename,
                   'original_name', m.original_name,
                   'mime_type', m.mime_type,
                   'file_size', m.file_size,
                   'file_path', m.file_path
                 )
               ) FILTER (WHERE m.id IS NOT NULL),
               '[]'
             ) as media,
             u.username as owner_name
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      LEFT JOIN collaborators c ON n.id = c.note_id
      LEFT JOIN media m ON n.id = m.note_id
      WHERE n.owner_id = $1 OR c.user_id = $1
      GROUP BY n.id, u.username
      ORDER BY n.updated_at DESC
    `,
      [userId]
    );

    // Organize media by type
    const organizedNotes = result.rows.map((note) => {
      if (note.media) {
        const images = note.media.filter((m) => m.type === "image");
        const files = note.media.filter((m) => m.type === "file");
        const voices = note.media.filter((m) => m.type === "voice");

        return {
          ...note,
          images,
          files,
          voices,
        };
      }
      return note;
    });

    res.json({
      status: "success",
      data: organizedNotes,
    });
  } catch (error) {
    console.error("Get all notes error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// GET /api/notes/:id - Get note by ID
router.get("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const pool = require("../config/db");

    const result = await pool.query(
      `
      SELECT n.*, 
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', ci.id,
                   'text', ci.text,
                   'checked', ci.checked,
                   'position', ci.position
                 )
               ) FILTER (WHERE ci.id IS NOT NULL),
               '[]'
             ) as checklist,
             COALESCE(
               array_agg(DISTINCT c.user_id) FILTER (WHERE c.user_id IS NOT NULL),
               '{}'
             ) as collaborators,
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', m.id,
                   'type', m.type,
                   'filename', m.filename,
                   'original_name', m.original_name,
                   'mime_type', m.mime_type,
                   'file_size', m.file_size,
                   'file_path', m.file_path
                 )
               ) FILTER (WHERE m.id IS NOT NULL),
               '[]'
             ) as media,
             u.username as owner_name
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      LEFT JOIN collaborators c ON n.id = c.note_id
      LEFT JOIN media m ON n.id = m.note_id
      WHERE n.id = $1 AND (n.owner_id = $2 OR c.user_id = $2)
      GROUP BY n.id, u.username
    `,
      [noteId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or access denied",
      });
    }

    const note = result.rows[0];

    // Organize media
    if (note.media) {
      const images = note.media.filter((m) => m.type === "image");
      const files = note.media.filter((m) => m.type === "file");
      const voices = note.media.filter((m) => m.type === "voice");

      note.images = images;
      note.files = files;
      note.voices = voices;
      delete note.media;
    }

    res.json({
      status: "success",
      data: note,
    });
  } catch (error) {
    console.error("Get note by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// POST /api/notes - Create new note
router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      text,
      checklist,
      images,
      files,
      voices,
      reminder,
      collaborators,
    } = req.body;
    const pool = require("../config/db");

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert note
      const noteResult = await client.query(
        `
        INSERT INTO notes (owner_id, title, text, reminder)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [userId, title || "", text || "", reminder]
      );

      const note = noteResult.rows[0];

      // Insert checklist items
      if (checklist && checklist.length > 0) {
        for (const [index, item] of checklist.entries()) {
          await client.query(
            "INSERT INTO checklist_items (note_id, text, checked, position) VALUES ($1, $2, $3, $4)",
            [note.id, item.text || "", item.checked || false, index]
          );
        }
      }

      // Insert media (images)
      if (images && images.length > 0) {
        for (const image of images) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'image', $2, $3, $4, $5, $6)`,
            [
              note.id,
              image.filename,
              image.originalName,
              image.mimetype,
              image.size,
              image.path,
            ]
          );
        }
      }

      // Insert media (files)
      if (files && files.length > 0) {
        for (const file of files) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'file', $2, $3, $4, $5, $6)`,
            [
              note.id,
              file.filename,
              file.originalName,
              file.mimetype,
              file.size,
              file.path,
            ]
          );
        }
      }

      // Insert media (voices)
      if (voices && voices.length > 0) {
        for (const voice of voices) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'voice', $2, $3, $4, $5, $6)`,
            [
              note.id,
              voice.filename,
              voice.originalName,
              voice.mimetype,
              voice.size,
              voice.path,
            ]
          );
        }
      }

      await client.query("COMMIT");

      // Return the created note
      const finalResult = await client.query(
        `
        SELECT n.*, 
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', ci.id,
                     'text', ci.text,
                     'checked', ci.checked,
                     'position', ci.position
                   )
                 ) FILTER (WHERE ci.id IS NOT NULL),
                 '[]'
               ) as checklist,
               u.username as owner_name
        FROM notes n
        LEFT JOIN users u ON n.owner_id = u.id
        LEFT JOIN checklist_items ci ON n.id = ci.note_id
        WHERE n.id = $1
        GROUP BY n.id, u.username
      `,
        [note.id]
      );

      res.status(201).json({
        status: "success",
        data: finalResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
    });
  }
});

// PUT /api/notes/:id - Update note
router.put("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const {
      title,
      text,
      checklist,
      images,
      files,
      voices,
      reminder,
      collaborators,
    } = req.body;
    const pool = require("../config/db");

    // Check if user has access to this note
    const accessCheck = await pool.query(
      "SELECT id FROM notes WHERE id = $1 AND owner_id = $2",
      [noteId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or access denied",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update note
      await client.query(
        `
        UPDATE notes 
        SET title = $1, text = $2, reminder = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `,
        [title || "", text || "", reminder, noteId]
      );

      // Delete existing checklist items
      await client.query("DELETE FROM checklist_items WHERE note_id = $1", [
        noteId,
      ]);

      // Insert new checklist items
      if (checklist && checklist.length > 0) {
        for (const [index, item] of checklist.entries()) {
          await client.query(
            "INSERT INTO checklist_items (note_id, text, checked, position) VALUES ($1, $2, $3, $4)",
            [noteId, item.text || "", item.checked || false, index]
          );
        }
      }

      // Delete existing media
      await client.query("DELETE FROM media WHERE note_id = $1", [noteId]);

      // Insert new media (images)
      if (images && images.length > 0) {
        for (const image of images) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'image', $2, $3, $4, $5, $6)`,
            [
              noteId,
              image.filename,
              image.originalName,
              image.mimetype,
              image.size,
              image.path,
            ]
          );
        }
      }

      // Insert new media (files)
      if (files && files.length > 0) {
        for (const file of files) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'file', $2, $3, $4, $5, $6)`,
            [
              noteId,
              file.filename,
              file.originalName,
              file.mimetype,
              file.size,
              file.path,
            ]
          );
        }
      }

      // Insert new media (voices)
      if (voices && voices.length > 0) {
        for (const voice of voices) {
          await client.query(
            `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
             VALUES ($1, 'voice', $2, $3, $4, $5, $6)`,
            [
              noteId,
              voice.filename,
              voice.originalName,
              voice.mimetype,
              voice.size,
              voice.path,
            ]
          );
        }
      }

      await client.query("COMMIT");

      // Return the updated note
      const finalResult = await client.query(
        `
        SELECT n.*, 
               COALESCE(
                 json_agg(
                   DISTINCT jsonb_build_object(
                     'id', ci.id,
                     'text', ci.text,
                     'checked', ci.checked,
                     'position', ci.position
                   )
                 ) FILTER (WHERE ci.id IS NOT NULL),
                 '[]'
               ) as checklist,
               u.username as owner_name
        FROM notes n
        LEFT JOIN users u ON n.owner_id = u.id
        LEFT JOIN checklist_items ci ON n.id = ci.note_id
        WHERE n.id = $1
        GROUP BY n.id, u.username
      `,
        [noteId]
      );

      res.json({
        status: "success",
        data: finalResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
    });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete("/:id", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const pool = require("../config/db");

    // Check if user has access to this note
    const accessCheck = await pool.query(
      "SELECT id FROM notes WHERE id = $1 AND owner_id = $2",
      [noteId, userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or access denied",
      });
    }

    // Delete the note (cascade will handle related records)
    await pool.query("DELETE FROM notes WHERE id = $1", [noteId]);

    res.json({
      status: "success",
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// GET /api/notes/filter/reminder - Get notes with active reminders
router.get("/filter/reminder", async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = require("../config/db");

    const result = await pool.query(
      `
      SELECT n.*, 
             COALESCE(
               json_agg(
                 DISTINCT jsonb_build_object(
                   'id', ci.id,
                   'text', ci.text,
                   'checked', ci.checked,
                   'position', ci.position
                 )
               ) FILTER (WHERE ci.id IS NOT NULL),
               '[]'
             ) as checklist,
             u.username as owner_name
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      WHERE n.owner_id = $1 
        AND n.reminder IS NOT NULL
        AND n.reminder > CURRENT_TIMESTAMP
      GROUP BY n.id, u.username
      ORDER BY n.reminder ASC
    `,
      [userId]
    );

    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get notes with reminders error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;
