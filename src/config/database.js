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
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Dadb nyambung coy");
  } catch (error) {
    console.error("❌ Uperiksa ulang njir", error);
  }
};

testConnection();

module.exports = sequelize;