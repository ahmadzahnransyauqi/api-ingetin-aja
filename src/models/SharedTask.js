const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SharedTask = sequelize.define(
  "SharedTask",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    collaborator_email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    tableName: "shared_tasks",
    timestamps: true,
    createdAt: "shared_at",
  }
);

module.exports = SharedTask;
