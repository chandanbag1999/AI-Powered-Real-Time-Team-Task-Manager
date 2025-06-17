const express = require("express");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const { protect } = require("../middlewares/authMiddleware"); 


const Router = express.Router();

Router.route("/")
  .post(protect, projectController.createProject)
  .get(protect, projectController.getAllProjects);

Router.route("/:id")
  .get(protect, projectController.getProjectById)
  .put(protect, projectController.updateProject)
  .delete(protect, projectController.deleteProject);

// Get tasks for a specific project
Router.get("/:projectId/tasks", protect, taskController.getTasks);

module.exports = Router;
