const getSequelize = require("../config/database");

const initDatabase = async () => {
  const sequelize = getSequelize();
  
  if (!sequelize) {
    console.log("⚠️ Skipping database initialization - no connection");
    return null;
  }
  
  try {
    console.log("🔌 Testing database connection...");
    await sequelize.authenticate();
    console.log("✅ Database connection OK");
    
    // Load models
    const User = require("./user");
    const Task = require("./Task");
    const ChecklistItem = require("./ChecklistItem");
    const SharedTask = require("./SharedTask");
    
    // Setup associations
    User.hasMany(Task, { foreignKey: "user_id", onDelete: "CASCADE" });
    Task.belongsTo(User, { foreignKey: "user_id" });
    
    Task.hasMany(ChecklistItem, { foreignKey: "task_id", onDelete: "CASCADE" });
    ChecklistItem.belongsTo(Task, { foreignKey: "task_id" });
    
    Task.hasMany(SharedTask, { foreignKey: "task_id", onDelete: "CASCADE" });
    SharedTask.belongsTo(Task, { foreignKey: "task_id" });
    SharedTask.belongsTo(User, { foreignKey: "owner_id" });
    
    console.log("✅ Models initialized");
    
    return { sequelize, User, Task, ChecklistItem, SharedTask };
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return null;
  }
};

// Export function untuk mendapatkan models
const getModels = async () => {
  const models = await initDatabase();
  return models;
};

module.exports = {
  initDatabase,
  getModels,
  // Helper function untuk mendapatkan User model
  getUserModel: async () => {
    const models = await getModels();
    return models ? models.User : null;
  }
};