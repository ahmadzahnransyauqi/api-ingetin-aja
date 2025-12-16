const pg = require("pg");
const { Sequelize } = require("sequelize");
require("dotenv").config();

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('?')) {
  connectionString = connectionString.split('?')[0];
}

console.log("🔄 Mencoba koneksi ke Database...");

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  benchmark: true, 

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  
    connectionTimeoutMillis: 30000, 
  },

  pool: {
    max: 1, 
    min: 0,
    acquire: 60000,
    idle: 5000,
  },
});

module.exports = sequelize;