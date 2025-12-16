const pg = require("pg");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectModule: pg,
  protocol: "postgres",
  logging: false,
  
  dialectOptions: {
 
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
   
    connectionTimeoutMillis: 30000, 
  },
 
  pool: {
    max: 2,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};

testConnection();

module.exports = sequelize;