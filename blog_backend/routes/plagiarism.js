const express = require("express");
const router = express.Router();
const { Blogs } = require("../db");

// Very simple tokenizer and stopwords list
const STOP = new Set([
  'the','is','at','of','on','and','a','to','in','it','that','for','with','as','was','were','be','by','or','an','are','from','this','which','you','your','we','our','they','their','i','me','my'
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
}

function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  const len = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / len);
  return tf;
}

function cosineSim(tfA, tfB) {
  let dot = 0;
  let a2 = 0;
  let b2 = 0;
  for (const v of tfA.values()) a2 += v * v;
  for (const v of tfB.values()) b2 += v * v;
  const keys = tfA.size < tfB.size ? tfA.keys() : tfB.keys();
  for (const k of keys) {
    const va = tfA.get(k) || 0;
    const vb = tfB.get(k) || 0;
    dot += va * vb;
  }
  const denom = Math.sqrt(a2) * Math.sqrt(b2) || 1;
  return dot / denom;
}

// POST /api/plagiarism/check { content }
router.post('/check', async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || typeof content !== 'string' || content.trim().length < 30) {
      return res.status(400).json({ message: 'Content must be a non-empty string of at least 30 characters.' });
    }

    // Fetch a reasonable set of posts to compare against
    const candidates = await Blogs.find({ isPublished: true })
      .select('title content author createdAt')
      .limit(500)
      .lean();

    const queryTokens = tokenize(content);
    const tfQuery = termFreq(queryTokens);

    const results = [];
    for (const post of candidates) {
      const tokens = tokenize(post.content || post.title || '');
      if (tokens.length === 0) continue;
      const tfDoc = termFreq(tokens);
      const sim = cosineSim(tfQuery, tfDoc);
      if (sim > 0) {
        results.push({
          _id: post._id,
          title: post.title,
          author: post.author,
          createdAt: post.createdAt,
          similarity: sim,
        });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    const top = results.slice(0, 5);
    const maxSimilarity = top[0]?.similarity || 0;
    const plagiarismScore = Math.round(maxSimilarity * 100);

    return res.json({
      score: plagiarismScore, // 0-100
      matches: top,
      totalCompared: candidates.length,
    });
  } catch (err) {
    console.error('Plagiarism check error:', err);
    return res.status(500).json({ message: 'Server error during plagiarism check' });
  }
});

module.exports = router;
 
// --- LLM-based originality assessment ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/assess', async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || typeof content !== 'string' || content.trim().length < 30) {
      return res.status(400).json({ message: 'Content must be a non-empty string of at least 30 characters.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'LLM API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = [
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    let model = null;
    for (const m of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: m });
        break;
      } catch(_) { continue; }
    }
    if (!model) return res.status(500).json({ message: 'No available model' });

    const prompt = `You are an originality and plagiarism assessment assistant.
Analyze the following blog content and return a strict JSON with keys:
- originality_score: number (0-100, higher is more original)
- likely_ai_generated: boolean
- rationale: short string explaining the assessment (<= 300 chars)
If you are unsure, estimate conservatively.
Content:\n\n${content}`;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    let parsed;
    try { parsed = JSON.parse(text); } catch(_) {
      // Fallback: extract numbers heuristically
      parsed = { originality_score: 50, likely_ai_generated: false, rationale: text.slice(0,300) };
    }
    if (typeof parsed.originality_score !== 'number') parsed.originality_score = 50;
    if (typeof parsed.likely_ai_generated !== 'boolean') parsed.likely_ai_generated = false;
    if (typeof parsed.rationale !== 'string') parsed.rationale = 'Assessment generated.';

    return res.json(parsed);
  } catch (err) {
    console.error('Originality assess error:', err);
    return res.status(500).json({ message: 'Server error during originality assessment' });
  }
});
