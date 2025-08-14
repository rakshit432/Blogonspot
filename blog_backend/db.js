const mongoose = require("mongoose");

// User Schema ---------------------------------------------------------------------------------------

const usersSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: { type: String, default: "user" },
    since: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    bio: { type: String, default: "" },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blogs" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blogs" }],
    // Subscription model additions
    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    creatorBio: { type: String, default: "" },
    creatorCategory: { type: String, default: "" }, // e.g., "tech", "lifestyle", "business"
    isVerifiedCreator: { type: Boolean, default: false } // Admin verified creators
});

// Blog Schema ------------------------------------------------------------------------------------------

const blogsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    tags: [{ type: String }],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
            comment: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    isPublished: { type: Boolean, default: false },
    // Subscription model additions
    isPublic: { type: Boolean, default: true }, // true = public, false = subscribers only
}, { timestamps: true });

// Subscription Schema ----------------------------------------------------------------------------------

const subscriptionSchema = new mongoose.Schema({
    subscriber: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    startDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure unique subscription per user-creator pair
subscriptionSchema.index({ subscriber: 1, creator: 1 }, { unique: true });

const Users = mongoose.model("Users", usersSchema);
const Blogs = mongoose.model("Blogs", blogsSchema);
const Subscriptions = mongoose.model("Subscriptions", subscriptionSchema);

module.exports = { Users, Blogs, Subscriptions };