const { DataTypes } = require("sequelize");
const getSequelize = require("../config/database");
const sequelize = getSequelize();

const ChecklistItem = sequelize.define(
  "ChecklistItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "order",
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "checklist_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ChecklistItem;