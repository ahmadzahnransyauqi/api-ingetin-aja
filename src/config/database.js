const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

const getSequelize = () => {
  if (!sequelize) {
    const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error("DATABASE_URL or NEON_DATABASE_URL environment variable is required");
    }

    console.log("Connecting to database...");
    console.log("Database URL:", databaseUrl.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

    sequelize = new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        max: 3,
      },
    });
  }
  return sequelize;
};

module.exports = getSequelize;