// src/pages/Home.jsx
import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";
import Onboarding from "../components/Onboarding";
import { tryGet, tryPost, tryDel } from "../api/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const paths = {
  // Public posts
  publicPosts: [
    "/api/user/post?ispublic=true"
  ],
  // Subscription feed
  subFeed: [
    "/api/subscription/content"
  ],
  // Admin content (public GET)
  adminContent: [
    "/api/admin/create-content"
  ],
  like: (id) => [`/api/user/like/${id}`, `/api/posts/${id}/like`],
  bookmarkAdd: (id) => [`/api/user/bookmarks/${id}`, `/api/user/bookmark/${id}`],
  bookmarkRemove: (id) => [`/api/user/bookmarks/${id}`, `/api/user/bookmark/${id}`],
  unlike: (id) => [`/api/user/like/${id}`, `/api/posts/${id}/like`],
};

export default function Home() {
  const { user, userId } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState({ posts: [], users: [] });
  const [showOnboarding, setShowOnboarding] = useState(false);

  async function load() {
    const [pubRes, subRes, adminRes] = await Promise.all([
      tryGet(paths.publicPosts).catch(()=>({ data: [] })),
      user ? tryGet(paths.subFeed).catch(()=>({ data: [] })) : Promise.resolve({ data: [] }),
      tryGet(paths.adminContent).catch(()=>({ data: [] })),
    ]);
    const list = [
      ...(Array.isArray(pubRes.data) ? pubRes.data : pubRes.data?.posts || []),
      ...(Array.isArray(subRes.data) ? subRes.data : subRes.data?.posts || []),
      ...(Array.isArray(adminRes.data) ? adminRes.data : adminRes.data?.posts || []),
    ];
    setPosts(list);
  }

  useEffect(() => { 
    load(); 
    // Show onboarding for new users
    if (user && !localStorage.getItem('onboarding_completed')) {
      setShowOnboarding(true);
    }
  }, [user]);

  async function onLike(p, likedByMe) {
    // Optimistic update for main feed
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

    const prevPosts = posts;
    const prevSearch = search;
    setPosts((arr)=>arr.map((it)=> it._id===p._id ? mutate(it) : it));
    if (search.posts?.length) {
      setSearch((s)=>({
        ...s,
        posts: s.posts.map((it)=> it._id===p._id ? mutate(it) : it)
      }));
    }

    try {
      if (likedByMe) await tryDel(paths.unlike(p._id));
      else await tryPost(paths.like(p._id), {});
    } catch (e) {
      // rollback on error
      setPosts(prevPosts);
      setSearch(prevSearch);
      toast.error(e?.response?.data?.message || "Failed to update like");
    }
  }
  async function onBookmark(p, bookmarkedByMe) {
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

    const prevPosts = posts;
    const prevSearch = search;
    setPosts((arr)=>arr.map((it)=> it._id===p._id ? mutate(it) : it));
    if (search.posts?.length) {
      setSearch((s)=>({
        ...s,
        posts: s.posts.map((it)=> it._id===p._id ? mutate(it) : it)
      }));
    }

    try {
      if (bookmarkedByMe) await tryDel(paths.bookmarkRemove(p._id));
      else await tryPost(paths.bookmarkAdd(p._id), {});
    } catch (e) {
      setPosts(prevPosts);
      setSearch(prevSearch);
      toast.error(e?.response?.data?.message || "Failed to update bookmark");
    }
  }

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  return (
    <div className="container">
      <SearchBar onResults={setSearch} sourcePosts={posts} />
      {(search.posts.length>0 || search.users.length>0) && (
        <div className="search-results">
          <h3>Search results</h3>
          <div className="grid">
            {search.posts.map((p)=>(
              <PostCard key={p._id} post={p} onOpen={() => nav(`/post/${p._id}`)} onLike={onLike} onBookmark={onBookmark} currentUserId={userId} />
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">For you</h2>
      <div className="grid">
        {posts.map((p)=>(
          <PostCard key={p._id} post={p} onOpen={() => nav(`/post/${p._id}`)} onLike={onLike} onBookmark={onBookmark} currentUserId={userId} />
        ))}
      </div>

      <Onboarding isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  );
}
