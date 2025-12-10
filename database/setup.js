const { Pool } = require("pg");
require("dotenv").config({ path: "../.env" });

async function setupDatabase() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: "postgres",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    console.log("🚀 Setting up PostgreSQL database...");

    const client = await pool.connect();

    // 1. Check/Create database
    try {
      await client.query(`CREATE DATABASE ingetinaja`);
      console.log("✅ Database created: ingetinaja");
    } catch (err) {
      if (err.code === "42P04") {
        console.log("✅ Database already exists: ingetinaja");
      } else {
        throw err;
      }
    }

    await client.release();

    // 2. Connect to ingetinaja database
    const appPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: "ingetinaja",
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    const appClient = await appPool.connect();

    // 3. Create tables
    console.log("📝 Creating tables...");

    await appClient.query(`
      -- Table: users
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appClient.query(`
      -- Table: notes
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        text TEXT,
        reminder TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appClient.query(`
      -- Table: checklist_items
      CREATE TABLE IF NOT EXISTS checklist_items (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        text VARCHAR(255) NOT NULL,
        checked BOOLEAN DEFAULT FALSE,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await appClient.query(`
      -- Table: collaborators
      CREATE TABLE IF NOT EXISTS collaborators (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(note_id, user_id)
      );
    `);

    await appClient.query(`
      -- Table: media (for images, files, and voice notes)
      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'file', 'voice')),
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        file_size BIGINT,
        file_path TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Tables created successfully");

    // 4. Create demo user
    const bcrypt = require("bcryptjs");
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync("demo123", salt);

    await appClient.query(
      `
      INSERT INTO users (username, email, password)
      VALUES ('demo', 'demo@example.com', $1)
      ON CONFLICT (username) DO NOTHING
    `,
      [hashedPassword]
    );

    console.log("✅ Demo user created/checked");

    // 5. Create demo note
    const userResult = await appClient.query(
      "SELECT id FROM users WHERE username = $1",
      ["demo"]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;

      const noteCheck = await appClient.query(
        "SELECT COUNT(*) FROM notes WHERE owner_id = $1",
        [userId]
      );

      if (parseInt(noteCheck.rows[0].count) === 0) {
        await appClient.query(
          `
          INSERT INTO notes (owner_id, title, text, reminder)
          VALUES ($1, $2, $3, $4)
        `,
          [
            userId,
            "Selamat datang di IngetinAja!",
            "Ini adalah catatan contoh dari database PostgreSQL",
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ]
        );

        console.log("✅ Demo note created");
      }
    }

    console.log("🎉 Database setup completed successfully!");

    await appClient.release();
    await appPool.end();
    await pool.end();
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    console.log("\n🔍 Troubleshooting tips:");
    console.log("1. Pastikan PostgreSQL berjalan: sudo service postgresql start");
    console.log("2. Cek koneksi dengan: psql -U postgres");
    console.log("3. Pastikan password di .env sesuai");
  }
}

setupDatabase();