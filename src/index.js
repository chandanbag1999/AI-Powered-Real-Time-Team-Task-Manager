const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();
connectDB();

app.use(express.json());
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("API is Running....");
});
app.use("/api/auth", authRoutes);



// listen server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
