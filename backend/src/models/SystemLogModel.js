const { mongoose, Schema } = require("mongoose");

const systemLogSchema = new Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  level: {
    type: String,
    enum: ['info', 'warn', 'error'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  meta: {
    type: Object,
    default: {}
  },
  source: {
    type: String,
    default: 'system'
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Add index for efficient querying
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ level: 1 });
systemLogSchema.index({ source: 1 });

// Static method to add a log entry
systemLogSchema.statics.addLog = async function(level, message, meta = {}, userId = null) {
  return await this.create({
    level,
    message,
    meta,
    userId,
    timestamp: new Date()
  });
};

// Static method to get logs with pagination
systemLogSchema.statics.getLogs = async function(options = {}) {
  const { 
    page = 1, 
    limit = 50, 
    level, 
    source, 
    startDate, 
    endDate 
  } = options;
  
  const skip = (page - 1) * limit;
  
  // Build query filters
  const filter = {};
  if (level) filter.level = level;
  if (source) filter.source = source;
  
  // Date range filter
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  // Execute query with pagination
  const logs = await this.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
    
  // Get total count for pagination
  const total = await this.countDocuments(filter);
  
  return {
    logs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  };
};

const SystemLog = mongoose.model("SystemLog", systemLogSchema);

module.exports = SystemLog; 