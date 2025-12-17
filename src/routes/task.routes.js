const express = require("express");
const router = express.Router();

console.log("🔧 task.routes.js loaded");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Tasks API is working"
  });
});

module.exports = router;