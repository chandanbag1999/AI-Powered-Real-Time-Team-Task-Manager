const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { logSecurityEvent } = require("../utils/securityLogger");

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Register failed", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};


exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!decoded) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ message: "Refresh token failed", error: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Log failed attempt
      logSecurityEvent('PASSWORD_RESET_REQUEST_FAILED', { email }, req);
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = jwt.sign(
      { 
        userId: user._id,
        version: user.passwordVersion || 0, // Track password version
        type: 'password-reset'
      },
      process.env.JWT_SECRET, 
      { expiresIn: '10m' }
    );
    
    // Create reset URL with the JWT token
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset.\n\nClick the link to reset your password:\n\n${resetURL}\n\nThis link will expire in 15 minutes.`;

    try {
      await sendEmail(user.email, "Password Reset", message);
      
      // Log successful request
      logSecurityEvent('PASSWORD_RESET_REQUEST_SUCCESS', { 
        userId: user._id,
        email: user.email 
      }, req);
      
      res.status(200).json({ message: 'Reset link sent to email ✅' });
    } catch (err) {
      // Log email sending failure
      logSecurityEvent('PASSWORD_RESET_EMAIL_FAILED', { 
        userId: user._id,
        email: user.email,
        error: err.message 
      }, req);
      
      res.status(500).json({ message: 'Failed to send email', error: err.message });
    }
  } catch (error) {
    logSecurityEvent('PASSWORD_RESET_REQUEST_ERROR', { 
      email,
      error: error.message 
    }, req);
    
    res.status(500).json({ message: "Password reset request failed", error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  
  try {
    // Verify the JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET 
    );
    
    // Check token type
    if (decoded.type !== 'password-reset') {
      logSecurityEvent('PASSWORD_RESET_INVALID_TOKEN_TYPE', { 
        tokenType: decoded.type 
      }, req);
      
      return res.status(400).json({ message: "Invalid token type" });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      logSecurityEvent('PASSWORD_RESET_USER_NOT_FOUND', { 
        userId: decoded.userId 
      }, req);
      
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if password version matches (prevents using old tokens after password change)
    if ((user.passwordVersion || 0) !== decoded.version) {
      logSecurityEvent('PASSWORD_RESET_TOKEN_INVALIDATED', { 
        userId: user._id,
        email: user.email,
        tokenVersion: decoded.version,
        currentVersion: user.passwordVersion 
      }, req);
      
      return res.status(400).json({ message: "Token has been invalidated by a previous password reset" });
    }
    
    // Update password and increment version
    user.password = password;
    user.passwordVersion = (user.passwordVersion || 0) + 1;
    await user.save();
    
    // Log successful password reset
    logSecurityEvent('PASSWORD_RESET_SUCCESS', { 
      userId: user._id,
      email: user.email 
    }, req);
    
    // Send confirmation email
    try {
      await sendEmail(
        user.email,
        "Password Changed Successfully",
        `Your password has been changed successfully. If you did not request this change, please contact support immediately.`
      );
    } catch (emailError) {
      // Just log the error but don't fail the request
      console.error("Failed to send password change confirmation:", emailError);
    }
    
    res.status(200).json({ message: 'Password updated successfully ✅' });
  } catch (error) {
    // Log specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logSecurityEvent('PASSWORD_RESET_TOKEN_EXPIRED', {}, req);
      return res.status(401).json({ message: "Reset token has expired" });
    }
    if (error.name === 'JsonWebTokenError') {
      logSecurityEvent('PASSWORD_RESET_INVALID_TOKEN', {
        error: error.message
      }, req);
      return res.status(401).json({ message: "Invalid reset token" });
    }
    
    // Log other errors
    logSecurityEvent('PASSWORD_RESET_ERROR', { 
      error: error.message 
    }, req);
    
    res.status(500).json({ message: "Password reset failed", error: error.message });
  }
};


exports.logout = async (req, res) => {
  try {
    // Clear refresh token in database
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    // User is already available from the auth middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user data without sensitive information
    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to retrieve user data", 
      error: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      user.password = password;
      user.passwordVersion = (user.passwordVersion || 0) + 1;
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};
