const express = require("express");
const cors = require("cors");
const path = require("path");

// Load .env from root directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection test
let dbConnected = false;

const testDatabase = async () => {
  try {
    console.log("🔌 Testing database connection...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    
    if (process.env.DATABASE_URL) {
      const { Sequelize } = require("sequelize");
      
      // Mask password in logs
      const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]*)@/, ':****@');
      console.log("Connecting to:", maskedUrl);
      
      const sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: { 
          ssl: { 
            require: true, 
            rejectUnauthorized: false 
          } 
        },
        logging: false,
        pool: {
          max: 2,
          min: 0,
          acquire: 10000,
          idle: 5000
        }
      });
      
      await sequelize.authenticate();
      console.log("✅ Database authenticated");
      
      // Test query
      const [result] = await sequelize.query("SELECT version() as version");
      console.log("PostgreSQL Version:", result[0]?.version?.split(' ')[1]);
      
      await sequelize.close();
      dbConnected = true;
      console.log("✅ Database connected successfully");
    } else {
      console.log("⚠️ DATABASE_URL not found in environment");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    dbConnected = false;
  }
};

// Test database on startup
testDatabase();

// Basic route
app.get("/", (req, res) => {
  res.json({ 
    message: "IngetinAja API v1.0", 
    status: "online",
    timestamp: new Date().toISOString(),
    database: dbConnected ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development"
  });
});

// Health check with real database status
app.get("/api/health", async (req, res) => {
  res.json({ 
    status: "healthy",
    database: dbConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// ===== LOAD API ROUTES =====
console.log("\n🔧 Loading API routes...");

try {
  const authRoutes = require("./routes/auth");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes loaded");
} catch (error) {
  console.error("❌ Failed to load auth routes:", error.message);
}

// Simple routes
app.get("/api/tasks", (req, res) => {
  res.json({ 
    success: true,
    message: "Tasks API",
    database: dbConnected ? "available" : "offline",
    endpoints: ["/ (GET)", "/filter (GET)", "/:id (GET)", "/ (POST)", "/:id (PUT)", "/:id (DELETE)"]
  });
});

app.get("/api/notifications", (req, res) => {
  res.json({ 
    success: true,
    message: "Notifications API",
    database: dbConnected ? "available" : "offline"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.message);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Endpoint not found",
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("\n🚀 Server running on port " + PORT);
  console.log("📡 Environment: " + (process.env.NODE_ENV || "development"));
  console.log("\n🔗 Test endpoints:");
  console.log("   http://localhost:" + PORT);
  console.log("   http://localhost:" + PORT + "/api/health");
  console.log("   http://localhost:" + PORT + "/api/auth/test");
  console.log("   http://localhost:" + PORT + "/api/auth/register (POST)");
  console.log("   http://localhost:" + PORT + "/api/auth/login (POST)");
});

module.exports = app;
// Last deployment fix: 2025-12-17 10:02:50
// Fixed pg package installation for Vercel
