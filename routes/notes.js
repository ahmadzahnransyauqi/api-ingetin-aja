const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { validateNote } = require("../middleware/validation");
const notesController = require("../controllers/notesController");

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/notes - Get all notes for current user
router.get("/", notesController.getAllNotes);

// GET /api/notes/filter/reminder - Get notes with active reminders
router.get("/filter/reminder", notesController.getNotesWithReminders);

// GET /api/notes/:id - Get note by ID
router.get("/:id", notesController.getNoteById);

// POST /api/notes - Create new note
router.post("/", validateNote, notesController.createNote);

// PUT /api/notes/:id - Update note
router.put("/:id", validateNote, notesController.updateNote);

// DELETE /api/notes/:id - Delete note
router.delete("/:id", notesController.deleteNote);

// PATCH /api/notes/:id/share - Share note with collaborators
router.patch("/:id/share", notesController.shareNote);

// PATCH /api/notes/:id/reminder - Update only reminder
router.patch("/:id/reminder", notesController.updateReminder);

// PATCH /api/notes/:id/share - Share note with collaborators (MENERIMA USERNAMES)
router.patch("/:id/share", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const { collaborators } = req.body; // Array of usernames
    
    console.log("PATCH /share - Request:", {
      noteId,
      userId,
      collaborators,
      body: req.body
    });

    // Check if user is the owner of the note
    const ownerCheck = await pool.query(
      "SELECT id, owner_id FROM notes WHERE id = $1",
      [noteId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note tidak ditemukan",
      });
    }

    const note = ownerCheck.rows[0];
    
    if (note.owner_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Hanya pemilik note yang dapat membagikan note",
      });
    }

    // Delete existing collaborators
    await pool.query("DELETE FROM collaborators WHERE note_id = $1", [noteId]);

    // Add new collaborators by username
    if (collaborators && Array.isArray(collaborators) && collaborators.length > 0) {
      for (const username of collaborators) {
        if (typeof username === 'string' && username.trim()) {
          // Find user by username
          const userResult = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username.trim()]
          );
          
          if (userResult.rows.length > 0) {
            const collaboratorId = userResult.rows[0].id;
            
            // Skip if trying to add yourself
            if (collaboratorId !== userId) {
              await pool.query(
                "INSERT INTO collaborators (note_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [noteId, collaboratorId]
              );
              console.log(`Added collaborator: ${username} (ID: ${collaboratorId})`);
            }
          } else {
            console.warn(`User not found: ${username}`);
          }
        }
      }
    }

    // Update note's updated_at
    await pool.query(
      "UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [noteId]
    );

    // Get updated note with collaborators
    const updatedNote = await pool.query(`
      SELECT n.*, 
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', u.id,
                 'username', u.username,
                 'email', u.email
               )
             ) FILTER (WHERE u.id IS NOT NULL) as collaborators
      FROM notes n
      LEFT JOIN collaborators c ON n.id = c.note_id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE n.id = $1
      GROUP BY n.id
    `, [noteId]);

    res.json({
      status: "success",
      data: updatedNote.rows[0],
      message: "Note berhasil dibagikan",
    });
  } catch (error) {
    console.error("Share note error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
    });
  }
});

// Collaborators endpoints
// GET /api/notes/:id/collaborators - Get collaborators for a note
router.get("/:id/collaborators", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const pool = require("../config/db");

    console.log("GET collaborators - Note ID:", noteId, "User ID:", userId);

    // Check if user has access to this note
    const accessCheck = await pool.query(
      `SELECT n.id, n.owner_id 
       FROM notes n 
       LEFT JOIN collaborators c ON n.id = c.note_id
       WHERE n.id = $1 AND (n.owner_id = $2 OR c.user_id = $2)`,
      [noteId, userId]
    );

    console.log("Access check result:", accessCheck.rows);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note not found or access denied",
      });
    }

    // Get collaborators with user info - PERBAIKAN INI
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        c.created_at as shared_at
      FROM collaborators c
      JOIN users u ON c.user_id = u.id
      WHERE c.note_id = $1
      ORDER BY c.created_at DESC
    `, [noteId]);

    console.log("Collaborators found:", result.rows);

    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Get collaborators error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/notes/:id/collaborators - Add collaborator to note
router.post("/:id/collaborators", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userId = req.user.id;
    const { collaboratorUsername } = req.body; // Terima username, bukan ID
    const pool = require("../config/db");

    console.log("POST /api/notes/:id/collaborators - Request body:", req.body);
    console.log("Note ID:", noteId, "User ID:", userId, "Collaborator Username:", collaboratorUsername);

    if (!collaboratorUsername || collaboratorUsername.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Username kolaborator harus diisi",
      });
    }

    // Check if user is the owner of the note
    const ownerCheck = await pool.query(
      "SELECT id, owner_id FROM notes WHERE id = $1",
      [noteId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Note tidak ditemukan",
      });
    }

    const note = ownerCheck.rows[0];
    
    // Cek apakah user adalah owner note
    if (note.owner_id !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Hanya pemilik note yang dapat menambahkan kolaborator",
      });
    }

    // Find the collaborator user by USERNAME (bukan ID)
    const collaboratorResult = await pool.query(
      "SELECT id, username, email FROM users WHERE username = $1",
      [collaboratorUsername.trim()]
    );

    if (collaboratorResult.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `User dengan username "${collaboratorUsername}" tidak ditemukan`,
      });
    }

    const collaborator = collaboratorResult.rows[0];
    const collaboratorId = collaborator.id;

    console.log("Found collaborator:", collaborator);

    // Check if user is trying to add themselves
    if (collaboratorId === userId) {
      return res.status(400).json({
        status: "error",
        message: "Tidak dapat menambahkan diri sendiri sebagai kolaborator",
      });
    }

    // Check if collaborator already exists
    const existingCheck = await pool.query(
      "SELECT id FROM collaborators WHERE note_id = $1 AND user_id = $2",
      [noteId, collaboratorId]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "User sudah menjadi kolaborator",
      });
    }

    // Add collaborator
    await pool.query(
      "INSERT INTO collaborators (note_id, user_id) VALUES ($1, $2)",
      [noteId, collaboratorId]
    );

    // Update note's updated_at
    await pool.query(
      "UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [noteId]
    );

    res.status(201).json({
      status: "success",
      data: {
        id: collaborator.id,
        username: collaborator.username,
        email: collaborator.email,
      },
      message: `Berhasil menambahkan ${collaborator.username} sebagai kolaborator`,
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error: " + error.message,
    });
  }
});
// DELETE /api/notes/:id/collaborators/:userId - Remove collaborator
router.delete("/:id/collaborators/:collaboratorId", async (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const collaboratorId = parseInt(req.params.collaboratorId);
    const userId = req.user.id;
    const pool = require("../config/db");

    // Check if user is the owner of the note
    const ownerCheck = await pool.query(
      "SELECT id FROM notes WHERE id = $1 AND owner_id = $2",
      [noteId, userId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "Only note owner can remove collaborators",
      });
    }

    // Remove collaborator
    const result = await pool.query(
      "DELETE FROM collaborators WHERE note_id = $1 AND user_id = $2 RETURNING id",
      [noteId, collaboratorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Collaborator not found",
      });
    }

    res.json({
      status: "success",
      message: "Collaborator removed successfully",
    });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

// Debug endpoint untuk mendapatkan semua users (hanya untuk development)
router.get("/debug/users", async (req, res) => {
  try {
    const pool = require("../config/db");
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users ORDER BY username"
    );
    
    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});
module.exports = router;