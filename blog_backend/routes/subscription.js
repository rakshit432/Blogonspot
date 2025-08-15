const express = require("express");
const router = express.Router();
const { Users, Blogs, Subscriptions } = require("../db");
const { userAuth } = require("../middlewares/userauth");

// ---------------- Get all creators (public info) ----------------
router.get("/creators", async (req, res) => {
    try {
        // Optional search support: /api/subscription/creators?search=foo (or ?q=foo)
        const q = (req.query.search || req.query.q || "").trim();
        const cond = { isActive: true };
        if (q) {
            const regex = new RegExp(q, "i");
            cond.$or = [
                { username: regex },
                { email: regex },
                { creatorCategory: regex },
                { creatorBio: regex }
            ];
        }

        const creators = await Users.find(cond)
            .select("username avatar creatorBio creatorCategory isVerifiedCreator subscribers")
            .sort({ since: -1 })
            .limit(50);
        
        res.json(creators);
    } catch (error) {
        console.error("Get creators error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Subscribe to a creator ----------------
router.post("/subscribe/:creatorId", userAuth("user"), async (req, res) => {
    try {
        const subscriberId = req.user._id;
        const creatorId = req.params.creatorId;

        // Prevent self-subscription
        if (subscriberId.toString() === creatorId) {
            return res.status(400).json({ message: "Cannot subscribe to yourself" });
        }

        // Validate creator
        const creator = await Users.findById(creatorId);
        if (!creator || !creator.isActive) {
            return res.status(404).json({ message: "Creator not found or inactive" });
        }

        // Upsert the subscription and set active
        const subscription = await Subscriptions.findOneAndUpdate(
            { subscriber: subscriberId, creator: creatorId },
            { $set: { isActive: true } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Update user relationships
        await Users.findByIdAndUpdate(subscriberId, { $addToSet: { subscriptions: creatorId } });
        await Users.findByIdAndUpdate(creatorId, { $addToSet: { subscribers: subscriberId } });

        return res.status(201).json({ message: "Successfully subscribed to creator", subscription });
    } catch (error) {
        console.error("Subscribe error:", error);
        // Duplicate key safety net
        if (error?.code === 11000) {
            return res.status(400).json({ message: "Already subscribed to this creator" });
        }
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Unsubscribe from a creator ----------------
router.delete("/unsubscribe/:creatorId", userAuth("user"), async (req, res) => {
    try {
        const subscriberId = req.user._id;
        const creatorId = req.params.creatorId;

        // Deactivate (do not delete) the subscription to preserve unique pair
        const subscription = await Subscriptions.findOneAndUpdate(
            { subscriber: subscriberId, creator: creatorId },
            { $set: { isActive: false } },
            { new: true }
        );

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        // Update user relationships
        await Users.findByIdAndUpdate(subscriberId, { $pull: { subscriptions: creatorId } });
        await Users.findByIdAndUpdate(creatorId, { $pull: { subscribers: subscriberId } });

        return res.json({ message: "Successfully unsubscribed from creator" });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Get user's subscriptions ----------------
router.get("/my-subscriptions", userAuth("user"), async (req, res) => {
    try {
        const userId = req.user._id;

        const subscriptions = await Subscriptions.find({
            subscriber: userId,
            isActive: true
        }).populate("creator", "username avatar creatorBio creatorCategory");

        res.json(subscriptions);
    } catch (error) {
        console.error("Get subscriptions error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Get subscription content (posts from subscribed creators + admin content) ----------------
router.get("/content", userAuth("user"), async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get user's subscriptions
        const user = await Users.findById(userId).populate("subscriptions");
        const subscribedCreatorIds = user.subscriptions.map(sub => sub._id);

        // Build query for accessible content
        const contentQuery = {
            isPublished: true,
            $or: [
                { isPublic: true }, // Public content from anyone
                { 
                    author: { $in: subscribedCreatorIds },
                    isPublic: false 
                } // Subscriber-only content from subscribed creators
            ]
        };

        const posts = await Blogs.find(contentQuery)
            .populate("author", "username avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Blogs.countDocuments(contentQuery);

        res.json({
            posts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalPosts: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error("Get subscription content error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// This route allows a user to update their creator profile information, specifically their bio and category.
// It expects 'creatorBio' and 'creatorCategory' in the request body.
// The route is protected and requires user authentication.
router.put("/update-creator-profile", userAuth("user"), async (req, res) => {
    try {
        const { creatorBio, creatorCategory } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!creatorBio || !creatorCategory) {
            return res.status(400).json({ message: "Creator bio and category are required" });
        }

        // Update the user's creator profile fields in the database
        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            {
                creatorBio,
                creatorCategory
            },
            { new: true }
        ).select("-password");

        res.json({ 
            message: "Creator profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Update creator profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Get creator's subscriber-only content ----------------
router.get("/creator/:creatorId/content", userAuth("user"), async (req, res) => {
    try {
        const userId = req.user._id;
        const creatorId = req.params.creatorId;

        // Check if user is subscribed to this creator
        const isSubscribed = await Subscriptions.exists({
            subscriber: userId,
            creator: creatorId,
            isActive: true
        });

        // Query content based on subscription status
        let contentQuery = {
            author: creatorId,
            isPublished: true
        };

        if (!isSubscribed) {
            // If not subscribed, only show public content
            contentQuery.isPublic = true;
        }

        const posts = await Blogs.find(contentQuery)
            .populate("author", "username avatar")
            .sort({ createdAt: -1 });

        res.json({
            posts,
            isSubscribed: !!isSubscribed
        });
    } catch (error) {
        console.error("Get creator content error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
