// src/pages/CreatePost.jsx
import { useState } from "react";
import { tryPost, plagiarismCheck, plagiarismAssess } from "../api/axios";
import { useNavigate } from "react-router-dom";
import { HelpIcon } from "../components/Tooltip";

const paths = {
  create: ["/api/user/post"]
};

export default function CreatePost() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title:"", content:"", tags:"", isPublic:true });
  const [loading, setLoading] = useState(false);
  const [plagLoading, setPlagLoading] = useState(false);
  const [plag, setPlag] = useState(null);
  const [assessLoading, setAssessLoading] = useState(false);
  const [assess, setAssess] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        tags: form.tags ? form.tags.split(",").map(s=>s.trim()) : [],
        isPublic: !!form.isPublic
      };
      await tryPost(paths.create, payload);
      nav("/");
    } finally { setLoading(false); }
  }

  async function onAssessOriginality() {
    if (!form.content || form.content.trim().length < 30) {
      alert("Please enter at least 30 characters of content to assess originality.");
      return;
    }
    try {
      setAssessLoading(true);
      const res = await plagiarismAssess(form.content);
      setAssess(res?.data || null);
    } catch (e) {
      setAssess({ error: e?.response?.data?.message || "Failed to assess originality" });
    } finally {
      setAssessLoading(false);
    }
  }

  async function onCheckPlagiarism() {
    if (!form.content || form.content.trim().length < 30) {
      alert("Please enter at least 30 characters of content to check plagiarism.");
      return;
    }
    try {
      setPlagLoading(true);
      const res = await plagiarismCheck(form.content);
      setPlag(res?.data || { score: 0, matches: [] });
    } catch (e) {
      setPlag({ error: e?.response?.data?.message || "Failed to check plagiarism" });
    } finally {
      setPlagLoading(false);
    }
  }

  return (
    <div className="container narrow">
      <h2>Create Post</h2>
      <form onSubmit={onSubmit}>
        <div className="form-field">
          <label className="field-label">
            Title
            <HelpIcon content="Choose a catchy title that describes your post" />
          </label>
          <input className="input" placeholder="Enter your post title"
            value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
        </div>
        
        <div className="form-field">
          <label className="field-label">
            Content
            <HelpIcon content="Write your post content here. You can use markdown formatting." />
          </label>
          <textarea className="textarea" placeholder="Write your content..."
            value={form.content} onChange={(e)=>setForm({...form, content:e.target.value})} required />
        </div>
        
        <div className="form-field">
          <label className="field-label">
            Tags
            <HelpIcon content="Add tags separated by commas to help others find your post" />
          </label>
          <input className="input" placeholder="Tags (comma separated)"
            value={form.tags} onChange={(e)=>setForm({...form, tags:e.target.value})} />
        </div>
        
        <div className="form-field">
          <label className="switch">
            <input type="checkbox" checked={form.isPublic}
              onChange={(e)=>setForm({...form, isPublic:e.target.checked})} />
            <span>
              Public Post
              <HelpIcon content="Public posts are visible to everyone. Uncheck to make it subscriber-only content." />
            </span>
          </label>
        </div>
        
        <div className="actions" style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn ghost" onClick={onCheckPlagiarism} disabled={plagLoading}>
            {plagLoading ? "Checking…" : "DB Similarity Check"}
          </button>
          <button type="button" className="btn ghost" onClick={onAssessOriginality} disabled={assessLoading}>
            {assessLoading ? "Assessing…" : "AI Originality Check"}
          </button>
          <button className="btn" disabled={loading}>{loading?"Publishing…":"Publish"}</button>
        </div>

        {plag && (
          <div className="search-results" style={{ marginTop: '1rem' }}>
            {plag.error ? (
              <div className="error-message">{plag.error}</div>
            ) : (
              <div>
                <h3>Database Similarity Score: {plag.score}%</h3>
                {Array.isArray(plag.matches) && plag.matches.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    {plag.matches.map((m) => (
                      <li key={String(m._id)}>
                        <strong>{m.title || 'Untitled'}</strong> — {(m.similarity*100).toFixed(1)}%
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No close matches found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {assess && (
          <div className="search-results" style={{ marginTop: '1rem' }}>
            {assess.error ? (
              <div className="error-message">{assess.error}</div>
            ) : (
              <div>
                <h3>AI Originality</h3>
                <p style={{ margin: 0 }}>
                  <strong>Originality Score:</strong> {assess.originality_score}%
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Likely AI-generated:</strong> {String(assess.likely_ai_generated)}
                </p>
                <p style={{ marginTop: '0.5rem' }}>{assess.rationale}</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
