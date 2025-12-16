const { Sequelize } = require("sequelize");
require("dotenv").config();

console.log("🔄 Mencoba koneksi ke Database...");

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  pool: {
    max: 1, 
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

module.exports = sequelize;
