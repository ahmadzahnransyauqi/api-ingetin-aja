const { Sequelize } = require("sequelize");

let sequelize;

const getSequelize = () => {
  if (!sequelize) {
    // Cek semua kemungkinan env var names
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.POSTGRES_URL || 
                       process.env.NEON_DATABASE_URL;
    
    if (!databaseUrl) {
      console.error("❌ DATABASE_URL not found in environment");
      console.log("Available env vars:", Object.keys(process.env).join(', '));
      console.log("Please create .env file with DATABASE_URL");
      // Jangan throw error, biarkan app jalan tanpa database
      return null;
    }

    console.log("🔌 Connecting to database...");
    
    try {
      sequelize = new Sequelize(databaseUrl, {
        dialect: "postgres",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
      
      console.log("✅ Sequelize instance created");
    } catch (error) {
      console.error("❌ Failed to create Sequelize instance:", error.message);
      sequelize = null;
    }
  }
  
  return sequelize;
};

module.exports = getSequelize;