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


router.get('/me', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Welcome to your dashboard',
    user: req.user
  });
});

module.exports = router;
