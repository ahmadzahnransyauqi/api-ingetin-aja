const { DataTypes } = require("sequelize");
const getSequelize = require("../config/database");
const sequelize = getSequelize();

const SharedTask = sequelize.define(
  "SharedTask",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborator_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "shared_tasks",
    timestamps: true,
    createdAt: "shared_at",
    updatedAt: false,
  }
);

module.exports = SharedTask;