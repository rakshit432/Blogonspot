// src/pages/Home.jsx
import { useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";
import { tryGet, tryPost } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const paths = {
  // Public posts
  publicPosts: [
    "/api/user/posts?public=true",
    "/api/posts?public=true",
    "/api/public/posts"
  ],
  // Subscription feed
  subFeed: [
    "/api/subscription/content",
    "/api/subscription/feed",
  ],
  // Admin content
  adminContent: [
    "/api/admin/create-content?list=true",
    "/api/admin/content",
  ],
  like: (id) => [`/api/user/like/${id}`, `/api/posts/${id}/like`],
  bookmarkAdd: (id) => [`/api/user/bookmarks/${id}`, `/api/user/bookmark/${id}`],
};

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState({ posts: [], users: [] });

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

  useEffect(() => { load(); }, [user]);

  async function onLike(p) {
    await tryPost(paths.like(p._id), {});
    await load();
  }
  async function onBookmark(p) {
    await tryPost(paths.bookmarkAdd(p._id), {});
  }

  return (
    <div className="container">
      <SearchBar onResults={setSearch} />
      {(search.posts.length>0 || search.users.length>0) && (
        <div className="search-results">
          <h3>Search results</h3>
          <div className="grid">
            {search.posts.map((p)=>(
              <PostCard key={p._id} post={p} onLike={onLike} onBookmark={onBookmark} />
            ))}
          </div>
        </div>
      )}

      <h2 className="section-title">Your feed</h2>
      <div className="grid">
        {posts.map((p)=>(
          <PostCard key={p._id} post={p} onLike={onLike} onBookmark={onBookmark} />
        ))}
      </div>
    </div>
  );
}
