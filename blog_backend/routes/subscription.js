const express = require("express");
const router = express.Router();
const { Users, Blogs, Subscriptions } = require("../db");
const { userAuth } = require("../middlewares/userauth");

// ---------------- Get all creators (public info) ----------------
router.get("/creators", async (req, res) => {
    try {
        const creators = await Users.find({ 
            isActive: true 
        }).select("username avatar creatorBio creatorCategory isVerifiedCreator subscribers");
        
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

        // Check if trying to subscribe to self
        if (subscriberId.toString() === creatorId) {
            return res.status(400).json({ message: "Cannot subscribe to yourself" });
        }

        // Check if creator exists and is active
        const creator = await Users.findById(creatorId);
        if (!creator || !creator.isActive) {
            return res.status(404).json({ message: "Creator not found or inactive" });
        }

        // Check if already subscribed
        const existingSubscription = await Subscriptions.findOne({
            subscriber: subscriberId,
            creator: creatorId,
            isActive: true
        });

        if (existingSubscription) {
            return res.status(400).json({ message: "Already subscribed to this creator" });
        }

        // Create subscription
        const subscription = new Subscriptions({
            subscriber: subscriberId,
            creator: creatorId
        });

        await subscription.save();

        // Update user relationships
        await Users.findByIdAndUpdate(subscriberId, {
            $addToSet: { subscriptions: creatorId }
        });

        await Users.findByIdAndUpdate(creatorId, {
            $addToSet: { subscribers: subscriberId }
        });

        res.status(201).json({ 
            message: "Successfully subscribed to creator",
            subscription: subscription
        });
    } catch (error) {
        console.error("Subscribe error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ---------------- Unsubscribe from a creator ----------------
router.delete("/unsubscribe/:creatorId", userAuth("user"), async (req, res) => {
    try {
        const subscriberId = req.user._id;
        const creatorId = req.params.creatorId;

        // Find and deactivate subscription
        const subscription = await Subscriptions.findOneAndUpdate(
            {
                subscriber: subscriberId,
                creator: creatorId,
                isActive: true
            },
            { 
                isActive: false
            },
            { new: true }
        );

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        // Update user relationships
        await Users.findByIdAndUpdate(subscriberId, {
            // $pull is a MongoDB update operator that removes a value from an array field.
            // Here, it removes the creatorId from the user's subscriptions array.
            $pull: { subscriptions: creatorId }
        });

        await Users.findByIdAndUpdate(creatorId, {
            $pull: { subscribers: subscriberId }
        });

        res.json({ message: "Successfully unsubscribed from creator" });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
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
