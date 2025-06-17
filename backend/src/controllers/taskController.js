const Task = require("../models/TaskModel");
const cloudinary = require("../config/cloudinary");

exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate, project } = req.body;

  if (!title || !project) {
    return res.status(400).json({ message: 'Task title and project required' });
  }

  try {
    let fileUrl = null;
    let publicId = null;

    if (req.file) {
      fileUrl = req.file.path;
      publicId = req.file.filename;
    }

    const task = await Task.create({
      title,
      description,
      status, 
      priority,
      dueDate,
      project,
      fileUrl,
      filePublicId: publicId,
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
    const task = await Task.findOne({
      _id: taskId, 
      createdBy: req.user._id,
    });

    if(!task) return res.status(404).json({ message: 'Task not found' });

    // Handle file replacement
    if (req.file) {

      // Delete old file from Cloudinary if exists
      if (task.filePublicId) {
        await cloudinary.uploader.destroy(task.filePublicId, {
          resource_type: 'raw'
        });
      };

      // set new file values
      task.fileUrl = req.file.path;
      task.filePublicId = req.file.filename;
    };


    //  Update only provided fields (dynamic)
    const updatableFields = ['title', 'description', 'status', 'priority', 'dueDate'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    // real time emit
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-updated', task);   // Emit real-time update

    res.status(200).json(task);

  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {

  const taskId = req.params.taskId;
  const userId = req.user._id;
  
  try {
    const task = await Task.findOne({
      _id: taskId,
      createdBy: userId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete the file from Cloudinary if it exists
    if (task.filePublicId) {
      await cloudinary.uploader.destroy(task.filePublicId, {
        resource_type: 'raw'
      });
    }

    // Delete the task
    await task.deleteOne();

    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-deleted', task._id);   // Send only ID

    res.status(200).json({ message: 'Task delete Successfully ✅'});
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }

};

exports.deleteTaskFile = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const task = await Task.findOne({
      _id: taskId,
      createdBy: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!task.filePublicId) {
      return res.status(400).json({ message: 'No attachment found on this task' });
    }

    // Delete file from Cloudinary
    await cloudinary.uploader.destroy(task.filePublicId, {
      resource_type: 'raw'
    });

    // Remove from task document
    task.fileUrl = null;
    task.filePublicId = null;
    await task.save()


    // Emit real-time update (optional)
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-updated', task);

    res.status(200).json({ message: 'Attachment removed successfully ✅', task });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete attachment', error: err.message });
  }
}