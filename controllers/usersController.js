const usersService = require("../services/usersService");

class UsersController {
  async getAllUsers(req, res) {
    try {
      // Only admin should access this in production
      // For now, we'll allow it for demo purposes
      const users = await usersService.getAllUsers();

      res.json({
        status: "success",
        data: users,
      });
    } catch (error) {
      console.error("Get all users error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const user = await usersService.getUserById(userId);

      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      console.error("Get user by ID error:", error.message);

      let statusCode = 500;
      if (error.message.includes("not found")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async updateUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const updateData = req.body;

      // In production, check if user is updating their own profile or is admin
      const updatedUser = await usersService.updateUser(userId, updateData);

      res.json({
        status: "success",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Update user error:", error.message);

      let statusCode = 500;
      let message = error.message;

      if (
        error.message.includes("already taken") ||
        error.message.includes("not found")
      ) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        status: "error",
        message: message,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const result = await usersService.deleteUser(userId);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      console.error("Delete user error:", error.message);

      let statusCode = 500;
      if (error.message.includes("not found")) {
        statusCode = 404;
      }

      res.status(statusCode).json({
        status: "error",
        message: error.message,
      });
    }
  }

  async searchUsers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length === 0) {
        return res.json({
          status: "success",
          data: [],
        });
      }

      const users = await usersService.searchUsers(q.trim());

      res.json({
        status: "success",
        data: users,
      });
    } catch (error) {
      console.error("Search users error:", error.message);
      res.status(500).json({
        status: "error",
        message: error.message,
      });
    }
  }
}

module.exports = new UsersController();
