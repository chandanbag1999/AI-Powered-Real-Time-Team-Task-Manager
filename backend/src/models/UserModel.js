const {mongoose, Schema} = require("mongoose");
const bcrypt = require("bcryptjs");


const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long"],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  refreshToken: {
    type: String,
    default: null,
  },
  passwordVersion: {
    type: Number,
    default: 0,
  },
  isInvited: {
    type: Boolean,
    default: false,
  },
  passwordResetRequired: {
    type: Boolean,
    default: false,
  },
  
}, {timestamps: true});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});


// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}


const User = mongoose.model("User", userSchema);

module.exports = User;

