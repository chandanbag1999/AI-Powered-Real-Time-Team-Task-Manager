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

    const io = req.app.get('io');             // access soket.io
    io.to(project).emit('new-task', task);   // Emit real-time update to project room

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Task creation failed', error: error.message });
  }

};

// GET ALL (Tasks from one project)
exports.getTasks = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { status, priority, dueDate, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    // Filters
    const filter = {
      project: projectId,
      createdBy: req.user._id
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (dueDate) filter.dueDate = dueDate;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Handle sorting
    let sortOption = {};
    if (sort.startsWith('-')) {
      sortOption[sort.substring(1)] = -1; // descending order
    } else {
      sortOption[sort] = 1; // ascending order
    }

    const tasks = await Task.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Task.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({
        total: 0,
        page: pageNum,
        pages: 0,
        limit: limitNum,
        tasks: []
      });
    }

    res.status(200).json({
      total,
      page: pageNum,
      pages,
      limit: limitNum,
      tasks
    });

  } catch (error) {
    res.status(500).json({ message: 'Task fetch failed', error: error.message });
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

    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-update', task);   // Emit real-time update

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

    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-deleted', task._id);   // Send only ID

    res.status(200).json({ message: 'Task delete Successfully ✅'});
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }

};