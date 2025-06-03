const rateLimit = require('express-rate-limit');

// Rate limiter for password reset request (forgot password)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour per IP
  message: {
    status: 429,
    message: 'Too many password reset requests. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password reset attempts
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour per IP
  message: {
    status: 429,
    message: 'Too many password reset attempts. Please try again in an hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  forgotPasswordLimiter,
  resetPasswordLimiter
}; 