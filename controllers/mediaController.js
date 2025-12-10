// controllers/mediaController.js
const notesService = require("../services/notesService");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "../uploads");

// POST handler untuk semua jenis upload file
const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }

    // Tentukan folder dan type dari Multer (lihat routes/upload.js storage logic)
    const fileType = req.file.mimetype.startsWith("image/")
      ? "images"
      : req.file.mimetype.startsWith("audio/")
      ? "voices"
      : "files";

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      file_path: `/uploads/${fileType}/${req.file.filename}`,
      type: fileType.slice(0, -1), // 'image', 'file', 'voice'
      url: `http://localhost:5000/uploads/${fileType}/${req.file.filename}`,
    };

    // Jika noteId disediakan di body, segera link ke database
    const noteId = parseInt(req.body.noteId);
    const userId = req.userId; // Dari middleware 'protect'

    if (noteId && userId) {
      const dbEntry = await notesService.addMediaToNote(
        noteId,
        userId,
        fileInfo
      );
      fileInfo.id = dbEntry.id;
    }

    res.json({ status: "success", data: fileInfo });
  } catch (error) {
    // Hapus file dari sistem file jika terjadi error DB
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res
      .status(500)
      .json({
        status: "error",
        message: "Gagal mengunggah dan menghubungkan file: " + error.message,
      });
  }
};

// DELETE handler untuk menghapus dari DB dan File System
const deleteMedia = async (req, res) => {
  try {
    // ID media yang akan dihapus (ID dari tabel 'media')
    const mediaId = parseInt(req.params.id);
    const userId = req.userId;

    // 1. Hapus dari database dan dapatkan info file
    const fileInfo = await notesService.deleteMedia(mediaId, userId);

    if (!fileInfo) {
      return res
        .status(404)
        .json({
          status: "error",
          message: "Media tidak ditemukan atau Anda tidak punya izin.",
        });
    }

    // 2. Hapus dari sistem file
    const folder =
      fileInfo.type === "image"
        ? "images"
        : fileInfo.type === "voice"
        ? "voices"
        : "files";
    const filePath = path.join(uploadsDir, folder, fileInfo.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      status: "success",
      message: "Media berhasil dihapus sepenuhnya.",
    });
  } catch (error) {
    const statusCode = error.message.includes("pemilik") ? 403 : 500;
    res.status(statusCode).json({ status: "error", message: error.message });
  }
};

module.exports = {
  handleUpload,
  deleteMedia,
};
