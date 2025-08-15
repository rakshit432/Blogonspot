// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { tryGet, tryPost, tryPut } from "../api/axios";

const paths = {
  dashboard: ["/api/admin/dashboard"],
  createContent: ["/api/admin/create-content"],
  verifyCreator: (id) => [`/api/admin/verify-creator/${id}`],
  unverifyCreator: (id) => [`/api/admin/unverify-creator/${id}`],
  creators: ["/api/admin/creators", "/api/subscription/creators"],
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [creators, setCreators] = useState([]);
  const [draft, setDraft] = useState({ title:"", content:"", isPublic:true });

  async function load(){
    const [d, c] = await Promise.all([
      tryGet(paths.dashboard).catch(()=>({ data:null })),
      tryGet(paths.creators).catch(()=>({ data:[] })),
    ]);
    setStats(d.data);
    const arr = Array.isArray(c.data)?c.data:c.data?.creators||[];
    setCreators(arr);
  }
  useEffect(()=>{ load(); },[]);

  async function publish(){
    await tryPost(paths.createContent, draft);
    setDraft({ title:"", content:"", isPublic:true });
    await load();
  }

  return (
    <div className="container">
      <h2 className="section-title">Admin Dashboard</h2>
      {stats && (
        <div className="stats">
          <div>Total Users: {stats?.stats?.totalUsers}</div>
          <div>Total Blogs: {stats?.stats?.totalBlogs}</div>
          <div>Published: {stats?.stats?.publishedBlogs}</div>
        </div>
      )}

      <h3>Create Admin Content</h3>
      <input className="input" placeholder="Title" value={draft.title} onChange={(e)=>setDraft({...draft, title:e.target.value})} />
      <textarea className="textarea" placeholder="Content" value={draft.content} onChange={(e)=>setDraft({...draft, content:e.target.value})} />
      <label className="switch">
        <input type="checkbox" checked={draft.isPublic} onChange={(e)=>setDraft({...draft, isPublic:e.target.checked})} />
        <span>Public</span>
      </label>
      <button className="btn" onClick={publish}>Publish</button>

      <h3 className="section-title">Creators</h3>
      <div className="grid">
        {creators.map(c=>(
          <div className="card" key={c._id}>
            <div className="title">{c.username}</div>
            <div className="muted">{String(c.isVerifiedCreator ? "Verified" : "Unverified")}</div>
            <button
              className="btn"
              onClick={()=>{
                const p = c.isVerifiedCreator ? paths.unverifyCreator(c._id) : paths.verifyCreator(c._id);
                return tryPut(p, {}).then(load);
              }}
            >
              {c.isVerifiedCreator? "Unverify":"Verify"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
