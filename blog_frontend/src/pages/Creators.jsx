// src/pages/Creators.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { creatorList, subscribe as apiSubscribe, unsubscribe as apiUnsubscribe } from "../api/axios";
import SkeletonList from "../components/Skeleton.jsx";
import { FiCheckCircle } from "react-icons/fi";

export default function Creators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const { userId } = useAuth();
  const navigate = useNavigate();

  function categoryMiniature(category, name){
    const map = {
      tech: { bg:"#E0E7FF" },
      art: { bg:"#FFE4E6" },
      photography: { bg:"#E0F2FE" },
      music: { bg:"#F5F3FF" },
      food: { bg:"#FEF2F2" },
      sports: { bg:"#ECFCCB" },
      default: { bg:"#ECFDF5" }
    };
    const key = String(category||"").toLowerCase();
    const cfg = map[key] || map.default;
    const initials = (name||"U").slice(0,2).toUpperCase();
    const svg = `<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <rect width='128' height='128' rx='24' fill='${cfg.bg}'/>\n  <text x='50%' y='24%' dominant-baseline='middle' text-anchor='middle' fill='#111827' font-family='Inter, Arial' font-size='14' font-weight='800'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  async function load() {
    try {
      setLoading(true);
      const res = await creatorList();
      const arr = Array.isArray(res.data) ? res.data : res.data?.creators || res.data?.users || [];
      setCreators(arr);
    } catch {
      setCreators([]);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); }, []);

  async function handleSubscribe(id){
    try {
      if (!localStorage.getItem("token")) { toast.error("Please log in to subscribe."); return; }
      setBusyId(id);
      await apiSubscribe(id);
      toast.success("Subscribed");
      // Navigate to the creator's profile after subscribing
      navigate(`/creator/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Subscribe failed");
    } finally { setBusyId(""); }
  }

  async function handleUnsubscribe(id){
    try {
      if (!localStorage.getItem("token")) { toast.error("Please log in to unsubscribe."); return; }
      setBusyId(id);
      await apiUnsubscribe(id);
      toast.success("Unsubscribed");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Unsubscribe failed");
    } finally { setBusyId(""); }
  }

  return (
    <div className="container">
      <h2 className="section-title">Creators</h2>
      {loading ? (
        <SkeletonList count={6} />
      ) : (
        <div className="grid">
        {creators.map((c)=>(
          <div className="card" key={c._id}>
            <div className="card-header" style={{display:"flex",alignItems:"center",gap:12}}>
              <img src={
                c.avatar || (
                  c.role === 'admin'
                    ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <defs>\n    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>\n      <stop offset='0%' stop-color='#111827'/>\n      <stop offset='100%' stop-color='#334155'/>\n    </linearGradient>\n  </defs>\n  <rect width='128' height='128' rx='24' fill='url(#g)'/>\n  <circle cx='64' cy='52' r='22' fill='#fef3c7'/>
  <rect x='30' y='80' width='68' height='30' rx='15' fill='#1f2937'/>
  <path d='M24 20 L104 20 L92 44 L36 44 Z' fill='#eab308'/>
  <text x='50%' y='20%' dominant-baseline='middle' text-anchor='middle' fill='#000' font-family='Inter, Arial' font-size='12' font-weight='800'>BOSS</text>\n</svg>`)))}`
                    : categoryMiniature(c.creatorCategory, c.username)
                )
              } alt={c.username} style={{width:48,height:48,borderRadius:999,objectFit:"cover",border:"1px solid #eee"}} />
              <div>
                <div className="title" style={{margin:0, display:"flex", alignItems:"center", gap:8}}>
                  {c.username}
                  {c.isVerifiedCreator && (
                    <span title="Verified" style={{display:"inline-flex",alignItems:"center",gap:6,color:"var(--brand)",fontSize:14}}>
                      <FiCheckCircle />
                    </span>
                  )}
                </div>
                <p className="muted" style={{margin:0}}>{c.creatorCategory || "Creator"}</p>
              </div>
            </div>
            <p style={{marginTop:8}}>{c.creatorBio}</p>
            <div className="actions" style={{display:"flex",gap:8,marginTop:12}}>
              <button className="btn ghost" onClick={()=>navigate(`/creator/${c._id}`)}>View Profile</button>
              {userId !== c._id && (
                <>
                  <button className="btn" disabled={busyId===c._id} onClick={()=>handleSubscribe(c._id)}>
                    {busyId===c._id?"...":"Subscribe"}
                  </button>
                  <button className="btn ghost" disabled={busyId===c._id} onClick={()=>handleUnsubscribe(c._id)}>
                    {busyId===c._id?"...":"Unsubscribe"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {creators.length===0 && !loading && (
          <div className="card">No creators found.</div>
        )}
      </div>
      )}
    </div>
  );
}
