const express = require("express");
const AuthController = require("../controllers/AuthController");
const {protect, adminOnly} = require("../middlewares/authMiddleware");




const router = express.Router();


router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

router.get('/me', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Welcome to your dashboard',
    user: req.user
  });
});

module.exports = router;
