const Task = require("../models/TaskModel");

exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, project } = req.body;

  if (!title || !project) {
    return res.status(400).json({ message: 'Task title and project required' });
  }

  try {
    const task = await Task.create({
      title,
      description,
      status, 
      priority,
      dueDate,
      project,
      createdBy: req.user._id,
    })

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Task creation failed', error: error.message });
  }

};

// GET ALL (Tasks from one project)
exports.getAllTasks = async (req, res) => {

  const projectId = req.params.projectId;
  const userId  = req.user._id;
  
  try {
    const task = await Task.find({
      project: projectId,
      createdBy: userId,
    }).sort({ createdAt: -1})  
    
    

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  const taskId = req.params.taskId;
  const userId = req.user._id;

  try {
    const task = await Task.findOne({
      _id: taskId,
      createdBy: userId
    }) 

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Failed to get tasks', error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  const taskId = req.params.taskId;
  
  try {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: req.user._id },
      req.body,
      { new: true }
    );

    if(!task) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {

  const taskId = req.params.taskId;
  const userId = req.user._id;
  
  try {
    const task = await Task.findOneAndDelete({
      _id: taskId,
      createdBy: userId
    }) 

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task delete Successfully ✅'});
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }

};