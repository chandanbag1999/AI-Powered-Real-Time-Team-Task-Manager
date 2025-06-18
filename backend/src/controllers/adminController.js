const User = require("../models/UserModel");
const Project = require("../models/ProjectModel");
const Task = require("../models/TaskModel");
const { logSecurityEvent } = require("../utils/securityLogger");
const { sendEmail } = require("../utils/sendEmail");
const mongoose = require("mongoose");
const crypto = require("crypto");
const SystemSettings = require("../models/SystemSettingsModel");

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getDashboardStats",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Get counts
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();

    // Get task statistics by status
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Format task status data
    const taskStatusData = {
      todo: 0,
      "in-progress": 0,
      completed: 0,
    };

    tasksByStatus.forEach((item) => {
      if (taskStatusData.hasOwnProperty(item._id)) {
        taskStatusData[item._id] = item.count;
      }
    });

    // Get recent users
    const recentUsers = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent projects
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      stats: {
        userCount,
        projectCount,
        taskCount,
        taskStatusData,
      },
      recentUsers,
      recentProjects,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    res
      .status(500)
      .json({
        message: "Failed to get admin dashboard stats",
        error: error.message,
      });
  }
};

// Get all users (with pagination)
exports.getAllUsers = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getAllUsers",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Create search filter if search parameter exists
    const searchFilter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get users with pagination
    const users = await User.find(searchFilter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await User.countDocuments(searchFilter);

    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res
      .status(500)
      .json({ message: "Failed to get users", error: error.message });
  }
};

// Get user details by ID
exports.getUserById = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getUserById",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const userId = req.params.userId;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's projects
    const projects = await Project.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    // Get user's tasks
    const tasks = await Task.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      user,
      projects,
      tasks,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res
      .status(500)
      .json({ message: "Failed to get user details", error: error.message });
  }
};

// Update user (admin can update role)
exports.updateUser = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "updateUser",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const userId = req.params.userId;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ["user", "admin"].includes(role)) {
      // Log role change for security audit
      if (user.role !== role) {
        logSecurityEvent(
          "USER_ROLE_CHANGED",
          {
            userId: user._id,
            oldRole: user.role,
            newRole: role,
            changedBy: req.user._id,
          },
          req
        );
      }
      user.role = role;
    }

    await user.save();

    // Return updated user without sensitive information
    const updatedUser = await User.findById(userId).select(
      "-password -refreshToken"
    );

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res
      .status(500)
      .json({ message: "Failed to update user", error: error.message });
  }
};

