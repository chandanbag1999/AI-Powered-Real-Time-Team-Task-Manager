const express = require("express");
const AuthController = require("../controllers/AuthController");
const {protect, adminOnly} = require("../middlewares/authMiddleware");
const {forgotPasswordLimiter, resetPasswordLimiter} = require("../middlewares/rateLimitMiddleware");




const router = express.Router();


router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refreshAccessToken );
router.post("/forgot-password", forgotPasswordLimiter, AuthController.forgotPassword);
router.post("/reset-password/:token", resetPasswordLimiter, AuthController.resetPassword);
router.put("/update-profile", protect, AuthController.updateProfile);
router.post("/logout", protect, AuthController.logout);


// test purpose
// router.get('/me', protect, adminOnly, (req, res) => {
//   res.json({
//     message: 'Welcome to your dashboard',
//     user: req.user
//   });
// });

// Get current user data
router.get('/me', protect, AuthController.getCurrentUser);

// Admin route for testing
router.get('/admin-dashboard', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Welcome to your admin dashboard',
    user: req.user
  });
});

module.exports = router;
