const { Task, SharedTask } = require("../models");
const { Op } = require("sequelize");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Find tasks with reminders
    const tasks = await Task.findAll({
      where: {
        [Op.or]: [
          { user_id: userId },
          { "$SharedTasks.collaborator_email$": req.user.email },
        ],
        reminder: { [Op.ne]: "none" },
        deadline: { [Op.gte]: now },
      },
      include: [
        {
          model: SharedTask,
          attributes: [],
        },
      ],
    });

    // Calculate notifications
    const notifications = tasks.reduce((acc, task) => {
      const deadline = new Date(task.deadline);
      const timeDiff = deadline.getTime() - now.getTime();
      let shouldNotify = false;
      let message = "";

      if (task.reminder === "1-hour" && timeDiff <= 3600000 && timeDiff > 0) {
        shouldNotify = true;
        message = `Tugas "${task.title}" akan deadline dalam 1 jam`;
      } else if (
        task.reminder === "1-day" &&
        timeDiff <= 86400000 &&
        timeDiff > 0
      ) {
        shouldNotify = true;
        message = `Tugas "${task.title}" akan deadline besok`;
      } else if (task.reminder === "same-day") {
        const today = now.toDateString();
        const deadlineDay = deadline.toDateString();
        if (today === deadlineDay) {
          shouldNotify = true;
          message = `Tugas "${task.title}" deadline hari ini`;
        }
      }

      if (shouldNotify) {
        acc.push({
          taskId: task.id,
          title: task.title,
          message,
          time: now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          deadline: task.deadline,
        });
      }

      return acc;
    }, []);

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting notifications",
    });
  }
};

module.exports = {
  getNotifications,
};
