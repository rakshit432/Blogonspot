// src/pages/CreatorProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import { toast } from "react-hot-toast";
import { FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { tryPost, tryDel } from "../api/axios";
import {
  getProfile,
  getCreatorContent,
  userPosts,
  subscribe as apiSubscribe,
  unsubscribe as apiUnsubscribe,
} from "../api/axios";
import { SkeletonAvatar, SkeletonLine } from "../components/Skeleton.jsx";

export default function CreatorProfile() {
  const { id } = useParams();
  const { userId } = useAuth();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  function categoryMiniature(category, name){
    const map = {
      tech: { bg:"#E0E7FF" },
      art: { bg:"#FFE4E6" },
      photography: { bg:"#E0F2FE" },
      music: { bg:"#F5F3FF" },
      food: { bg:"#FEF2F2" },
      sports: { bg:"#ECFCCB" },
      default: { bg:"#ECFDF5" }
    };
    const key = String(category||"").toLowerCase();
    const cfg = map[key] || map.default;
    const initials = (name||"U").slice(0,2).toUpperCase();
    const svg = `<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <rect width='128' height='128' rx='24' fill='${cfg.bg}'/>\n  <text x='50%' y='24%' dominant-baseline='middle' text-anchor='middle' fill='#111827' font-family='Inter, Arial' font-size='14' font-weight='800'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  async function load() {
    try {
      setLoading(true);
      const [profRes, contentRes] = await Promise.all([
        getProfile(id).catch(() => ({ data: null })),
        getCreatorContent(id).catch(() => ({ data: { posts: [] } })),
      ]);
      setCreator(profRes.data);
      setPosts(Array.isArray(contentRes.data) ? contentRes.data : contentRes.data?.posts || []);
      setIsSubscribed(!!contentRes.data?.isSubscribed);
      // Fallback: if no posts returned, try public posts by author
      if ((contentRes.data?.posts?.length || 0) === 0) {
        const pub = await userPosts(id, true).catch(()=>({ data: [] }));
        setPosts(Array.isArray(pub.data)?pub.data:pub.data?.posts||[]);
      }

  const paths = {
    like: (pid) => [`/api/user/like/${pid}`, `/api/posts/${pid}/like`],
    unlike: (pid) => [`/api/user/like/${pid}`, `/api/posts/${pid}/like`],
    bookmarkAdd: (pid) => [
      `/api/user/bookmarks/${pid}`,
      `/api/user/bookmark/${pid}`
    ],
    bookmarkRemove: (pid) => [
      `/api/user/bookmarks/${pid}`,
      `/api/user/bookmark/${pid}`
    ],
  };

  async function onLike(p, likedByMe){
    // optimistic update within this page's posts state
    const mutate = (post) => {
      const copy = { ...post };
      if (Array.isArray(copy.likes)) {
        if (likedByMe) {
          copy.likes = copy.likes.filter((x)=>String(x)!==String(userId));
        } else {
          copy.likes = [...copy.likes, userId];
        }
      } else {
        const cnt = Number(copy.likesCount || 0);
        copy.likesCount = likedByMe ? Math.max(0, cnt-1) : cnt+1;
        copy.likedByMe = !likedByMe;
      }
      return copy;
    };
    const prev = posts;
    setPosts((arr)=>arr.map((it)=> it._id===p._id ? mutate(it) : it));
    try {
      if (likedByMe) await tryDel(paths.unlike(p._id));
      else await tryPost(paths.like(p._id), {});
    } catch (e) {
      setPosts(prev);
      toast.error(e?.response?.data?.message || "Like failed");
    }
  }

  async function onBookmark(p, bookmarkedByMe){
    const mutate = (post) => {
      const copy = { ...post };
      if (Array.isArray(copy.bookmarks)) {
        if (bookmarkedByMe) {
          copy.bookmarks = copy.bookmarks.filter((x)=>String(x)!==String(userId));
        } else {
          copy.bookmarks = [...copy.bookmarks, userId];
        }
      } else {
        copy.bookmarkedByMe = !bookmarkedByMe;
      }
      return copy;
    };
    const prev = posts;
    setPosts((arr)=>arr.map((it)=> it._id===p._id ? mutate(it) : it));
    try {
      if (bookmarkedByMe) await tryDel(paths.bookmarkRemove(p._id));
      else await tryPost(paths.bookmarkAdd(p._id), {});
    } catch (e) {
      setPosts(prev);
      toast.error(e?.response?.data?.message || "Bookmark failed");
    }
  }
    } catch (e) {
      toast.error("Failed to load creator");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function handleSubscribe() {
    try {
      if (!localStorage.getItem("token")) { toast.error("Please log in to subscribe."); return; }
      setBusy(true);
      await apiSubscribe(id);
      toast.success("Subscribed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Subscribe failed");
    } finally { setBusy(false); }
  }

  async function handleUnsubscribe() {
    try {
      if (!localStorage.getItem("token")) { toast.error("Please log in to unsubscribe."); return; }
      setBusy(true);
      await apiUnsubscribe(id);
      toast.success("Unsubscribed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Unsubscribe failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="container narrow">
      <div className="card" style={{padding:16, marginBottom:16}}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          {loading ? (
            <SkeletonAvatar size={56} />
          ) : (
            <img src={
                  creator?.avatar 
                    || (creator?.role === 'admin'
                        ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <defs>\n    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>\n      <stop offset='0%' stop-color='#111827'/>\n      <stop offset='100%' stop-color='#334155'/>\n    </linearGradient>\n  </defs>\n  <rect width='128' height='128' rx='24' fill='url(#g)'/>\n  <circle cx='64' cy='52' r='22' fill='#fef3c7'/>\n  <rect x='30' y='80' width='68' height='30' rx='15' fill='#1f2937'/>\n  <path d='M24 20 L104 20 L92 44 L36 44 Z' fill='#eab308'/>\n  <text x='50%' y='20%' dominant-baseline='middle' text-anchor='middle' fill='#000' font-family='Inter, Arial' font-size='12' font-weight='800'>BOSS</text>\n</svg>`)))}`
                        : categoryMiniature(creator?.creatorCategory, creator?.username))
                }
                 alt={creator?.username}
                 style={{width:56,height:56,borderRadius:999,objectFit:"cover",border:"1px solid #eee"}} />
          )}
          <div style={{flex:1}}>
            {loading ? (
              <>
                <SkeletonLine width="30%" height={20} />
                <SkeletonLine width="20%" style={{marginTop:6}} />
                <SkeletonLine width="50%" style={{marginTop:6}} />
              </>
            ) : (
              <>
                <h2 className="section-title" style={{margin:0, display:"flex", alignItems:"center", gap:8}}>
                  {creator?.username || "Creator"}
                  {creator?.isVerifiedCreator && (
                    <span title="Verified" style={{display:"inline-flex",alignItems:"center",gap:6,color:"var(--brand)",fontSize:14}}>
                      <FiCheckCircle />
                    </span>
                  )}
                </h2>
                <p className="muted" style={{margin:"4px 0"}}>{creator?.creatorCategory}</p>
                <p style={{margin:0}}>{creator?.creatorBio}</p>
              </>
            )}
          </div>
          {!loading && userId && userId !== id && (
            <div style={{display:"flex", gap:8}}>
              {isSubscribed ? (
                <button className="btn ghost" disabled={busy} onClick={handleUnsubscribe}>{busy?"...":"Unsubscribe"}</button>
              ) : (
                <button className="btn" disabled={busy} onClick={handleSubscribe}>{busy?"...":"Subscribe"}</button>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({length:6}).map((_,i)=> <div className="skeleton skeleton-card" key={i} />)}
        </div>
      ) : (
        <div className="grid">
          {posts.map((p) => (
            <PostCard key={p._id} post={p} onLike={onLike} onBookmark={onBookmark} currentUserId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
