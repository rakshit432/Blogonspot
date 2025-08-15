require("dotenv").config();
const express = require("express");
const { json } = require("express");
const cors = require("cors");
const { connect } = require("mongoose");
const { Users, Blogs } = require("./db");

// Import routes
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const subscriptionRoutes = require("./routes/subscription");
const app = express();

// CORS: allow frontend origin(s)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FALLBACKS = ["http://localhost:5174", "https://blogonspot.vercel.app", "http://localhost:3000"];
const ALLOWED_ORIGINS = Array.from(new Set([FRONTEND_URL, ...FALLBACKS]));

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (like curl/postman) with no origin
      if (!origin) return cb(null, true);
      const ok = ALLOWED_ORIGINS.includes(origin);
      if (ok) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(json());

// Mount routes
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);

// Basic health check
app.get("/", (req, res) => res.send("API up"));

// ---------- Alias routes to support frontend fallbacks ----------
// Public user profile alias (non-/api) used as a fallback in frontend
app.get("/profile/:id", async (req, res) => {
  try {
    const user = await Users.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Alias /profile error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public users listing/search alias
// Supports: /api/users?search=foo (or ?q=foo)
app.get("/api/users", async (req, res) => {
  try {
    const q = (req.query.search || req.query.q || "").trim();
    const cond = { isActive: true };
    if (q) {
      const regex = new RegExp(q, "i");
      cond.$or = [{ username: regex }, { email: regex }];
    }
    const users = await Users.find(cond)
      .select("username avatar creatorBio creatorCategory isVerifiedCreator since")
      .sort({ since: -1 })
      .limit(50);
    return res.json(users);
  } catch (err) {
    console.error("Alias /api/users error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public posts listing/search alias
// Supports:
//   /api/posts?author=<id>
//   /api/posts?search=foo  (or ?q=foo)
//   /api/posts?public=true (or ?ispublic=true)
app.get("/api/posts", async (req, res) => {
  try {
    const { author } = req.query;
    const search = (req.query.search || req.query.q || "").trim();
    const pub = (req.query.public || req.query.ispublic || "").toString();

    const filter = { isPublished: true };
    if (author) filter.author = author;
    if (pub === "true") filter.isPublic = true;
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
      // When searching, restrict to public posts by default
      filter.isPublic = true;
    }

    const posts = await Blogs.find(filter)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(posts);
  } catch (err) {
    console.error("Alias /api/posts error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Explicit search alias: /api/posts/search?q=foo
app.get("/api/posts/search", async (req, res) => {
  try {
    const q = (req.query.q || req.query.search || "").trim();
    if (!q) return res.json([]);
    const regex = new RegExp(q, "i");
    const posts = await Blogs.find({
      isPublished: true,
      isPublic: true,
      $or: [{ title: regex }, { content: regex }, { tags: regex }],
    })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(posts);
  } catch (err) {
    console.error("Alias /api/posts/search error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Public: get a single post by id
app.get("/api/posts/:id", async (req, res) => {
  try {
    const post = await Blogs.findById(req.params.id)
      .populate("author", "username avatar");
    if (!post) return res.status(404).json({ message: "Post not found" });
    // if (!post.isPublished) return res.status(404).json({ message: "Post not found" });
    if (!post.isPublic) return res.status(403).json({ message: "This post is subscriber-only" });
    return res.json(post);
  } catch (err) {
    console.error("GET /api/posts/:id error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });

  }
});

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
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at: http://localhost:${PORT}`);
    console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  });
}
