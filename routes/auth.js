const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.get("/profile", authMiddleware, authController.getProfile);

// Debug route - hanya untuk development
router.get("/debug/users", async (req, res) => {
  try {
    const pool = require("../config/db");
    const result = await pool.query(
      "SELECT id, username, email, created_at FROM users ORDER BY id"
    );
    res.json({
      status: "success",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
