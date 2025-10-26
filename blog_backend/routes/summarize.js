require("dotenv").config();
const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Input validation middleware
const validateSummarizeInput = (req, res, next) => {
    const { content } = req.body;
    
    // Check if content exists and is not empty
    if (!content || typeof content !== 'string') {
        return res.status(400).json({ 
            error: "Content is required and must be a string" 
        });
    }
    
    // Check content length (minimum 10 characters, maximum 10000 characters)
    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
        return res.status(400).json({ 
            error: "Content must be at least 10 characters long" 
        });
    }
    
    if (trimmedContent.length > 10000) {
        return res.status(400).json({ 
            error: "Content must be less than 10,000 characters" 
        });
    }
    
    // Basic XSS protection - remove potential script tags
    const sanitizedContent = trimmedContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    req.sanitizedContent = sanitizedContent;
    next();
};

router.post('/', validateSummarizeInput, async (req, res) => {
    try {
        // Support both GEMINI_API_KEY and GOOGLE_API_KEY environment variables
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ 
                error: "API key not configured. Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable" 
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Try multiple model names in order of preference (latest first)
        const modelNames = [
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro", 
            "gemini-pro",
            "gemini-1.0-pro"
        ];
        
        let model = null;
        let lastError = null;
        
        for (const modelName of modelNames) {
            try {
                model = genAI.getGenerativeModel({ model: modelName });
                // Test the model with a simple request
                const testResult = await model.generateContent("test");
                console.log(`✅ Using model: ${modelName}`);
                break;
            } catch (error) {
                lastError = error;
                console.log(`❌ Model ${modelName} not available: ${error.message}`);
                continue;
            }
        }
        
        if (!model) {
            throw new Error(`No available models found. Last error: ${lastError?.message}`);
        }

        const prompt = `Summarize the following text in a concise manner (1-2 sentences maximum):\n\n${req.sanitizedContent}`;
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
        });
        
        const generatePromise = model.generateContent(prompt);
        const result = await Promise.race([generatePromise, timeoutPromise]);
        
        const response = await result.response;
        const summary = response.text();
       
        // Validate summary is not empty
        if (!summary || summary.trim().length === 0) {
            throw new Error("Empty summary received from API");
        }
        
        return res.json({ 
            summary: summary.trim(),
            model: model.model || "unknown"
        });
        
    } catch (error) {
        console.error("Summarization error:", error);
        
        // Handle specific error types
        if (error.message.includes('timeout')) {
            return res.status(408).json({ 
                error: "Request timeout - API took too long to respond" 
            });
        }
        
        if (error.message.includes('API_KEY_INVALID')) {
            return res.status(500).json({ 
                error: "Invalid API key configuration" 
            });
        }
        
        if (error.message.includes('QUOTA_EXCEEDED')) {
            return res.status(429).json({ 
                error: "API quota exceeded - try again later" 
            });
        }
        
        if (error.message.includes('PERMISSION_DENIED')) {
            return res.status(403).json({ 
                error: "API access denied - check permissions" 
            });
        }
        
        return res.status(500).json({ 
            error: "Failed to generate summary",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;