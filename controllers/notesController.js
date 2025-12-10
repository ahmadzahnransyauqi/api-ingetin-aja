const Note = require("../models/Note");

class NotesController {
  async getAllNotes(req, res) {
    try {
      const userId = req.user.id;
      const notes = await Note.findAllByUser(userId);

      res.json({
        status: "success",
        data: notes,
      });
    } catch (error) {
      console.error("Get all notes error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async getNoteById(req, res) {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;

      // First get all user's notes to check access
      const userNotes = await Note.findAllByUser(userId);
      const noteExists = userNotes.some((note) => note.id === noteId);

      if (!noteExists) {
        return res.status(404).json({
          status: "error",
          message: "Note not found or access denied",
        });
      }

      const note = await Note.getCompleteNote(noteId);

      if (!note) {
        return res.status(404).json({
          status: "error",
          message: "Note not found",
        });
      }

      res.json({
        status: "success",
        data: note,
      });
    } catch (error) {
      console.error("Get note by ID error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async createNote(req, res) {
    try {
      const userId = req.user.id;
      const noteData = req.body;

      const newNote = await Note.create(userId, noteData);

      res.status(201).json({
        status: "success",
        data: newNote,
      });
    } catch (error) {
      console.error("Create note error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async updateNote(req, res) {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;
      const updateData = req.body;

      // First check if user has access to this note
      const userNotes = await Note.findAllByUser(userId);
      const noteExists = userNotes.some((note) => note.id === noteId);

      if (!noteExists) {
        return res.status(404).json({
          status: "error",
          message: "Note not found or access denied",
        });
      }

      const updatedNote = await Note.update(noteId, updateData);

      res.json({
        status: "success",
        data: updatedNote,
      });
    } catch (error) {
      console.error("Update note error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async deleteNote(req, res) {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;

      // First check if user has access to this note
      const userNotes = await Note.findAllByUser(userId);
      const noteExists = userNotes.some((note) => note.id === noteId);

      if (!noteExists) {
        return res.status(404).json({
          status: "error",
          message: "Note not found or access denied",
        });
      }

      const deletedNote = await Note.delete(noteId);

      res.json({
        status: "success",
        data: deletedNote,
        message: "Note deleted successfully",
      });
    } catch (error) {
      console.error("Delete note error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async shareNote(req, res) {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;
      const { collaborators } = req.body; // Ini seharusnya array of usernames

      console.log(
        "Share note request - Note ID:",
        noteId,
        "User ID:",
        userId,
        "Collaborators:",
        collaborators
      );

      // First check if user owns this note (only owners can share)
      const userNotes = await Note.findAllByUser(userId);
      const note = userNotes.find((note) => note.id === noteId);

      if (!note) {
        return res.status(404).json({
          status: "error",
          message: "Note not found or access denied",
        });
      }

      // Check if user is the owner
      if (note.owner_id !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Only note owner can share the note",
        });
      }

      const updatedNote = await Note.shareWithCollaborators(
        noteId,
        collaborators // Kirim usernames, bukan IDs
      );

      res.json({
        status: "success",
        data: updatedNote,
        message: "Note shared successfully",
      });
    } catch (error) {
      console.error("Share note error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async getNotesWithReminders(req, res) {
    try {
      const userId = req.user.id;
      const notes = await Note.getNotesWithActiveReminders(userId);

      res.json({
        status: "success",
        data: notes,
      });
    } catch (error) {
      console.error("Get notes with reminders error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async updateReminder(req, res) {
    try {
      const noteId = parseInt(req.params.id);
      const userId = req.user.id;
      const { reminder } = req.body;

      // First check if user has access to this note
      const userNotes = await Note.findAllByUser(userId);
      const noteExists = userNotes.some((note) => note.id === noteId);

      if (!noteExists) {
        return res.status(404).json({
          status: "error",
          message: "Note not found or access denied",
        });
      }

      const updatedNote = await Note.updateReminder(noteId, reminder);

      res.json({
        status: "success",
        data: updatedNote,
        message: "Reminder updated successfully",
      });
    } catch (error) {
      console.error("Update reminder error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = new NotesController();
