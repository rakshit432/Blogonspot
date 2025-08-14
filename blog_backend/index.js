require("dotenv").config();
import express, { json } from "express";
import cors from "cors";
import { connect } from "mongoose";

// Import routes (they will import models from ./db)
import userRoutes from "./routes/user";
import adminRoutes from "./routes/admin";
import subscriptionRoutes from "./routes/subscription";

const app = express();
app.use(cors());
app.use(json());

// Mount routes
app.use("blog_frontend\src\api\axios.js", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Basic health check
app.get("/", (req, res) => res.send("API up"));

// DB connect and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/blogonspot";

// Set default JWT secret if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";
}

// Set default admin key if not provided
if (!process.env.ADMIN_KEY) {
  process.env.ADMIN_KEY = "admin123";
}

console.log("🔧 Starting server with configuration:");
console.log(`   Port: ${PORT}`);
console.log(`   MongoDB: ${MONGO_URI}`);
console.log(`   JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log(`   Admin Key: ${process.env.ADMIN_KEY ? 'Set' : 'Not set'}`);

// Try to connect to MongoDB, but don't fail if it's not available
connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log("✅ MongoDB connected");
  startServer();
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  console.log("💡 Starting server without database (some features may not work)");
  console.log("   To enable full functionality, install MongoDB from: https://www.mongodb.com/try/download/community");
  startServer();
});

function startServer() {
  app.listen(5000, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}`);
    console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  });
}
