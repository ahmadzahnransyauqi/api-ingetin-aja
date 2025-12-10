const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validasi
      if (!username || !email || !password) {
        return res.status(400).json({
          status: "error",
          message: "Semua field harus diisi",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Password minimal 6 karakter",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Simpan ke database (simplified)
      const pool = require("../config/db");
      const result = await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
        [username, email, hashedPassword]
      );

      // Generate token
      const token = jwt.sign(
        { id: result.rows[0].id, username: result.rows[0].username },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        status: "success",
        data: {
          user: result.rows[0],
          token,
        },
        message: "Registrasi berhasil!",
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === "23505") {
        // Unique constraint violation
        return res.status(409).json({
          status: "error",
          message: "Username atau email sudah digunakan",
        });
      }

      res.status(500).json({
        status: "error",
        message: "Server error: " + error.message,
      });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          status: "error",
          message: "Username dan password harus diisi",
        });
      }

      // Cari user di database
      const pool = require("../config/db");
      const result = await pool.query(
        "SELECT * FROM users WHERE username = $1 OR email = $1",
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: "error",
          message: "Username atau password salah",
        });
      }

      const user = result.rows[0];

      // Verifikasi password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({
          status: "error",
          message: "Username atau password salah",
        });
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "7d" }
      );

      // Remove password dari response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        status: "success",
        data: {
          user: userWithoutPassword,
          token,
        },
        message: "Login berhasil!",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        status: "error",
        message: "Server error: " + error.message,
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const pool = require("../config/db");
      const result = await pool.query(
        "SELECT id, username, email, created_at FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: "error",
          message: "User tidak ditemukan",
        });
      }

      res.json({
        status: "success",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  }
}

module.exports = new AuthController();
