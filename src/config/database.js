const pg = require("pg");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  
  dialectOptions: {

    ssl: {
      require: true,
      rejectUnauthorized: false,
    },

    connectionTimeoutMillis: 60000, 
  
    keepAlive: true, 
  },

  pool: {
  
    max: 1, 
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});

const testConnection = async () => {
  try {
    console.log("⏳ Mencoba koneksi ke database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error.message);
  }
};

testConnection();

module.exports = sequelize;