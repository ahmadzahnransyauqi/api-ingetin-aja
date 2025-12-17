const getSequelize = require("../config/database");
const sequelize = getSequelize();

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
SharedTask.belongsTo(User, { foreignKey: "owner_id" });

const initDatabase = async () => {
  try {
   
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    console.log("✅ Using existing database tables");
    
    return sequelize;
  } catch (error) {
    console.error("❌ Error connecting to database:", error.message);
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