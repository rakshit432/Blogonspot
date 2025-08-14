// src/pages/CreatorProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { tryGet } from "../api/axios";
import PostCard from "../components/PostCard";

const paths = {
  content: (id) => [
    `/api/subscription/creator/${id}/content`,
    `/api/user/${id}/posts`,
    `/api/posts?author=${id}`
  ],
  profile: (id) => [
    `/api/user/profile/${id}`, `/profile/${id}`
  ],
};

export default function CreatorProfile() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(()=>{
    (async ()=>{
      const [pRes, cRes] = await Promise.all([
        tryGet(paths.content(id)).catch(()=>({ data: [] })),
        tryGet(paths.profile(id)).catch(()=>({ data: null })),
      ]);
      setPosts(Array.isArray(pRes.data)?pRes.data:pRes.data?.posts||[]);
      setCreator(cRes.data);
    })();
  },[id]);

  return (
    <div className="container">
      <h2 className="section-title">{creator?.username || "Creator"}</h2>
      <p className="muted">{creator?.creatorCategory}</p>
      <p>{creator?.creatorBio}</p>
      <div className="grid">
        {posts.map((p)=> <PostCard key={p._id} post={p} />)}
      </div>
    </div>
  );
}