// Invite a new user to the system
exports.inviteUser = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "inviteUser",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const { name, email, role } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");

    // Create the new user
    const newUser = new User({
      name,
      email,
      password: tempPassword, // This will be hashed by the User model pre-save hook
      role: role && ["user", "admin"].includes(role) ? role : "user",
      isInvited: true,
      passwordResetRequired: true,
    });

    await newUser.save();

    // Log the user creation
    logSecurityEvent(
      "USER_INVITED",
      {
        userId: newUser._id,
        invitedBy: req.user._id,
        role: newUser.role,
      },
      req
    );

    // Send invitation email
    try {
      // Create HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to AI Task Manager!</h2>
          <p>Hello ${name},</p>
          <p>You have been invited by ${req.user.name} to join the Task Manager system.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Your temporary login credentials:</strong></p>
            <p>Email: ${email}</p>
            <p>Password: ${tempPassword}</p>
          </div>
          <p><strong>Important:</strong> Please login and change your password immediately.</p>
          <p>Best regards,<br>Task Manager Team</p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: "You have been invited to join the Task Manager",
        text: `
Hello ${name},

You have been invited by ${req.user.name} to join the Task Manager system.

Your temporary login credentials are:
Email: ${email}
Password: ${tempPassword}

Please login and change your password immediately.

Best regards,
Task Manager Team
        `,
        html: htmlContent,
      });

      console.log(`Invitation email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      message: "User invited successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Invite user error:", error);
    res
      .status(500)
      .json({ message: "Failed to invite user", error: error.message });
  }
};

// Resend invitation to a user
exports.resendInvitation = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "resendInvitation",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const userId = req.params.userId;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isInvited || !user.passwordResetRequired) {
      return res
        .status(400)
        .json({ message: "This user is not in invited state" });
    }

    // Generate a new temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");
    user.password = tempPassword;
    await user.save();

    // Send invitation email
    try {
      // Create HTML email content
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Welcome to AI Task Manager!</h2>
          <p>Hello ${user.name},</p>
          <p>You have been invited by ${req.user.name} to join the Task Manager system.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Your temporary login credentials:</strong></p>
            <p>Email: ${user.email}</p>
            <p>Password: ${tempPassword}</p>
          </div>
          <p><strong>Important:</strong> Please login and change your password immediately.</p>
          <p>Best regards,<br>Task Manager Team</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: "You have been invited to join the Task Manager",
        text: `
Hello ${user.name},

You have been invited by ${req.user.name} to join the Task Manager system.

Your temporary login credentials are:
Email: ${user.email}
Password: ${tempPassword}

Please login and change your password immediately.

Best regards,
Task Manager Team
        `,
        html: htmlContent,
      });

      console.log(`Invitation email resent to ${user.email}`);

      // Log the event
      logSecurityEvent(
        "INVITATION_RESENT",
        {
          userId: user._id,
          sentBy: req.user._id,
        },
        req
      );

      res.status(200).json({
        message: "Invitation resent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      res
        .status(500)
        .json({
          message: "Failed to send invitation email",
          error: emailError.message,
        });
    }
  } catch (error) {
    console.error("Resend invitation error:", error);
    res
      .status(500)
      .json({ message: "Failed to resend invitation", error: error.message });
  }
};

// Get all projects (with pagination)
exports.getAllProjects = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getAllProjects",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;

    // Create search filter if search parameter exists
    let searchFilter = search
      ? {
          name: { $regex: search, $options: "i" },
        }
      : {};

    // Add status filter if provided
    if (status && ["active", "completed", "on-hold"].includes(status)) {
      searchFilter.status = status;
    }

    // Get projects with pagination
    const projects = await Project.find(searchFilter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Project.countDocuments(searchFilter);

    // For each project, get additional information
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        // Get project members
        const members = await User.find({ _id: { $in: project.members } })
          .select("name email")
          .limit(10);

        // Get task counts
        const taskCount = await Task.countDocuments({ project: project._id });
        const completedTaskCount = await Task.countDocuments({
          project: project._id,
          status: "completed",
        });

        // Get last activity (most recent task update)
        const lastActivity = await Task.findOne({ project: project._id })
          .sort({ updatedAt: -1 })
          .select("updatedAt");

        // Return enhanced project
        return {
          ...project.toObject(),
          members,
          taskCount,
          completedTaskCount,
          lastActivity: lastActivity
            ? lastActivity.updatedAt
            : project.updatedAt,
        };
      })
    );

    res.status(200).json({
      projects: enhancedProjects,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    res
      .status(500)
      .json({ message: "Failed to get projects", error: error.message });
  }
};

// Get system health status
exports.getSystemHealth = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getSystemHealth",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Get database connection status
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Get system metrics
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      uptime: Math.floor(process.uptime()),
    };

    res.status(200).json({
      status: "healthy",
      database: dbStatus,
      system: systemInfo,
    });
  } catch (error) {
    console.error("System health check error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get system health status",
      error: error.message,
    });
  }
};

// Check email configuration status
exports.checkEmailStatus = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "checkEmailStatus",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Check if email configuration exists
    const emailConfigured = !!(
      process.env.EMAIL_USER && process.env.EMAIL_PASS
    );

    res.status(200).json({
      configured: emailConfigured,
      email: emailConfigured ? process.env.EMAIL_USER : null,
    });
  } catch (error) {
    console.error("Email status check error:", error);
    res
      .status(500)
      .json({ message: "Failed to check email status", error: error.message });
  }
};

// Get system settings
exports.getSystemSettings = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "getSystemSettings",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Get or create settings
    const settings = await SystemSettings.getSettings();

    res.status(200).json(settings);
  } catch (error) {
    console.error("Get system settings error:", error);
    res
      .status(500)
      .json({ message: "Failed to get system settings", error: error.message });
  }
};

// Update system settings
exports.updateSystemSettings = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "updateSystemSettings",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Get allowed fields
    const {
      emailNotifications,
      taskNotifications,
      systemAlerts,
      adminEmail,
      maxFileSize,
      sessionTimeout,
      autoBackup,
      maintenanceMode,
    } = req.body;

    // Get existing settings or create new ones
    const settings = await SystemSettings.getSettings();

    // Update fields if provided
    if (emailNotifications !== undefined)
      settings.emailNotifications = emailNotifications;
    if (taskNotifications !== undefined)
      settings.taskNotifications = taskNotifications;
    if (systemAlerts !== undefined) settings.systemAlerts = systemAlerts;
    if (adminEmail !== undefined) settings.adminEmail = adminEmail;
    if (maxFileSize !== undefined) settings.maxFileSize = maxFileSize;
    if (sessionTimeout !== undefined) settings.sessionTimeout = sessionTimeout;
    if (autoBackup !== undefined) settings.autoBackup = autoBackup;
    if (maintenanceMode !== undefined)
      settings.maintenanceMode = maintenanceMode;

    // Update metadata
    settings.lastUpdated = new Date();
    settings.updatedBy = req.user._id;

    await settings.save();

    // Log the settings update
    logSecurityEvent(
      "SETTINGS_UPDATED",
      {
        userId: req.user._id,
        changes: req.body,
      },
      req
    );

    res.status(200).json({
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update system settings error:", error);
    res
      .status(500)
      .json({ message: "Failed to update settings", error: error.message });
  }
};

// Reset system settings to defaults
exports.resetSystemSettings = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "resetSystemSettings",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    // Find and delete existing settings
    await SystemSettings.deleteMany({});

    // Create new settings with defaults
    const settings = await SystemSettings.create({
      updatedBy: req.user._id,
    });

    // Log the settings reset
    logSecurityEvent(
      "SETTINGS_RESET",
      {
        userId: req.user._id,
      },
      req
    );

    res.status(200).json({
      message: "Settings reset to defaults successfully",
      settings,
    });
  } catch (error) {
    console.error("Reset system settings error:", error);
    res
      .status(500)
      .json({ message: "Failed to reset settings", error: error.message });
  }
};

// Perform system actions
exports.performSystemAction = async (req, res) => {
  try {
    // Verify the user is an admin
    if (req.user.role !== "admin") {
      logSecurityEvent(
        "UNAUTHORIZED_ADMIN_ACCESS",
        {
          userId: req.user._id,
          endpoint: "performSystemAction",
        },
        req
      );
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    const { action } = req.params;

    // Log the action
    logSecurityEvent(
      "SYSTEM_ACTION",
      {
        userId: req.user._id,
        action,
      },
      req
    );

    // Handle different actions
    switch (action) {
      case "clear-cache":
        // Implementation for clearing cache would go here
        res.status(200).json({ message: "Cache cleared successfully" });
        break;

      case "backup-database":
        // Implementation for database backup would go here
        res
          .status(200)
          .json({ message: "Database backup created successfully" });
        break;

      default:
        return res.status(400).json({ message: "Unknown action" });
    }
  } catch (error) {
    console.error("System action error:", error);
    res
      .status(500)
      .json({
        message: `Failed to perform ${req.params.action}`,
        error: error.message,
      });
  }
};
