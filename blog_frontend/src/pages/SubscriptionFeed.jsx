// src/pages/SubscriptionFeed.jsx
import { useEffect, useState } from "react";
import { tryGet } from "../api/axios";
import PostCard from "../components/PostCard";

const paths = {
  feed: ["/api/subscription/content"],
};

export default function SubscriptionFeed(){
  const [posts, setPosts] = useState([]);
  useEffect(()=>{
    tryGet(paths.feed).then(res=>{
      const arr = Array.isArray(res.data)?res.data:res.data?.posts||[];
      setPosts(arr);
    }).catch(()=>setPosts([]));
  },[]);
  return (
    <div className="container">
      <h2 className="section-title">Subscribed content</h2>
      <div className="grid">{posts.map(p=><PostCard key={p._id} post={p} />)}</div>
    </div>
  );
}
