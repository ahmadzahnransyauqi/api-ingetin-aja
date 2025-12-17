// Vercel Serverless Function Entry Point
console.log("🚀 IngetinAja API - Vercel Serverless Function");

// Verify critical packages
try {
  console.log("Checking dependencies...");
  require("pg");
  console.log("✅ pg package loaded");
  require("pg-hstore");
  console.log("✅ pg-hstore package loaded");
  require("sequelize");
  console.log("✅ sequelize package loaded");
} catch (error) {
  console.error("❌ Missing package:", error.message);
  console.error("Installing missing packages...");
  // We can't install here, but we can log
  process.exit(1);
}

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}

console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Database URL exists:", !!process.env.DATABASE_URL);

// Import main app
try {
  const app = require("../src/app");
  console.log("✅ App loaded successfully");
  module.exports = app;
} catch (error) {
  console.error("❌ Failed to load app:", error.message, error.stack);
  
  // Fallback basic app
  const express = require("express");
  const fallbackApp = express();
  fallbackApp.use(require("cors")());
  fallbackApp.use(express.json());
  
  fallbackApp.get("/", (req, res) => {
    res.json({ 
      message: "IngetinAja API - Starting up...",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  });
  
  fallbackApp.get("/api/health", (req, res) => {
    res.json({ 
      status: "degraded",
      message: "Database connection issue",
      timestamp: new Date().toISOString()
    });
  });
  
  module.exports = fallbackApp;
}
