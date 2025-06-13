const express = require('express');
const aiController = require("../controllers/aiController");
const { protect } = require("../middlewares/authMiddleware");




const router = express.Router();

router.post("/suggest-subtasks", protect, aiController.suggestSubtasks);
router.post('/parse-reminder', protect, aiController.parseReminder);
router.post('/notes-to-tasks', protect, aiController.extractTasksFromNote);
router.post('/search-query', protect, aiController.parseSearchQuery);
router.post('/auto-prioritize', protect, aiController.autoPrioritizeTask);

module.exports = router;
