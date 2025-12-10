const express = require("express");
const cors = require("cors");
const path = require("path");
const notesRoutes = require("./routes/notes");
const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");
const usersRoutes = require("./routes/users");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Pastikan ini benar
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", usersRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "IngetinAja API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 IngetinAja API: http://localhost:${PORT}/api`);
  console.log(`📁 Uploads directory: http://localhost:${PORT}/uploads`);
  console.log(`🔗 Frontend: http://localhost:5173`);
});
