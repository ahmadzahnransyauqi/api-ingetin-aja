const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

router.post("/register", validateRegistration, authController.register);
router.post("/login", validateLogin, authController.login);
router.get("/me", protect, authController.getCurrentUser);
router.post("/logout", protect, authController.logout);

module.exports = router;
