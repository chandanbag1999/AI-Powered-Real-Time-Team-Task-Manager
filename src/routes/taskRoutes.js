const express = require('express');
const { protect } = require("../middlewares/authMiddleware");
const TaskController = require("../controllers/taskController");

const router = express.Router();

router.post("/", protect, TaskController.createTask)
router.get("/:projectId", protect, TaskController.getAllTasks)
router.route("/task/:taskId")
  .get(protect, TaskController.getTaskById)
  .put(protect, TaskController.updateTask)
  .delete(protect, TaskController.deleteTask)

module.exports = router;