const sequelize = require("../config/database");
const User = require("./user");
const Task = require("./Task");
const ChecklistItem = require("./ChecklistItem");
const SharedTask = require("./SharedTask");

// User-Task Relationship
User.hasMany(Task, { foreignKey: "user_id", onDelete: "CASCADE" });
Task.belongsTo(User, { foreignKey: "user_id" });

// Task-Checklist Relationship
Task.hasMany(ChecklistItem, { foreignKey: "task_id", onDelete: "CASCADE" });
ChecklistItem.belongsTo(Task, { foreignKey: "task_id" });

// Task-SharedTask Relationship
Task.hasMany(SharedTask, { foreignKey: "task_id", onDelete: "CASCADE" });
SharedTask.belongsTo(Task, { foreignKey: "task_id" });
SharedTask.belongsTo(User, { foreignKey: "owner_id", as: "Owner" });

const initDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Database models synchronized");
  } catch (error) {
    console.error("❌ Error syncing database:", error);
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
