// src/App.jsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Creators from "./pages/Creators";
import CreatorProfile from "./pages/CreatorProfile";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Bookmarks from "./pages/Bookmarks";
import { useAuth } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect, useState } from "react";
import { getPost, addComment } from "./api/axios";
import { toast } from "react-hot-toast";

function Private({ children }) {
  const { userId } = useAuth();
  return userId ? children : <Navigate to="/login" replace />;
}
function AdminOnly({ children }) {
  const { role } = useAuth();
  return role === "admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/creator/:id" element={<CreatorProfile />} />
        <Route path="/post/:id" element={<Post />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/create" element={<Private><CreatePost /></Private>} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/settings" element={<Private><Profile /></Private>} />
        <Route path="/bookmarks" element={<Private><Bookmarks /></Private>} />

        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

// Minimal Post page: loads post by id and renders content, tags, and comments.
function Post() {
  const { id } = useParams();
  const { userId } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await getPost(id);
        setPost(res.data);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load post");
      } finally { setLoading(false); }
    })();
  }, [id]);

  async function onAddComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      await addComment(id, comment.trim());
      toast.success("Comment added");
      setComment("");
      // Refresh comments if available; optimistic if shape matches
      setPost((p)=> p && {
        ...p,
        comments: Array.isArray(p.comments)
          ? [...p.comments, { _id: Math.random().toString(36).slice(2), user: userId, comment: comment.trim(), createdAt: new Date().toISOString() }]
          : p.comments
      });
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Failed to add comment");
    }
  }

  if (loading) return <div className="container"><div className="loading"><div className="spinner" /> Loading…</div></div>;
  if (error) return <div className="container"><div className="center-card"><h2>Post</h2><p className="muted">{error}</p></div></div>;
  if (!post) return <div className="container"><p className="muted">Post not found.</p></div>;

  return (
    <div className="container narrow">
      <article className="card" style={{ padding: '2rem' }}>
        <header className="card-header" style={{ marginBottom: '0.5rem' }}>
          <h1 className="title" style={{ margin: 0 }}>{post.title}</h1>
          <span className="muted">{post.isPublic ? 'Public' : 'Subscribers only'}</span>
        </header>
        <div className="muted" style={{ marginBottom: '1rem' }}>
          by {post?.author?.username || 'Unknown'} · {new Date(post?.createdAt).toLocaleString()}
        </div>
        {Array.isArray(post?.tags) && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {post.tags.map((t, i) => (
              <span key={i} style={{ border: '1px solid var(--border)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem', color: 'var(--ink-light)' }}>#{t}</span>
            ))}
          </div>
        )}
        <section style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--ink)' }}>
          {post.content}
        </section>
      </article>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ margin: 0 }}>Comments</h3>
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.isArray(post?.comments) && post.comments.length > 0 ? (
            post.comments.map((c) => (
              <div key={c._id || c.createdAt} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem' }}>{c.comment}</div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>{new Date(c.createdAt).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="muted">No comments yet.</div>
          )}
        </div>
        <form onSubmit={onAddComment} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <input
            className="input"
            placeholder={userId ? "Write a comment…" : "Sign in to comment"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!userId}
          />
          <button className="btn" disabled={!userId || !comment.trim()} type="submit">Post</button>
        </form>
      </section>
    </div>
  );
}
