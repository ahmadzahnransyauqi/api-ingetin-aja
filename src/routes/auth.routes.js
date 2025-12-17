const express = require("express");
const router = express.Router(); // <-- Ini penting!

// Debug
console.log("🔧 auth.routes.js loaded");

// Test route sederhana
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth API is working"
  });
});

// Pastikan export router
module.exports = router; // <-- Export router, bukan objek