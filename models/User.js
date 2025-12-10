const pool = require("../config/db");

class User {
  static async findByUsername(username) {
    try {
      const query = "SELECT * FROM users WHERE username = $1";
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in findByUsername:", error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in findByEmail:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in findById:", error);
      throw error;
    }
  }

  static async create(username, email, password) {
    try {
      const query = `
        INSERT INTO users (username, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
      `;
      const result = await pool.query(query, [username, email, password]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in User.create:", error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (fields.length === 0) {
        return await this.findById(id);
      }

      values.push(id);
      const query = `
        UPDATE users 
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING id, username, email, created_at, updated_at
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error("Error in User.update:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = "DELETE FROM users WHERE id = $1 RETURNING id";
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error("Error in User.delete:", error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const query =
        "SELECT id, username, email, created_at, updated_at FROM users ORDER BY username";
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error("Error in User.getAll:", error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      const query = `
        SELECT id, username, email, created_at
        FROM users 
        WHERE username ILIKE $1 OR email ILIKE $1
        ORDER BY username
        LIMIT 10
      `;
      const result = await pool.query(query, [`%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error("Error in User.search:", error);
      throw error;
    }
  }
}

module.exports = User;
