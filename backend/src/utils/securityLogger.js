const fs = require('fs');
const path = require('path');
const SystemLog = require('../models/SystemLogModel');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const securityLogFile = path.join(logsDir, 'security.log');

// Log security-related events
const logSecurityEvent = async (event, data, req) => {
  try {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const logEntry = {
      timestamp,
      event,
      ip,
      userAgent,
      ...data
    };
    
    // Append to log file
    fs.appendFileSync(
      securityLogFile, 
      JSON.stringify(logEntry) + '\n',
      'utf8'
    );
    
    // Also log to SystemLog model
    try {
      await SystemLog.addLog(
        'info', 
        `Security event: ${event}`, 
        {
          ...data,
          ip,
          userAgent,
          event
        },
        data.userId || (req.user ? req.user._id : null)
      );
    } catch (dbError) {
      console.error('Error writing to SystemLog:', dbError);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SECURITY] ${event}:`, logEntry);
    }
  } catch (error) {
    console.error('Error writing security log:', error);
  }
};

module.exports = { logSecurityEvent }; 