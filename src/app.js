const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { initDatabase } = require("./models");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

// Middleware CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Server IngetinAja is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: "Neon PostgreSQL"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const { sequelize } = require("./models");
    await sequelize.authenticate();
    
    // Cek jumlah tabel
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    
    res.json({
      status: "healthy",
      database: "connected",
      tables: tables.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

const startServer = async () => {
  try {
    console.log("🚀 Starting server...");
    console.log("Environment:", process.env.NODE_ENV || "development");
    
    // Initialize database with retry logic
    let retries = 5;
    let connected = false;
    
    while (retries > 0 && !connected) {
      try {
        await initDatabase();
        console.log("✅ Database initialized successfully");
        connected = true;
      } catch (dbError) {
        console.error(`❌ Database connection attempt ${6 - retries} failed:`, dbError.message);
        retries--;
        
        if (retries === 0) {
          console.warn("⚠️ Server starting without database connection");
          console.warn("⚠️ Some features may not work properly");
        } else {
          console.log(`⏳ Retrying in 5 seconds... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    // Untuk development/local server
    if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;