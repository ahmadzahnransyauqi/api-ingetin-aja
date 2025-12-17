const express = require("express");
const router = express.Router();

// Debug
console.log("✅ auth.js loaded");

// Simple routes
router.get("/", (req, res) => {
  res.json({ 
    message: "Auth API",
    endpoints: ["/test", "/register", "/login"]
  });
});

router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth test OK" });
});

router.post("/register", (req, res) => {
  res.json({ 
    success: true, 
    message: "Register endpoint",
    data: req.body 
  });
});

router.post("/login", (req, res) => {
  res.json({ 
    success: true, 
    message: "Login endpoint",
    data: req.body 
  });
});

module.exports = router;
