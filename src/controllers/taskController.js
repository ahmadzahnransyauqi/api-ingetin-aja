const { Task, ChecklistItem, SharedTask, User } = require("../models");
const { Op } = require("sequelize");

const getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tasks owned by user
    const ownedTasks = await Task.findAll({
      where: { user_id: userId },
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: SharedTask,
          attributes: ["id", "collaborator_email", "shared_at"],
        },
      ],
      order: [["deadline", "ASC"]],
    });

    // Get tasks shared with user
    const sharedTasks = await Task.findAll({
      include: [
        {
          model: SharedTask,
          where: { collaborator_email: req.user.email },
          attributes: [],
        },
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["deadline", "ASC"]],
    });

    res.json({
      success: true,
      ownedTasks,
      sharedTasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching tasks",
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findOne({
      where: {
        id,
        [Op.or]: [
          { user_id: userId },
          { "$SharedTasks.collaborator_email$": req.user.email },
        ],
      },
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: SharedTask,
          attributes: ["id", "collaborator_email", "shared_at"],
        },
        {
          model: User,
          as: "User",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching task",
    });
  }
};

const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      deadline,
      priority,
      status,
      reminder,
      checklist,
      sharedWith,
    } = req.body;

    // Create task
    const task = await Task.create({
      title,
      description,
      deadline,
      priority,
      status,
      reminder,
      user_id: userId,
    });

    // Create checklist items if provided
    if (checklist && Array.isArray(checklist)) {
      const checklistItems = checklist.map((item, index) => ({
        text: item.text,
        completed: item.completed || false,
        order: index,
        task_id: task.id,
      }));

      await ChecklistItem.bulkCreate(checklistItems);
    }

    // Create shared tasks if provided
    if (sharedWith && Array.isArray(sharedWith)) {
      const sharedTasks = sharedWith.map((email) => ({
        task_id: task.id,
        owner_id: userId,
        collaborator_email: email,
      }));

      await SharedTask.bulkCreate(sharedTasks);
    }

    // Get complete task with relations
    const completeTask = await Task.findByPk(task.id, {
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: SharedTask,
          attributes: ["id", "collaborator_email", "shared_at"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: completeTask,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating task",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      title,
      description,
      deadline,
      priority,
      status,
      reminder,
      checklist,
      sharedWith,
    } = req.body;

    // Find task
    const task = await Task.findOne({
      where: {
        id,
        user_id: userId, // Only owner can update
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    // Update task
    await task.update({
      title,
      description,
      deadline,
      priority,
      status,
      reminder,
    });

    // Update checklist items
    if (checklist && Array.isArray(checklist)) {
      // Delete existing checklist items
      await ChecklistItem.destroy({ where: { task_id: task.id } });

      // Create new checklist items
      const checklistItems = checklist.map((item, index) => ({
        text: item.text,
        completed: item.completed || false,
        order: index,
        task_id: task.id,
      }));

      await ChecklistItem.bulkCreate(checklistItems);
    }

    // Update shared tasks
    if (sharedWith && Array.isArray(sharedWith)) {
      // Delete existing shared tasks
      await SharedTask.destroy({ where: { task_id: task.id } });

      // Create new shared tasks
      const sharedTasks = sharedWith.map((email) => ({
        task_id: task.id,
        owner_id: userId,
        collaborator_email: email,
      }));

      await SharedTask.bulkCreate(sharedTasks);
    }

    // Get updated task with relations
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: SharedTask,
          attributes: ["id", "collaborator_email", "shared_at"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating task",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find task (only owner can delete)
    const task = await Task.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting task",
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const task = await Task.findOne({
      where: {
        id,
        [Op.or]: [
          { user_id: userId },
          { "$SharedTasks.collaborator_email$": req.user.email },
        ],
      },
      include: [
        {
          model: SharedTask,
          attributes: [],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.update({ status });

    res.json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating task status",
    });
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const { taskId, itemId } = req.params;
    const { completed } = req.body;
    const userId = req.user.id;

    // Check if user has access to the task
    const task = await Task.findOne({
      where: {
        id: taskId,
        [Op.or]: [
          { user_id: userId },
          { "$SharedTasks.collaborator_email$": req.user.email },
        ],
      },
      include: [
        {
          model: SharedTask,
          attributes: [],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or not authorized",
      });
    }

    const checklistItem = await ChecklistItem.findOne({
      where: {
        id: itemId,
        task_id: taskId,
      },
    });

    if (!checklistItem) {
      return res.status(404).json({
        success: false,
        message: "Checklist item not found",
      });
    }

    await checklistItem.update({ completed });

    res.json({
      success: true,
      message: "Checklist item updated successfully",
      checklistItem,
    });
  } catch (error) {
    console.error("Update checklist item error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating checklist item",
    });
  }
};

const getTasksWithFilter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;

    let whereClause = {
      user_id: userId,
    };

    // Apply filters
    switch (filter) {
      case "today":
        const today = new Date().toISOString().split("T")[0];
        whereClause.deadline = today;
        break;
      case "high":
        whereClause.priority = "high";
        break;
      case "in-progress":
        whereClause.status = "in-progress";
        break;
      case "done":
        whereClause.status = "done";
        break;
    }

    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: ChecklistItem,
          attributes: ["id", "text", "completed", "order"],
        },
        {
          model: SharedTask,
          attributes: ["id", "collaborator_email", "shared_at"],
        },
      ],
      order: [["deadline", "ASC"]],
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Filter tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Server error filtering tasks",
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateChecklistItem,
  getTasksWithFilter,
};
