const sequelize = require("../config/database");
const User = require("./user");
const Task = require("./Task");
const ChecklistItem = require("./ChecklistItem");
const SharedTask = require("./SharedTask");

User.hasMany(Task, { foreignKey: "user_id", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "user_id" });

Task.hasMany(ChecklistItem, { foreignKey: "task_id", onDelete: "CASCADE" });
ChecklistItem.belongsTo(Task, { foreignKey: "task_id" });

Task.hasMany(SharedTask, { foreignKey: "task_id", onDelete: "CASCADE" });
SharedTask.belongsTo(Task, { foreignKey: "task_id" });
SharedTask.belongsTo(User, { foreignKey: "owner_id", as: "Owner" });

const initDatabase = async () => {
  try {
   
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    
    console.log("⏩ Skipping sequelize.sync() to prevent timeout.");
    
  } catch (error) {
    console.error("❌ Error connecting to database:", error);

    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Task,
  ChecklistItem,
  SharedTask,
  initDatabase,
};