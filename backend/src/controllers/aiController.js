const geminiPrompt = require("../config/gemini");
const Task = require("../models/TaskModel");

exports.suggestSubtasks = async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: "Task title is required" });
  }

  const prompt = `Break this task into 3-5 clear, actionable subtasks:\n"${title}"`;

  try {
    const aiResponse = await geminiPrompt(prompt);

    // Clean output into an array
    const subtasks = aiResponse
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]?\s*/, "").trim())
      .filter((line) => line.length > 0);

    res.status(200).json({ subtasks });
  } catch (error) {
    res.status(500).json({ message: "Gemini AI failed", error: error.message });
  }
};

exports.parseReminder = async (req, res) => {
  const { reminder } = req.body;

  if (!reminder || reminder.trim().length < 3) {
    return res.status(400).json({ message: "Reminder text is required" });
  }

  // Format today's date (e.g. 2025-06-09)
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Today is ${today}. Convert this reminder into a YYYY-MM-DD format only. Reminder: "${reminder}". Just return the date string.`;

  try {
    const aiResponse = await geminiPrompt(prompt);

    // Basic cleanup
    const dueDate = aiResponse.match(/\d{4}-\d{2}-\d{2}/)?.[0];

    if (!dueDate) {
      return res
        .status(422)
        .json({ message: "AI could not parse a valid date" });
    }

    res.status(200).json({ dueDate });
  } catch (error) {
    console.error("Reminder parse error:", error);
    res
      .status(500)
      .json({ message: "Failed to parse reminder", error: error.message });
  }
};

exports.extractTasksFromNote = async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim().length < 5) {
    return res.status(400).json({ message: "Note is required" });
  }

  const prompt = `Convert this paragraph into 3-7 clear, actionable tasks. Just list them, do not include any explanation:\n\n"${note}"`;

  try {
    const aiResponse = await geminiPrompt(prompt);

    const tasks = aiResponse
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]?\s*/, "").trim())
      .filter((line) => line.length > 0);

    res.status(200).json({ tasks });
  } catch (err) {
    console.error("Note-to-tasks error:", err);
    res
      .status(500)
      .json({ message: "AI failed to extract tasks", error: err.message });
  }
};

exports.parseSearchQuery = async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim().length < 3) {
    return res.status(400).json({ message: "Search query is required" });
  }

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Today is ${today}. Convert the following search string into a MongoDB-compatible JSON filter object for a task manager app. 
  IMPORTANT: Do not use MongoDB-specific functions like ISODate(), ObjectId(), etc. Instead, use standard ISO date strings in quotes for dates.
  Output only the JSON object, nothing else:\n\n"${query}"`;

  try {
    const aiResponse = await geminiPrompt(prompt);

    // Try to extract valid JSON
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (!match)
      return res.status(422).json({ message: "Could not extract filter" });

    // Clean any MongoDB-specific syntax that might have been generated
    let jsonStr = match[0];
    // Replace ISODate("...") with the string date
    jsonStr = jsonStr.replace(/ISODate\(\"([^\"]+)\"\)/g, '"$1"');
    // Replace ObjectId("...") with the string id
    jsonStr = jsonStr.replace(/ObjectId\(\"([^\"]+)\"\)/g, '"$1"');
    // Replace NumberInt(...) and NumberLong(...) with the number
    jsonStr = jsonStr.replace(/NumberInt\((\d+)\)/g, "$1");
    jsonStr = jsonStr.replace(/NumberLong\((\d+)\)/g, "$1");

    try {
      const filter = JSON.parse(jsonStr);

      res.status(200).json({ filter });
    } catch (parseError) {
      console.error("JSON parse error:", parseError, jsonStr);
      res.status(422).json({
        message: "AI generated invalid JSON",
        error: parseError.message,
        rawResponse: aiResponse,
      });
    }
  } catch (err) {
    console.error("Search AI error:", err);
    res
      .status(500)
      .json({ message: "AI failed to parse query", error: err.message });
  }
};

exports.autoPrioritizeTask = async (req, res) => {
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  try {
    // Check if the GEMINI_API_KEY is set
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        message: "GEMINI_API_KEY is not configured on the server" 
      });
    }

    // Find the task
    let task;
    try {
      task = await Task.findById(taskId);
    } catch (dbError) {
      console.error("Database error finding task:", dbError);
      return res.status(500).json({ 
        message: "Database error finding task", 
        error: dbError.message 
      });
    }

    if (!task) {
      return res.status(404).json({ message: 'Task not found in database' });
    }

    // Format the due date if it exists, otherwise use "No due date"
    let dueDateString = "No due date";
    try {
      if (task.dueDate) {
        dueDateString = task.dueDate.toISOString().split('T')[0];
      }
    } catch (dateError) {
      console.error("Error formatting due date:", dateError);
      // Continue with the default "No due date"
    }

    // Make sure we have a title
    const taskTitle = task.title || "Untitled task";

    // Create a description for the AI to use
    const taskDescription = task.description || "No description";

    const prompt = `Based on this task information, determine the priority as one of: low, medium, high.
Respond with only one word - either "low", "medium", or "high".

Title: "${taskTitle}"
Description: "${taskDescription}"
Due Date: "${dueDateString}"`;

    console.log("Sending prompt to Gemini for task prioritization");

    // Call the AI service
    let aiResponse;
    try {
      aiResponse = await geminiPrompt(prompt);
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      return res.status(500).json({ 
        message: "AI service error", 
        error: aiError.message 
      });
    }

    if (!aiResponse) {
      return res.status(500).json({ message: "Empty response from AI service" });
    }

    console.log("Received response from Gemini:", aiResponse);

    const clean = aiResponse.trim().toLowerCase();

    if (!["low", "medium", "high"].includes(clean)) {
      console.error("Invalid priority response:", clean);
      return res.status(422).json({
        message: "AI response not a valid priority",
        rawResponse: aiResponse,
      });
    }

    res.status(200).json({ priority: clean });
  } catch (err) {
    console.error("Priority AI error:", err);
    res
      .status(500)
      .json({ 
        message: "Failed to auto-prioritize", 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
  }
};
