// src/pages/Bookmarks.jsx
import { useEffect, useState } from "react";
import { tryDel, tryGet } from "../api/axios";
import PostCard from "../components/PostCard";

const paths = {
  list: ["/api/user/bookmarks", "/api/user/saved"],
  remove: (id) => [`/api/user/bookmarks/${id}`, `/api/user/bookmark/${id}`],
};

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  async function load(){
    const res = await tryGet(paths.list).catch(()=>({ data: [] }));
    const arr = Array.isArray(res.data)?res.data:res.data?.posts||[];
    setPosts(arr);
  }
  useEffect(()=>{ load(); },[]);
  return (
    <div className="container">
      <h2 className="section-title">Bookmarked</h2>
      <div className="grid">
        {posts.map(p=>(
          <PostCard key={p._id} post={p} onBookmark={()=>tryDel(paths.remove(p._id)).then(load)} />
        ))}
      </div>
    </div>
  );
}
