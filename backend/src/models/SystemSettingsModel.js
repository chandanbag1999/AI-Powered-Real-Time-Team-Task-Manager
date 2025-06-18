const { mongoose, Schema } = require("mongoose");

const systemSettingsSchema = new Schema({
  emailNotifications: {
    type: Boolean,
    default: true
  },
  taskNotifications: {
    type: Boolean,
    default: true
  },
  systemAlerts: {
    type: Boolean,
    default: true
  },
  adminEmail: {
    type: String,
    default: "admin@example.com"
  },
  maxFileSize: {
    type: Number,
    default: 5 // In MB
  },
  sessionTimeout: {
    type: Number,
    default: 60 // In minutes
  },
  autoBackup: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Ensure there's only one settings document
systemSettingsSchema.statics.getSettings = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  
  // If no settings exist, create default settings
  return await this.create({});
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

module.exports = SystemSettings; 