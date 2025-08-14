// src/pages/Creators.jsx
import { useEffect, useState } from "react";
import { tryDel, tryGet, tryPost } from "../api/axios";

const paths = {
  list: ["/api/subscription/creators", "/api/admin/creators", "/api/user/creators"],
  subscribe: (id) => [`/api/subscription/subscribe/${id}`],
  unsubscribe: (id) => [`/api/subscription/unsubscribe/${id}`],
};

export default function Creators() {
  const [creators, setCreators] = useState([]);

  async function load() {
    const res = await tryGet(paths.list).catch(()=>({ data: [] }));
    const arr = Array.isArray(res.data) ? res.data : res.data?.creators || res.data?.users || [];
    setCreators(arr);
  }
  useEffect(()=>{ load(); }, []);

  return (
    <div className="container">
      <h2 className="section-title">Creators</h2>
      <div className="grid">
        {creators.map((c)=>(
          <div className="card" key={c._id}>
            <div className="title">{c.username}</div>
            <p className="muted">{c.creatorCategory || "Creator"}</p>
            <p>{c.creatorBio}</p>
            <div className="actions">
              <button className="btn" onClick={()=>tryPost(paths.subscribe(c._id)).then(load)}>Subscribe</button>
              <button className="btn ghost" onClick={()=>tryDel(paths.unsubscribe(c._id)).then(load)}>Unsubscribe</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
