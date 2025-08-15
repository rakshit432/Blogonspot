const express = require("express");
const router = express.Router();
const { Blogs, Users, Subscriptions } = require("../db");
const { userAuth } = require("../middlewares/userauth");

// Get all users (no passwords) --------

router.get("/users", async (req, res) => {
    try {
        const users = await Users.find().select("-password");
        res.json(users);
    } catch (err) {
        console.error("Get users error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Ban a user (admin only)
router.put("/users/:id/ban", userAuth("admin"), async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User banned", user });
    } catch (err) {
        console.error("Ban user error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Unban a user (admin only)
router.put("/users/:id/unban", userAuth("admin"), async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User unbanned", user });
    } catch (err) {
        console.error("Unban user error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete a post (admin only)
router.delete('/posts/:id', userAuth("admin"), async (req, res) => {
    try {
        const post = await Blogs.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Also remove post reference from its author if exists
        if (post.author) {
            await Users.findByIdAndUpdate(post.author, { $pull: { posts: post._id } });
        }

        res.json({ message: 'Post deleted', post });
    } catch (err) {
        console.error("Delete post error:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete a comment (admin or comment owner) - route preserved from original logic
router.delete('/deletecomment/:blogId/:commentId', userAuth("admin"), async (req, res) => {
    const { blogId, commentId } = req.params;

    try {
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const comment = blog.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // preserve original logic: allow deletion if comment owner or admin
        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        comment.remove();
        await blog.save();

        res.status(200).json({ message: 'Comment deleted successfully', blog });
    } catch (err) {
        console.error("Admin delete comment error:", err);
        res.status(500).json({ message: 'Error deleting comment', error: err.message });
    }
});

// Dashboard stats (admin only)
router.get('/dashboard', userAuth("admin"), async (req, res) => {
    try {
        const totalUsers = await Users.countDocuments();
        const totalBlogs = await Blogs.countDocuments();
        const publishedBlogs = await Blogs.countDocuments({ isPublished: true });
        const unpublishedBlogs = totalBlogs - publishedBlogs;
        const totalSubscriptions = await Subscriptions.countDocuments({ isActive: true });

        const recentUsers = await Users.find()
            .sort({ since: -1 })
            .limit(5)
            .select('username email since');

        const recentBlogs = await Blogs.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('author', 'username');

        res.json({
            stats: { totalUsers, totalBlogs, publishedBlogs, unpublishedBlogs, totalSubscriptions },
            recentUsers,
            recentBlogs
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ message: 'Error fetching dashboard data', error });
    }
});

// ---------------- Create admin content ----------------
// Public: list admin-created content (used by frontend home feed)
router.get('/create-content', async (req, res) => {
    try {
        // Find admin users
        const admins = await Users.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(u => u._id);

        const posts = await Blogs.find({
            isPublished: true,
            author: { $in: adminIds }
        })
        .populate('author', 'username')
        .sort({ createdAt: -1 });

        return res.json({ posts });
    } catch (error) {
        console.error("List admin content error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post('/create-content', userAuth("admin"), async (req, res) => {
    try {
        const { title, content, tags, isPublic } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        const newPost = new Blogs({
            title,
            content,
            author: req.user._id,
            tags,
            isPublic: isPublic !== undefined ? isPublic : true,
            isPublished: true
        });

        await newPost.save();

        res.status(201).json({ 
            message: "Admin content created successfully",
            post: newPost
        });
    } catch (error) {
        console.error("Create admin content error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Verify a creator ----------------
router.put('/verify-creator/:userId', userAuth("admin"), async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(
            req.params.userId,
            { isVerifiedCreator: true },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ 
            message: "Creator verified successfully",
            user: user
        });
    } catch (error) {
        console.error("Verify creator error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Unverify a creator ----------------
router.put('/unverify-creator/:userId', userAuth("admin"), async (req, res) => {
    try {
        const user = await Users.findByIdAndUpdate(
            req.params.userId,
            { isVerifiedCreator: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ 
            message: "Creator unverified successfully",
            user: user
        });
    } catch (error) {
        console.error("Unverify creator error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Get all creators for admin ----------------
router.get('/creators', userAuth("admin"), async (req, res) => {
    try {
        const q = (req.query.search || '').trim();
        const cond = { isActive: true };
        if (q) {
            const regex = new RegExp(q, 'i');
            cond.$or = [{ username: regex }, { email: regex }];
        }
        const creators = await Users.find(cond)
            .select('username email creatorBio creatorCategory isVerifiedCreator subscribers since')
            .sort({ since: -1 });

        res.json(creators);
    } catch (error) {
        console.error("Get creators error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
