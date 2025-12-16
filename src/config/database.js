const pg = require("pg");
const { Sequelize } = require("sequelize");
require("dotenv").config();


let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('?')) {
  connectionString = connectionString.split('?')[0];
}

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 10000, 
  },
  pool: {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 5000,
  },
});

module.exports = sequelize;