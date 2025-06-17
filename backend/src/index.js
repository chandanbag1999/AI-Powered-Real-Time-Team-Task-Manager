const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with proper CORS settings
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Allow multiple origins including 127.0.0.1
    methods: ["GET", "POST"],
    credentials: true, // Allow credentials
  },
  path: '/socket.io', // Explicitly set the Socket.IO path
});

// Store io in app to access inside controller
app.set('io', io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], // Match Socket.IO CORS settings
  credentials: true, // Allow credentials
}));

// Routes
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const aiRoutes = require("./routes/aiRoutes");



app.get("/", (req, res) => {
  res.send("API is Running....");
});
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use('/api/ai', aiRoutes);



// Socket.io Connection
io.on("connection", (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined room: ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });  
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} ✅`);
});
