const express = require("express");
const router = express.Router();

console.log("🔧 notification.routes.js loaded");

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Notifications API is working"
  });
});

module.exports = router;