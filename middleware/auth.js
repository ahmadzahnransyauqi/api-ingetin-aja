const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Skip auth untuk routes tertentu
  if (
    req.path === "/api/auth/login" ||
    req.path === "/api/auth/register" ||
    req.path === "/api/health"
  ) {
    return next();
  }

  // Get token dari header
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Add user ke request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;
