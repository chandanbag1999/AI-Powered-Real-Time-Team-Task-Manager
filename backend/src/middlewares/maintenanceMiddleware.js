const SystemSettings = require('../models/SystemSettingsModel');
const { logSecurityEvent } = require('../utils/securityLogger');

// Middleware to check if the system is in maintenance mode
// If maintenance mode is enabled, only admins can access the system
const maintenanceCheck = async (req, res, next) => {
  try {
    // Skip maintenance check for login, register, and admin routes
    if (
      req.path.startsWith('/auth/login') || 
      req.path.startsWith('/auth/register') || 
      req.path.startsWith('/admin')
    ) {
      return next();
    }

    // Get system settings
    const settings = await SystemSettings.getSettings();
    
    // If maintenance mode is enabled and user is not an admin, block access
    if (settings.maintenanceMode && req.user && req.user.role !== 'admin') {
      // Log the blocked access attempt
      logSecurityEvent('MAINTENANCE_MODE_ACCESS_BLOCKED', {
        userId: req.user._id,
        path: req.path
      }, req);
      
      return res.status(503).json({ 
        message: "System is currently in maintenance mode. Please try again later.",
        maintenanceMode: true
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    // If there's an error checking maintenance mode, allow the request to proceed
    next();
  }
};

module.exports = { maintenanceCheck }; 