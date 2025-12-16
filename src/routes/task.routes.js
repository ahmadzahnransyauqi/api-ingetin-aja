const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const { validateTask } = require("../middleware/validation");

router.use(protect);

router.get("/", taskController.getAllTasks);
router.get("/filter", taskController.getTasksWithFilter);
router.get("/:id", taskController.getTaskById);
router.post("/", validateTask, taskController.createTask);
router.put("/:id", validateTask, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.patch("/:id/status", taskController.updateTaskStatus);
router.patch("/:taskId/checklist/:itemId", taskController.updateChecklistItem);

module.exports = router;
