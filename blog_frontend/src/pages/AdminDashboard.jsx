// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { tryGet, tryPost, tryPut } from "../api/axios";
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

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
  const [loading, setLoading] = useState(true);

  async function load(){
    setLoading(true);
    const [d, c] = await Promise.all([
      tryGet(paths.dashboard).catch(()=>({ data:null })),
      tryGet(paths.creators).catch(()=>({ data:[] })),
    ]);
    setStats(d.data);
    const arr = Array.isArray(c.data)?c.data:c.data?.creators||[];
    setCreators(arr);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function publish(){
    await tryPost(paths.createContent, draft);
    setDraft({ title:"", content:"", isPublic:true });
    await load();
  }

  ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

  const verifiedCounts = useMemo(()=>{
    const v = creators.filter(x=>x?.isVerifiedCreator).length;
    const u = Math.max(0, creators.length - v);
    return { verified: v, unverified: u };
  }, [creators]);

  const donutData = useMemo(()=>({
    labels: ["Verified", "Unverified"],
    datasets: [{
      data: [verifiedCounts.verified, verifiedCounts.unverified],
      backgroundColor: ["#16a34a", "#e5e7eb"],
      borderWidth: 0,
    }]
  }), [verifiedCounts]);

  const contentTotals = {
    total: Number(stats?.stats?.totalBlogs || stats?.totalBlogs || 0),
    published: Number(stats?.stats?.publishedBlogs || stats?.publishedBlogs || 0),
    users: Number(stats?.stats?.totalUsers || stats?.totalUsers || 0),
  };

  const barData = useMemo(()=>({
    labels: ["Users", "Blogs", "Published"],
    datasets: [{
      label: "Totals",
      data: [contentTotals.users, contentTotals.total, contentTotals.published],
      backgroundColor: "#60a5fa",
      borderRadius: 6,
    }]
  }), [contentTotals.users, contentTotals.total, contentTotals.published]);

  return (
    <div className="container">
      <h2 className="section-title">Admin Dashboard</h2>
      <div className="grid" style={{gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"1rem"}}>
        <div className="card" style={{padding:16}}>
          <div className="title">Overview</div>
          <div style={{display:"flex", gap:16, flexWrap:"wrap", marginTop:12}}>
            <div style={{minWidth:120}}>
              <div className="muted">Users</div>
              <div style={{fontSize:24, fontWeight:700}}>{contentTotals.users}</div>
            </div>
            <div style={{minWidth:120}}>
              <div className="muted">Blogs</div>
              <div style={{fontSize:24, fontWeight:700}}>{contentTotals.total}</div>
            </div>
            <div style={{minWidth:120}}>
              <div className="muted">Published</div>
              <div style={{fontSize:24, fontWeight:700}}>{contentTotals.published}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{padding:16, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <div className="title" style={{alignSelf:"stretch"}}>Creators Verification</div>
          <div style={{width:"240px", height:"240px"}}>
            <Doughnut data={donutData} options={{ plugins:{ legend:{ position:"bottom" }}}} />
          </div>
        </div>

        <div className="card" style={{padding:16}}>
          <div className="title">Content Stats</div>
          <div style={{height:260}}>
            <Bar data={barData} options={{
              responsive:true,
              maintainAspectRatio:false,
              plugins:{ legend:{ display:false }},
              scales:{ y:{ beginAtZero:true, ticks:{ precision:0 }}}
            }} />
          </div>
        </div>
      </div>

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
