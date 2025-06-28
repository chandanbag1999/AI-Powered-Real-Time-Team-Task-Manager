const express = require("express");
const adminController = require("../controllers/adminController");

const router = express.Router();

// Public routes that don't require authentication
router.get("/maintenance", adminController.getMaintenanceStatus);



module.exports = router; 