const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthService {
  async register(username, email, password) {
    try {
      // Check if user exists
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        throw new Error("Username sudah digunakan");
      }

      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        throw new Error("Email sudah terdaftar");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user in database
      const user = await User.create(username, email, hashedPassword);

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async login(username, password) {
    try {
      // Find user by username
      let user = await User.findByUsername(username);

      // If not found by username, try email
      if (!user) {
        user = await User.findByEmail(username);
      }

      if (!user) {
        throw new Error("Username atau password salah");
      }

      // Check password - PASTIKAN menggunakan await untuk bcrypt.compare
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new Error("Username atau password salah");
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  generateToken(user) {
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };

    return jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "7d",
    });
  }

  async getUserById(userId) {
    return await User.findById(userId);
  }

  async updateUser(userId, updateData) {
    // If password is being updated, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    return await User.update(userId, updateData);
  }

  async deleteUser(userId) {
    return await User.delete(userId);
  }
}

module.exports = new AuthService();
