const pool = require("../config/db");

class UsersService {
  async searchUsers(query) {
    try {
      const result = await pool.query(
        `SELECT id, username, email, created_at 
         FROM users 
         WHERE username ILIKE $1 OR email ILIKE $1
         ORDER BY username
         LIMIT 10`,
        [`%${query}%`]
      );
      return result.rows;
    } catch (error) {
      console.error("Search users error:", error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const result = await pool.query(
        "SELECT id, username, email, created_at FROM users WHERE id = $1",
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Get user by ID error:", error);
      throw error;
    }
  }

  async getUserByUsername(username) {
    try {
      const result = await pool.query(
        "SELECT id, username, email, created_at FROM users WHERE username = $1",
        [username]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Get user by username error:", error);
      throw error;
    }
  }
}

module.exports = new UsersService();
