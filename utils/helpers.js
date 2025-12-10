const path = require("path");
const fs = require("fs");

class Helpers {
  static formatDate(date) {
    if (!date) return "";

    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      return dateObj.toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  static isImageFile(filename) {
    const ext = this.getFileExtension(filename);
    return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext);
  }

  static isAudioFile(filename) {
    const ext = this.getFileExtension(filename);
    return [".mp3", ".wav", ".ogg", ".webm", ".m4a"].includes(ext);
  }

  static isDocumentFile(filename) {
    const ext = this.getFileExtension(filename);
    return [".pdf", ".doc", ".docx", ".txt", ".rtf"].includes(ext);
  }

  static generateRandomString(length = 10) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  static sanitizeFilename(filename) {
    // Remove special characters and replace spaces with underscores
    return filename
      .replace(/[^\w\s.-]/gi, "")
      .replace(/\s+/g, "_")
      .toLowerCase();
  }

  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 6 characters
    return password.length >= 6;
  }

  static parseReminderData(reminder) {
    if (!reminder) return null;

    try {
      let timestamp;

      if (reminder.timestamp) {
        timestamp = reminder.timestamp;
      } else if (reminder.date && reminder.time) {
        const dateTimeString = `${reminder.date}T${reminder.time}`;
        const date = new Date(dateTimeString);
        timestamp = date.getTime();
      } else if (typeof reminder === "string") {
        const date = new Date(reminder);
        timestamp = date.getTime();
      } else {
        return null;
      }

      // Validate timestamp
      if (isNaN(timestamp) || timestamp <= Date.now()) {
        return null;
      }

      const date = new Date(timestamp);

      return {
        timestamp,
        date: date.toISOString().split("T")[0],
        time: date.toTimeString().split(" ")[0].substring(0, 5),
        isoString: date.toISOString(),
      };
    } catch (error) {
      console.error("Error parsing reminder:", error);
      return null;
    }
  }

  static calculateChecklistProgress(checklist) {
    if (!checklist || checklist.length === 0) {
      return 0;
    }

    const completed = checklist.filter((item) => item.checked).length;
    const total = checklist.length;

    return Math.round((completed / total) * 100);
  }
}

module.exports = Helpers;
