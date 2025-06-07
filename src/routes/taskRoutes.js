const express = require('express');
const { protect } = require("../middlewares/authMiddleware");
const TaskController = require("../controllers/taskController");
const upload = require('../middlewares/upload');

const router = express.Router();

router.post("/", protect, upload.single('file'), TaskController.createTask)
router.get("/:projectId", protect, TaskController.getTasks)
router.route("/task/:taskId")
  .get(protect, TaskController.getTaskById)
  .put(protect, upload.single('file'), TaskController.updateTask)
  .delete(protect, TaskController.deleteTask)

router.delete("/task/:taskId/file", protect, TaskController.deleteTaskFile)
module.exports = router;