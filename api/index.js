// Vercel Serverless Function Entry Point
console.log("🚀 IngetinAja API - Vercel Serverless Function");

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Debug log
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Database URL exists:", !!process.env.DATABASE_URL);

// Import main app
try {
  const app = require("../src/app");
  console.log("✅ App loaded successfully");
  module.exports = app;
} catch (error) {
  console.error("❌ Failed to load app:", error.message);
  // Fallback basic app
  const express = require("express");
  const fallbackApp = express();
  fallbackApp.get("/", (req, res) => {
    res.json({ message: "API is starting up..." });
  });
  module.exports = fallbackApp;
}
