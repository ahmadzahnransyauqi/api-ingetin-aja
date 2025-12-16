const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { initDatabase } = require("./models");

dotenv.config();

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000", 

  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, "") : ""
];

app.use(
  cors({
    origin: function (origin, callback) {
   
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
      
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
     
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.json({ message: "Server IngetinAja is running on Vercel!" });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "IngetinAja API",
  });
});


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);


app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});


app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {

    await initDatabase().catch(err => {
      console.error("⚠️ Database Error (Server tetap jalan):", err.message);
    });
    
   
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);

  }
};

startServer();

module.exports = app;