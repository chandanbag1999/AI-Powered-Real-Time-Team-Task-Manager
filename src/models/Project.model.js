const {mongoose, Schema} = require("mongoose");


const projectSchema = new Schema({
  name: {
    type: String,
    required: [true, "Project name is required"],
  },
  description: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold'],
    default: 'active',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
},{ timestamps: true });

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
