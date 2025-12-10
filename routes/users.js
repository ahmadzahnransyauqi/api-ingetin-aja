const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const usersController = require("../controllers/usersController");

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/users - Get all users (for admin/search)
router.get("/", usersController.getAllUsers);

// GET /api/users/search - Search users
router.get("/search", usersController.searchUsers);

// GET /api/users/:id - Get user by ID
router.get("/:id", usersController.getUserById);

// PUT /api/users/:id - Update user
router.put("/:id", usersController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete("/:id", usersController.deleteUser);

module.exports = router;
