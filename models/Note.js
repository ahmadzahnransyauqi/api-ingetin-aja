const pool = require("../config/db");

class Note {
  static async findById(id) {
    const query = "SELECT * FROM notes WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAllByUser(userId) {
    const query = `
      SELECT 
        n.*,
        u.username as owner_name,
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
              'file_path', m.file_path,
              'url', '/uploads/' || m.type || 's/' || m.filename
            )
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      LEFT JOIN collaborators c ON n.id = c.note_id
      LEFT JOIN media m ON n.id = m.note_id
      WHERE n.owner_id = $1 OR c.user_id = $1
      GROUP BY n.id, u.username
      ORDER BY n.updated_at DESC
    `;
    const result = await pool.query(query, [userId]);

    // Organize media by type
    const organizedNotes = result.rows.map((note) => {
      if (note.media) {
        const organizedMedia = {
          images: note.media.filter((m) => m.type === "image"),
          files: note.media.filter((m) => m.type === "file"),
          voices: note.media.filter((m) => m.type === "voice"),
        };

        note.images = organizedMedia.images;
        note.files = organizedMedia.files;
        note.voices = organizedMedia.voices;
        delete note.media;
      }

      return note;
    });

    return organizedNotes;
  }

  static async create(ownerId, data) {
    const {
      title,
      text,
      reminder,
      checklist,
      collaborators,
      images,
      files,
      voices,
    } = data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert note
      const noteQuery = `
        INSERT INTO notes (owner_id, title, text, reminder)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      let reminderValue = null;
      if (reminder && reminder.timestamp) {
        reminderValue = new Date(reminder.timestamp);
      }

      const noteResult = await client.query(noteQuery, [
        ownerId,
        title || "",
        text || "",
        reminderValue,
      ]);
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

      // Insert collaborators
      if (collaborators && collaborators.length > 0) {
        for (const collaboratorId of collaborators) {
          await client.query(
            "INSERT INTO collaborators (note_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [note.id, collaboratorId]
          );
        }
      }

      // Insert media
      const mediaTypes = [
        { type: "image", items: images || [] },
        { type: "file", items: files || [] },
        { type: "voice", items: voices || [] },
      ];

      for (const mediaType of mediaTypes) {
        for (const media of mediaType.items) {
          if (media && media.filename) {
            await client.query(
              `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                note.id,
                mediaType.type,
                media.filename,
                media.originalName || media.filename,
                media.mimetype || "application/octet-stream",
                media.size || 0,
                media.url || media.path || "",
              ]
            );
          }
        }
      }

      await client.query("COMMIT");

      // Return the complete note
      return await this.getCompleteNote(note.id);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating note:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const {
      title,
      text,
      reminder,
      checklist,
      collaborators,
      images,
      files,
      voices,
    } = data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update note
      let reminderValue = null;
      if (reminder && reminder.timestamp) {
        reminderValue = new Date(reminder.timestamp);
      }

      const updateQuery = `
        UPDATE notes 
        SET title = $1, text = $2, reminder = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;

      const noteResult = await client.query(updateQuery, [
        title || "",
        text || "",
        reminderValue,
        id,
      ]);

      const note = noteResult.rows[0];

      if (!note) {
        throw new Error("Note not found");
      }

      // Delete and re-insert checklist items
      await client.query("DELETE FROM checklist_items WHERE note_id = $1", [
        id,
      ]);
      if (checklist && checklist.length > 0) {
        for (const [index, item] of checklist.entries()) {
          await client.query(
            "INSERT INTO checklist_items (note_id, text, checked, position) VALUES ($1, $2, $3, $4)",
            [id, item.text || "", item.checked || false, index]
          );
        }
      }

      // Delete and re-insert collaborators
      await client.query("DELETE FROM collaborators WHERE note_id = $1", [id]);
      if (collaborators && collaborators.length > 0) {
        for (const collaboratorId of collaborators) {
          await client.query(
            "INSERT INTO collaborators (note_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, collaboratorId]
          );
        }
      }

      // Delete and re-insert media (simplified version)
      await client.query("DELETE FROM media WHERE note_id = $1", [id]);

      const mediaTypes = [
        { type: "image", items: images || [] },
        { type: "file", items: files || [] },
        { type: "voice", items: voices || [] },
      ];

      for (const mediaType of mediaTypes) {
        for (const media of mediaType.items) {
          if (media && media.filename) {
            await client.query(
              `INSERT INTO media (note_id, type, filename, original_name, mime_type, file_size, file_path)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                id,
                mediaType.type,
                media.filename,
                media.originalName || media.filename,
                media.mimetype || "application/octet-stream",
                media.size || 0,
                media.url || media.path || "",
              ]
            );
          }
        }
      }

      await client.query("COMMIT");

      // Return the complete note
      return await this.getCompleteNote(id);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating note:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete related records (cascade should handle most, but being explicit)
      await client.query("DELETE FROM checklist_items WHERE note_id = $1", [
        id,
      ]);
      await client.query("DELETE FROM collaborators WHERE note_id = $1", [id]);
      await client.query("DELETE FROM media WHERE note_id = $1", [id]);

      // Delete the note
      const query = "DELETE FROM notes WHERE id = $1 RETURNING *";
      const result = await client.query(query, [id]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting note:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getCompleteNote(noteId) {
    const query = `
      SELECT 
        n.*,
        u.username as owner_name,
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
              'file_path', m.file_path,
              'url', '/uploads/' || m.type || 's/' || m.filename
            )
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      LEFT JOIN collaborators c ON n.id = c.note_id
      LEFT JOIN media m ON n.id = m.note_id
      WHERE n.id = $1
      GROUP BY n.id, u.username
    `;

    const result = await pool.query(query, [noteId]);

    if (result.rows.length === 0) {
      return null;
    }

    const note = result.rows[0];

    // Organize media by type
    if (note.media) {
      const organizedMedia = {
        images: note.media.filter((m) => m.type === "image"),
        files: note.media.filter((m) => m.type === "file"),
        voices: note.media.filter((m) => m.type === "voice"),
      };

      note.images = organizedMedia.images;
      note.files = organizedMedia.files;
      note.voices = organizedMedia.voices;
      delete note.media;
    }

    return note;
  }

  static async updateReminder(noteId, reminder) {
    let reminderValue = null;
    if (reminder && reminder.timestamp) {
      reminderValue = new Date(reminder.timestamp);
    }

    const query = `
      UPDATE notes 
      SET reminder = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [reminderValue, noteId]);
    return result.rows[0];
  }

  static async shareWithCollaborators(noteId, usernames) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Clear existing collaborators
      await client.query("DELETE FROM collaborators WHERE note_id = $1", [
        noteId,
      ]);

      // Add new collaborators by username
      if (usernames && usernames.length > 0) {
        for (const username of usernames) {
          // Find user by username
          const userResult = await client.query(
            "SELECT id FROM users WHERE username = $1",
            [username.trim()]
          );

          if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            await client.query(
              "INSERT INTO collaborators (note_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
              [noteId, userId]
            );
            console.log(`Added collaborator: ${username} (ID: ${userId})`);
          } else {
            console.warn(`User "${username}" not found, skipped`);
          }
        }
      }

      // Update note's updated_at
      await client.query(
        "UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [noteId]
      );

      await client.query("COMMIT");

      // Return updated note
      return await this.getCompleteNote(noteId);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error sharing note:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getNotesWithActiveReminders(userId) {
    const query = `
      SELECT 
        n.*,
        u.username as owner_name,
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
        ) as collaborators
      FROM notes n
      LEFT JOIN users u ON n.owner_id = u.id
      LEFT JOIN checklist_items ci ON n.id = ci.note_id
      LEFT JOIN collaborators c ON n.id = c.note_id
      WHERE (n.owner_id = $1 OR c.user_id = $1)
        AND n.reminder IS NOT NULL
        AND n.reminder > CURRENT_TIMESTAMP
      GROUP BY n.id, u.username
      ORDER BY n.reminder ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Note;
