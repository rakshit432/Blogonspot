// src/components/SearchBar.jsx
import { useEffect, useRef, useState } from "react";
import { tryGet } from "../api/axios";
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

export default function SearchBar({ onResults }) {
  const inputRef = useRef(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function doSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    const [postsRes, usersRes] = await Promise.all([
      tryGet(paths.searchPosts(q)).catch(()=>({ data: [] })),
      tryGet(paths.searchUsers(q)).catch(()=>({ data: [] })),
    ]);
    onResults?.({
      posts: Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.posts || [],
      users: Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.users || usersRes.data?.creators || [],
    });
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
