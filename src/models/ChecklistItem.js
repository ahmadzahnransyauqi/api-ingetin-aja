const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChecklistItem = sequelize.define(
  "ChecklistItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "checklist_items",
    timestamps: true,
  }
);

module.exports = ChecklistItem;
