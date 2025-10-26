// src/components/PostCard.jsx
import { useState, useCallback } from "react";
import moment from "moment";
import { FaLock, FaLockOpen, FaRegHeart, FaHeart, FaBookmark, FaRegBookmark } from "react-icons/fa";
import { Modal } from "./Modal";
import { summarize } from "../api/axios";
import { FiCheckCircle } from "react-icons/fi";

export default function PostCard({ post, onOpen, onLike, onBookmark, currentUserId, isSubscribed = false, isAdmin = false }) {
  // Content visibility logic
  const isPublic = post?.isPublic ?? false;
  const isAuthor = String(post.author?._id || post.author) === String(currentUserId);
  const canViewContent = isAdmin || isPublic || isSubscribed || isAuthor;
  
  const likeCount = Array.isArray(post?.likes) ? post.likes.length : (post?.likesCount || 0);
  const likedByMe = Array.isArray(post?.likes)
    ? post.likes.some((x) => String(x) === String(currentUserId))
    : Boolean(post?.likedByMe);
  const bookmarkedByMe = Array.isArray(post?.bookmarks)
    ? post.bookmarks.some((x) => String(x) === String(currentUserId))
    : Boolean(post?.bookmarkedByMe);

  const [summary, setSummary] = useState('');
  const [summaryHover, setSummaryHover] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!canViewContent || loadingSummary || summary) return;
    const raw = (post?.content || "").trim();
    if (raw.length < 10) { setSummary('No summary available'); return; }
    try {
      setLoadingSummary(true);
      const res = await summarize(raw);
      const text = res?.data?.summary || "";
      if (text) setSummary(text);
      else setSummary('No summary available');
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to generate summary';
      setSummary(msg);
    } finally {
      setLoadingSummary(false);
    }
  }, [canViewContent, loadingSummary, summary, post?.content]);

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
    borderRadius: '8px',
  };

  return (
    <div 
      className="card" 
      onClick={() => canViewContent && onOpen?.(post)} 
      role="button"
      style={{
        opacity: canViewContent ? 1 : 0.6,
        position: 'relative',
        cursor: canViewContent ? 'pointer' : 'default',
      }}
      onMouseEnter={() => { setSummaryHover(true); fetchSummary(); }}
      onMouseLeave={() => setSummaryHover(false)}
    >
      {!canViewContent && (
        <div style={overlayStyle}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/creator/${post.author?._id || post.author}`;
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--brand)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              zIndex: 2,
            }}
          >
            Subscribe to View
          </button>
        </div>
      )}

      <div className="card-header">
        <div className="title">
          {post.title}
          {!isPublic && isSubscribed && (
            <span style={{ marginLeft: '8px', fontSize: '0.8em', color: '#666' }}>
              (Subscriber Content)
            </span>
          )}
        </div>
        <div className="visibility">
          {isPublic ? <FaLockOpen title="Public" /> : <FaLock title="Subscribers only" />}
        </div>
      </div>

      <div className="meta">
        <span>
          by {post?.author?.username || "Unknown"}
          {(post?.author?.isVerified || post?.author?.isVerifiedCreator) && (
            <FiCheckCircle size={16} color="var(--brand)" title="Verified Creator" style={{ marginLeft: 6, verticalAlign: 'text-bottom' }} />
          )}
        </span>
        <span> · {moment(post?.createdAt).fromNow()}</span>
      </div>

      <p className="excerpt">
        {canViewContent 
          ? (post.content || "").slice(0, 140) + ((post.content || "").length > 140 ? "…" : "")
          : "Subscribe to view this content"}
      </p>

      <div className="actions">
        <button 
          className="btn ghost" 
          onClick={(e) => {
            e.stopPropagation();
            if (canViewContent) onLike?.(post, likedByMe);
          }}
          disabled={!canViewContent}
        >
          {likedByMe ? <FaHeart color="#e11d48" /> : <FaRegHeart />}
          <span style={{ marginLeft: 6 }}>{likeCount}</span>
        </button>

        <button 
          className="btn ghost" 
          onClick={(e) => {
            e.stopPropagation();
            onBookmark?.(post, bookmarkedByMe);
          }}
        >
          {bookmarkedByMe ? <FaBookmark color="#0ea5e9" /> : <FaRegBookmark />}
          <span style={{ marginLeft: 6 }}>{bookmarkedByMe ? "Saved" : "Bookmark"}</span>
        </button>
      </div>

      {/* Hover summary overlay for viewers */}
      {canViewContent && summaryHover && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          bottom: 64, // leave action buttons visible
          background: 'linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.96))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          borderRadius: '12px',
          zIndex: 2,
          pointerEvents: 'none',
          opacity: 1,
          transform: 'translateY(-6px)',
          transition: 'opacity 180ms ease, transform 180ms ease'
        }}>
          <div style={{ maxWidth: 520, color: 'var(--ink-light)', textAlign: 'center', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--ink)' }}>Summary</div>
            {loadingSummary ? 'Generating summary…' : (summary || 'No summary available')}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Summary"
      >
        {summary}
      </Modal>
    </div>
  );
}