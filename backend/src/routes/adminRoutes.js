const express = require("express");
const adminController = require("../controllers/adminController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply both protect and adminOnly middleware to all admin routes
router.use(protect);
router.use(adminOnly);

// Dashboard statistics
router.get("/dashboard", adminController.getDashboardStats);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);
router.put("/users/:userId", adminController.updateUser);
router.post("/users/invite", adminController.inviteUser);
router.post("/users/:userId/resend-invitation", adminController.resendInvitation);

// Project management
router.get("/projects", adminController.getAllProjects);

// System health and settings
router.get("/system-health", adminController.getSystemHealth);
router.get("/email-status", adminController.checkEmailStatus);
router.get("/settings", adminController.getSystemSettings);
router.put("/settings", adminController.updateSystemSettings);
router.post("/settings/reset", adminController.resetSystemSettings);
router.post("/system-actions/:action", adminController.performSystemAction);

module.exports = router; 