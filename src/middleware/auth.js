const jwt = require("jsonwebtoken");

// Export sebagai fungsi middleware langsung
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get User model
      const { getModels } = require("../models");
      const models = await getModels();
      
      if (!models || !models.User) {
        return res.status(503).json({
          success: false,
          message: "Service unavailable",
        });
      }
      
      const user = await models.User.findByPk(decoded.id, {
        attributes: { exclude: ["password_hash"] },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }
};


module.exports = protect;
