const Project = require("../models/ProjectModel");

exports.createProject = async (req, res) => {
  const { name, description, status } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Project name is required" });
  }

  try {
    const project = await Project.create({
      name,
      description,
      status,
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user._id });

    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getProjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findOne({ _id: id, createdBy: req.user._id });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  try {
    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: req.user._id },
      { name, description, status },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findOneAndDelete({ _id: id, createdBy: req.user._id });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
