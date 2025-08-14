const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users, Blogs } = require("../db");
const { userAuth } = require("../middlewares/userauth");
require("dotenv").config();

// ---------------- Signup (user or admin with ADMIN_KEY) ----------------
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, role, adminKey } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: "username, email and password are required" });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Admin creation guarded by ADMIN_KEY
        let finalRole = "user";
        if (role === "admin") {
            if (adminKey !== process.env.ADMIN_KEY) {
                return res.status(403).json({ message: "Invalid admin key" });
            }
            finalRole = "admin";
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await Users.create({
            username,
            email,
            password: hashedPassword,
            role: finalRole
        });

        res.status(201).json({ message: `User registered successfully as ${finalRole}`, userId: newUser._id });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: 'Server error during signup', error: error.message });
    }
});

// ---------------- Login ----------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "email and password required" });

        const user = await Users.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // Update lastLogin
        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ 
            message: 'Login successful', 
            token,
            user_id: user._id,
            role: user.role
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ---------------- Get user profile ----------------
router.get("/profile/:id", async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ---------------- Edit Profile ----------------
router.put("/edit/:id", userAuth("user"), async (req, res) => {
    try {
        const userId = req.params.id;
        // Only allow editing own profile or admin
        if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Get all characteristics (profile fields) from the schema except sensitive/system fields
        // We'll exclude: _id, password (handled separately), role, since, lastLogin, isActive, bookmarks, following, followers, posts
        // But allow user to edit: username, email, password, avatar, bio
        const profileFields = [
            "username",
            "email",
            "password",
            "avatar",
            "bio"
        ];

        const updates = {};
        for (const key of profileFields) {
            if (req.body.hasOwnProperty(key)) {
                updates[key] = req.body[key];
            }
        }

        // If password is being updated,hash it.
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        // Update user with the new values
        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            updates,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Edit profile error:", error);
        res.status(500).json({ message: "Server error during profile update", error: error.message });
    }
});

// ---------------- Create a blog post (authenticated user) ----------------
router.post("/post", userAuth("user"), async (req, res) => {
    try {
        const { title, content, tags, isPublic } = req.body;
        if (!title || !content) return res.status(400).json({ error: "title and content required" });

        const newPost = new Blogs({
            title,
            content,
            author: req.user._id,
            tags,
            isPublic: isPublic !== undefined ? isPublic : true
        });

        await newPost.save();

        // push to user's posts
        const user = await Users.findById(req.user._id);
        if (user) {
            user.posts.push(newPost._id);
            await user.save();
        }

        res.status(201).json(newPost);
    } catch (err) {
        console.error("Create post error:", err);
        res.status(500).json({ error: "Failed to create post" });
    }
});

// ---------------- Comment on a post (authenticated) ----------------
router.post("/comment/:postId", userAuth("user"), async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment) return res.status(400).json({ error: "comment text required" });

        const post = await Blogs.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        post.comments.push({
            user: req.user._id,
            comment
        });

        await post.save();
        res.status(200).json({ message: "Comment added", post });
    } catch (err) {
        console.error("Add comment error:", err);
        res.status(500).json({ error: "Could not comment" });
    }
});

// ---------------- Like a post (authenticated) ----------------
router.post("/like/:postId", userAuth("user"), async (req, res) => {
    try {
        const post = await Blogs.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Prevent duplicate likes by the same user
        if (post.likes && post.likes.some(like => like.toString() === req.user._id.toString())) {
            return res.status(400).json({ error: "You have already liked this post" });
        }

        post.likes.push(req.user._id);

        await post.save();
        res.status(200).json({ message: "Like added", post });
    } catch (err) {
        console.error("Add like error:", err);
        res.status(500).json({ error: "Could not like post" });
    }
});

// ---------------- Delete a comment (authenticated owner) ----------------
router.delete("/comment/:postId/:commentId", userAuth("user"), async (req, res) => {
    try {
        const post = await Blogs.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post not found" });

        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        comment.remove();
        await post.save();
        res.status(200).json({ message: "Comment deleted", post });
    } catch (err) {
        console.error("Delete comment error:", err);
        res.status(500).json({ error: "Could not delete comment" });
    }
});

// ---------------- Follow a user ----------------
router.post("/follow/:targetUserId", userAuth("user"), async (req, res) => {
    try {
        const currentUserId = req.user._id.toString();
        const targetUserId = req.params.targetUserId;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }

        const currentUser = await Users.findById(currentUserId);
        const targetUser = await Users.findById(targetUserId);

        if (!targetUser) return res.status(404).json({ error: "User not found" });

        if (currentUser.following && currentUser.following.some(id => id.toString() === targetUserId)) {
            return res.status(400).json({ error: "Already following" });
        }

        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ message: "Followed user successfully" });
    } catch (err) {
        console.error("Follow error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ---------------- Unfollow a user ----------------
router.post("/unfollow/:targetUserId", userAuth("user"), async (req, res) => {
    try {
        const currentUserId = req.user._id.toString();
        const targetUserId = req.params.targetUserId;

        const currentUser = await Users.findById(currentUserId);
        const targetUser = await Users.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ error: "User not found" });

        currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ message: "Unfollowed user successfully" });
    } catch (err) {
        console.error("Unfollow error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
