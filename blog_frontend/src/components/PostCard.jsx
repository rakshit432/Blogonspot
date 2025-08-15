// src/components/PostCard.jsx
import moment from "moment";
import { FaLock, FaLockOpen, FaRegHeart, FaHeart, FaBookmark, FaRegBookmark } from "react-icons/fa";

export default function PostCard({ post, onOpen, onLike, onBookmark, currentUserId }) {
  const isPublic = post?.isPublic ?? true;
  const likeCount = Array.isArray(post?.likes) ? post.likes.length : (post?.likesCount || 0);
  const likedByMe = Array.isArray(post?.likes)
    ? post.likes.some((x)=>String(x)===String(currentUserId))
    : Boolean(post?.likedByMe);
  const bookmarkedByMe = Array.isArray(post?.bookmarks)
    ? post.bookmarks.some((x)=>String(x)===String(currentUserId))
    : Boolean(post?.bookmarkedByMe);
  return (
    <div className="card" onClick={() => onOpen?.(post)} role="button">
      <div className="card-header">
        <div className="title">{post.title}</div>
        <div className="visibility">
          {isPublic ? <FaLockOpen title="Public" /> : <FaLock title="Subscribers only" />}
        </div>
      </div>
      <div className="meta">
        <span>by {post?.author?.username || "Unknown"}</span>
        <span> · {moment(post?.createdAt).fromNow()}</span>
      </div>
      <p className="excerpt">{(post.content || "").slice(0, 140)}{(post.content||"").length>140?"…":""}</p>
      <div className="actions">
        <button className="btn ghost" onClick={(e)=>{e.stopPropagation(); onLike?.(post, likedByMe);}}>
          {likedByMe ? <FaHeart color="#e11d48" /> : <FaRegHeart />}
          <span style={{marginLeft:6}}>{likeCount}</span>
        </button>
        <button className="btn ghost" onClick={(e)=>{e.stopPropagation(); onBookmark?.(post, bookmarkedByMe);}}>
          {bookmarkedByMe ? <FaBookmark color="#0ea5e9" /> : <FaRegBookmark />}
          <span style={{marginLeft:6}}>{bookmarkedByMe ? "Saved" : "Bookmark"}</span>
        </button>
      </div>
    </div>
  );
}
