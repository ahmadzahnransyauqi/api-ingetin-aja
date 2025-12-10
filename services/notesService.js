const pool = require("../config/db");
const Note = require("../models/Note");

class NotesService {
  async getAllUserNotes(userId) {
    try {
      return await Note.findAllByUser(userId);
    } catch (error) {
      console.error("Error getting all notes:", error);
      throw error;
    }
  }

  async createNote(noteData) {
    try {
      return await Note.create(noteData.owner_id, noteData);
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  }

  async getNoteById(noteId, userId) {
    try {
      // First check if user has access
      const userNotes = await Note.findAllByUser(userId);
      const hasAccess = userNotes.some((note) => note.id === noteId);

      if (!hasAccess) {
        throw new Error("Note not found or access denied");
      }

      return await Note.getCompleteNote(noteId);
    } catch (error) {
      console.error("Error getting note:", error);
      throw error;
    }
  }

  async updateNote(noteId, noteData) {
    try {
      return await Note.update(noteId, noteData);
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  }

  async deleteNote(noteId) {
    try {
      return await Note.delete(noteId);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }

  async getNotesWithReminders(userId) {
    try {
      return await Note.getNotesWithActiveReminders(userId);
    } catch (error) {
      console.error("Error getting notes with reminders:", error);
      throw error;
    }
  }
}

module.exports = new NotesService();
