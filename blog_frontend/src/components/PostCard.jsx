// src/components/PostCard.jsx
import moment from "moment";
import { FaLock, FaLockOpen, FaRegHeart, FaBookmark } from "react-icons/fa";

export default function PostCard({ post, onOpen, onLike, onBookmark }) {
  const isPublic = post?.isPublic ?? true;
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
        <button className="btn ghost" onClick={(e)=>{e.stopPropagation(); onLike?.(post);}}>
          <FaRegHeart /> Like
        </button>
        <button className="btn ghost" onClick={(e)=>{e.stopPropagation(); onBookmark?.(post);}}>
          <FaBookmark /> Bookmark
        </button>
      </div>
    </div>
  );
}
