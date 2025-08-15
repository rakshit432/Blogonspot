// src/components/SearchBar.jsx
import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";

const paths = {
  // Try different likely endpoints
  searchPosts: (q) => [
    `/api/user/search/posts?q=${encodeURIComponent(q)}`,
    `/api/posts/search?q=${encodeURIComponent(q)}`,
    `/api/user/posts?search=${encodeURIComponent(q)}&public=true`,
  ],
  searchUsers: (q) => [
    `/api/user/search/users?q=${encodeURIComponent(q)}`,
    `/api/subscription/creators?search=${encodeURIComponent(q)}`,
    `/api/users?search=${encodeURIComponent(q)}`
  ],
};

export default function SearchBar({ onResults, sourcePosts = [], sourceUsers = [] }) {
  const inputRef = useRef(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, [])

  async function doSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    const query = q.trim().toLowerCase();
    // Filter posts
    const posts = (Array.isArray(sourcePosts) ? sourcePosts : []).filter((p) => {
      const title = (p.title || "").toLowerCase();
      const content = (p.content || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
      return title.includes(query) || content.includes(query) || tags.includes(query);
    });
    // Build user pool: provided users or authors from posts
    const providedUsers = Array.isArray(sourceUsers) ? sourceUsers : [];
    const authorUsers = (Array.isArray(sourcePosts) ? sourcePosts : [])
      .map((p) => p.author)
      .filter(Boolean);
    const pool = [...providedUsers, ...authorUsers];
    const seen = new Set();
    const users = pool.filter((u) => {
      const id = String(u?._id || u?.id || u?.username || Math.random());
      if (seen.has(id)) return false;
      const username = (u?.username || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const bio = (u?.creatorBio || u?.bio || "").toLowerCase();
      const ok = username.includes(query) || email.includes(query) || bio.includes(query);
      if (ok) seen.add(id);
      return ok;
    });
    try { console.log('[Search] client results:', { posts: posts.length, users: users.length }); } catch {}
    onResults?.({ posts, users });
  }

  return (
    <form onSubmit={doSearch} className="search">
      <FaSearch />
      <input
        ref={inputRef}
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        placeholder="Search public posts or users…"
      />
      <button className="btn">Search</button>
    </form>
  );
}
