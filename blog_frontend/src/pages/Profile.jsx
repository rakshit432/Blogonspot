// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { FiCheckCircle, FiUpload } from "react-icons/fi";
import { tryGet, tryPut } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const paths = {
  me: (id) => [`/api/user/profile/${id}`, `/profile/${id}`],
  edit: (id) => [`/api/user/edit/${id}`, `/api/user/profile/${id}`],
};

export default function Profile() {
  const { userId, user, setUser } = useAuth();
  const [form, setForm] = useState({ username:"", bio:"", creatorBio:"", creatorCategory:"", avatar:"" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [miniGen, setMiniGen] = useState({ icon: "writer", initials: "", bg: "#E5F4EA", accent: "#116149" });

  function makeAvatarDataURI(name = "U", bg = "#E5E7EB", fg = "#111827"){
    const initial = (name || "U").trim().charAt(0).toUpperCase();
    const svg = `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <defs>
    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0%' stop-color='${bg}'/>
      <stop offset='100%' stop-color='${shadeColor(bg, -10)}'/>
    </linearGradient>
  </defs>
  <rect width='128' height='128' rx='64' fill='url(#g)'/>
  <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' fill='${fg}' font-family='Inter, Arial, sans-serif' font-size='64' font-weight='700'>${initial}</text>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  function shadeColor(hex, percent){
    try {
      const f = parseInt(hex.slice(1),16), t = percent < 0 ? 0 : 255, p = Math.abs(percent)/100;
      const R = f>>16, G = f>>8&0x00FF, B = f&0x0000FF;
      return "#"+(
        (0x1000000 + (Math.round((t-R)*p)+R)*0x10000 + (Math.round((t-G)*p)+G)*0x100 + (Math.round((t-B)*p)+B))
      ).toString(16).slice(1);
    } catch { return hex; }
  }

  const presetColors = [
    ["#E5F4EA", "#116149"],
    ["#E6EEFF", "#1D4ED8"],
    ["#FEF3C7", "#92400E"],
    ["#FFE4E6", "#9F1239"],
    ["#EDE9FE", "#5B21B6"],
    ["#F1F5F9", "#0F172A"],
    ["#ECFDF5", "#065F46"],
    ["#FFF7ED", "#9A3412"],
  ];

  function categoryMiniature(category, name){
    const map = {
      tech: { bg: "#E0E7FF" },
      art: { bg: "#FFE4E6" },
      photography: { bg: "#E0F2FE" },
      music: { bg: "#F5F3FF" },
      food: { bg: "#FEF2F2" },
      sports: { bg: "#ECFCCB" },
      default: { bg: "#ECFDF5" }
    };
    const key = String(category||"").toLowerCase();
    const cfg = map[key] || map.default;
    const initials = (name||"U").slice(0,2).toUpperCase();
    const svg = `<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <rect width='128' height='128' rx='24' fill='${cfg.bg}'/>\n  <text x='50%' y='24%' dominant-baseline='middle' text-anchor='middle' fill='#111827' font-family='Inter, Arial' font-size='14' font-weight='800'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  // Dynamic character miniature generator
  function makeMiniatureDataURI({ icon, initials, bg, accent }){
    const safeInitials = (initials || (form.username||"U").slice(0,2)).toUpperCase();
    // choose icon svg content
    let iconSvg = "";
    switch(icon){
      case "writer":
        iconSvg = "<rect x='24' y='28' width='80' height='72' rx='8' fill='"+shadeColor(bg,-10)+"' stroke='"+accent+"' stroke-width='2'/>"+
                  "<rect x='34' y='40' width='60' height='6' rx='3' fill='"+accent+"'/>"+
                  "<rect x='34' y='54' width='50' height='6' rx='3' fill='"+accent+"'/>";
        break;
      case "camera":
        iconSvg = "<rect x='28' y='48' width='72' height='44' rx='8' fill='"+shadeColor(bg,-10)+"'/>"+
                  "<rect x='44' y='40' width='40' height='12' rx='6' fill='"+accent+"'/>"+
                  "<circle cx='64' cy='70' r='12' fill='"+accent+"' opacity='0.5'/>";
        break;
      case "music":
        iconSvg = "<path d='M44 36 L92 28 L92 80' stroke='"+accent+"' stroke-width='8' fill='none'/>"+
                  "<circle cx='52' cy='84' r='12' fill='"+shadeColor(accent,-10)+"'/>";
        break;
      case "scientist":
        iconSvg = "<circle cx='48' cy='52' r='12' fill='"+accent+"'/>"+
                  "<circle cx='80' cy='52' r='12' fill='"+accent+"'/>"+
                  "<rect x='40' y='66' width='48' height='8' rx='4' fill='"+shadeColor(accent,-15)+"'/>";
        break;
      case "chef":
        iconSvg = "<rect x='44' y='36' width='40' height='22' rx='11' fill='"+accent+"' opacity='0.8'/>"+
                  "<rect x='40' y='62' width='48' height='8' rx='4' fill='"+shadeColor(accent,-20)+"'/>";
        break;
      case "athlete":
        iconSvg = "<circle cx='64' cy='44' r='14' fill='"+accent+"'/>"+
                  "<rect x='40' y='64' width='48' height='10' rx='5' fill='"+shadeColor(accent,-15)+"'/>";
        break;
      default: // gamer
        iconSvg = "<rect x='32' y='80' width='64' height='30' rx='15' fill='"+accent+"'/>"+
                  "<circle cx='48' cy='95' r='5' fill='#1F2937'/>"+
                  "<circle cx='80' cy='95' r='5' fill='#1F2937'/>";
    }
    const svg = `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='${bg}'/>
  ${iconSvg}
  <text x='50%' y='24%' dominant-baseline='middle' text-anchor='middle' fill='#111827' font-family='Inter, Arial' font-size='14' font-weight='800'>${safeInitials}</text>
</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  // Simple character miniatures (SVG data URIs)
  const characterPresets = [
    // Explorer
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#DCFCE7'/>
  <circle cx='64' cy='48' r='22' fill='#FDE68A'/>
  <rect x='28' y='76' width='72' height='36' rx='18' fill='#10B981'/>
  <path d='M36 38 L52 30 L76 30 L92 38' fill='none' stroke='#065F46' stroke-width='6'/>
  <circle cx='54' cy='50' r='4' fill='#065F46'/>
  <circle cx='74' cy='50' r='4' fill='#065F46'/>
  <path d='M54 60 Q64 66 74 60' stroke='#065F46' stroke-width='4' fill='none'/>
</svg>`)))}`,
    // Coder
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#E0E7FF'/>
  <circle cx='64' cy='50' r='22' fill='#C7D2FE'/>
  <rect x='24' y='78' width='80' height='34' rx='8' fill='#374151'/>
  <rect x='32' y='86' width='64' height='6' rx='3' fill='#10B981'/>
  <rect x='32' y='96' width='40' height='6' rx='3' fill='#F59E0B'/>
  <circle cx='56' cy='50' r='4' fill='#1F2937'/>
  <circle cx='72' cy='50' r='4' fill='#1F2937'/>
  <path d='M56 60 Q64 64 72 60' stroke='#1F2937' stroke-width='3' fill='none'/>
</svg>`)))}`,
    // Artist
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#FFE4E6'/>
  <circle cx='64' cy='48' r='22' fill='#FDA4AF'/>
  <rect x='28' y='76' width='72' height='36' rx='18' fill='#DB2777'/>
  <path d='M28 28 L100 28 L96 40 L32 40 Z' fill='#F472B6'/>
  <circle cx='54' cy='50' r='4' fill='#831843'/>
  <circle cx='74' cy='50' r='4' fill='#831843'/>
  <path d='M52 61 Q64 68 76 61' stroke='#831843' stroke-width='4' fill='none'/>
</svg>`)))}`,
    // Gamer
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#E2E8F0'/>
  <circle cx='64' cy='46' r='22' fill='#94A3B8'/>
  <rect x='32' y='80' width='64' height='30' rx='15' fill='#0EA5E9'/>
  <circle cx='48' cy='95' r='5' fill='#1F2937'/>
  <circle cx='80' cy='95' r='5' fill='#1F2937'/>
  <circle cx='58' cy='50' r='4' fill='#111827'/>
  <circle cx='70' cy='50' r='4' fill='#111827'/>
  <rect x='40' y='86' width='12' height='4' rx='2' fill='#FDE047'/>
  <rect x='76' y='86' width='12' height='4' rx='2' fill='#FDE047'/>
</svg>`)))}`,

    // Writer
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#FFF7ED'/>
  <rect x='24' y='28' width='80' height='72' rx='8' fill='#FED7AA' stroke='#9A3412' stroke-width='2'/>
  <rect x='34' y='40' width='60' height='6' rx='3' fill='#9A3412'/>
  <rect x='34' y='54' width='50' height='6' rx='3' fill='#9A3412'/>
  <rect x='34' y='68' width='56' height='6' rx='3' fill='#9A3412'/>
  <circle cx='96' cy='92' r='8' fill='#9A3412'/>
</svg>`)))}`,

    // Photographer
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#E0F2FE'/>
  <rect x='28' y='48' width='72' height='44' rx='8' fill='#0EA5E9'/>
  <rect x='44' y='40' width='40' height='12' rx='6' fill='#0369A1'/>
  <circle cx='64' cy='70' r='14' fill='#93C5FD'/>
  <circle cx='64' cy='70' r='8' fill='#1D4ED8'/>
</svg>`)))}`,

    // Musician
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#F5F3FF'/>
  <path d='M44 36 L92 28 L92 80' stroke='#6D28D9' stroke-width='8' fill='none'/>
  <circle cx='92' cy='84' r='8' fill='#4C1D95'/>
  <circle cx='52' cy='84' r='12' fill='#7C3AED'/>
</svg>`)))}`,

    // Scientist
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#ECFEFF'/>
  <circle cx='48' cy='52' r='14' fill='#06B6D4'/>
  <circle cx='80' cy='52' r='14' fill='#06B6D4'/>
  <rect x='36' y='66' width='56' height='10' rx='5' fill='#0891B2'/>
  <rect x='58' y='76' width='12' height='28' rx='6' fill='#164E63'/>
</svg>`)))}`,

    // Chef
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#FEF2F2'/>
  <rect x='36' y='64' width='56' height='36' rx='8' fill='#DC2626'/>
  <rect x='44' y='36' width='40' height='22' rx='11' fill='#F87171'/>
  <rect x='40' y='58' width='48' height='6' rx='3' fill='#7F1D1D'/>
</svg>`)))}`,

    // Athlete
    `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='128' height='128' rx='24' fill='#ECFCCB'/>
  <circle cx='64' cy='44' r='16' fill='#84CC16'/>
  <rect x='40' y='64' width='48' height='12' rx='6' fill='#65A30D'/>
  <rect x='36' y='78' width='56' height='8' rx='4' fill='#365314'/>
</svg>`)))}`,
  ];

  useEffect(()=>{
    (async ()=>{
      const res = await tryGet(paths.me(userId));
      const u = res.data;
      setUser(u);
      setForm({
        username: u.username || "",
        bio: u.bio || "",
        creatorBio: u.creatorBio || "",
        creatorCategory: u.creatorCategory || "",
        avatar: u.avatar || "",
      });
    })();
  },[userId]);

  async function onSave(e){
    e.preventDefault(); setSaving(true);
    try {
      const res = await tryPut(paths.edit(userId), form);
      setUser(res.data?.user || res.data);
    } finally { setSaving(false); }
  }

  return (
    <div className="container narrow">
      <div className="card" style={{padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <img
            src={
              form.avatar || (
                user?.role === 'admin'
                  ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <defs>\n    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>\n      <stop offset='0%' stop-color='#111827'/>\n      <stop offset='100%' stop-color='#334155'/>\n    </linearGradient>\n  </defs>\n  <rect width='128' height='128' rx='24' fill='url(#g)'/>\n  <circle cx='64' cy='52' r='22' fill='#fef3c7'/>\n  <rect x='30' y='80' width='68' height='30' rx='15' fill='#1f2937'/>\n  <path d='M24 20 L104 20 L92 44 L36 44 Z' fill='#eab308'/>\n  <text x='50%' y='20%' dominant-baseline='middle' text-anchor='middle' fill='#000' font-family='Inter, Arial' font-size='12' font-weight='800'>BOSS</text>\n</svg>`)))}`
                  : categoryMiniature(form.creatorCategory, form.username)
              )
            }
            alt={form.username}
            style={{width:56,height:56,borderRadius:999,objectFit:"cover",border:"1px solid var(--border)"}}
          />
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <h2 style={{margin:0}}>{form.username || "Profile"}</h2>
              {user?.isVerifiedCreator && (
                <span title="Verified" style={{display:"inline-flex",alignItems:"center",gap:6,color:"var(--brand)",fontSize:14}}>
                  <FiCheckCircle />
                </span>
              )}
            </div>
            <div className="muted" style={{marginTop:2}}>{user?.email}</div>
          </div>
        </div>

        <form onSubmit={onSave} className="space-y-3">
          <label style={{display:"block"}}>Username
            <input className="input" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} />
          </label>

          <label style={{display:"block"}}>Bio
            <textarea className="textarea" value={form.bio} onChange={(e)=>setForm({...form, bio:e.target.value})} placeholder="Bio" />
          </label>

          <div className="card" style={{padding:12}}>
            <div className="muted" style={{marginBottom:8}}>Avatar</div>
            <label style={{display:"block"}}>Avatar URL
              <input className="input" placeholder="https://..."
                value={form.avatar}
                onChange={(e)=>setForm({...form, avatar:e.target.value})}
              />
            </label>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
              <label className="btn ghost" style={{cursor:"pointer"}}>
                <FiUpload /> Upload
                <input type="file" accept="image/*" style={{display:"none"}}
                  onChange={async (e)=>{
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setForm(f=>({...f, avatar: String(reader.result)}));
                      setUploading(false);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
              {uploading && <span className="muted">Uploading…</span>}
            </div>

            <div className="muted" style={{marginTop:12, marginBottom:6}}>Or pick a preset</div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(8, 36px)", gap:8}}>
              {presetColors.map(([bg, fg], idx)=>{
                const uri = makeAvatarDataURI(form.username, bg, fg);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={()=>setForm(f=>({...f, avatar: uri}))}
                    title="Use this avatar"
                    style={{
                      width:36,height:36, borderRadius:999, padding:0, border:"1px solid var(--border)",
                      background:"transparent", cursor:"pointer"
                    }}
                  >
                    <img src={uri} alt="preset" style={{width:"100%",height:"100%",borderRadius:999}} />
                  </button>
                );
              })}
            </div>

            <div className="muted" style={{marginTop:12, marginBottom:6}}>Character minis</div>
            <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
              {characterPresets.map((uri, i)=> (
                <button
                  type="button"
                  key={i}
                  onClick={()=>setForm(f=>({...f, avatar: uri}))}
                  title="Use this character"
                  style={{ width:44, height:44, borderRadius:999, padding:0, border:"1px solid var(--border)", background:"transparent" }}
                >
                  <img src={uri} alt="character" style={{width:"100%",height:"100%",borderRadius:999}} />
                </button>
              ))}
            </div>

            <div className="muted" style={{marginTop:12, marginBottom:6}}>Create your own miniature</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0,1fr))",gap:10, alignItems:"center"}}>
              <label>Icon
                <select className="input" value={miniGen.icon} onChange={(e)=>setMiniGen(g=>({...g, icon: e.target.value}))}>
                  <option value="writer">Writer</option>
                  <option value="camera">Photographer</option>
                  <option value="music">Musician</option>
                  <option value="scientist">Scientist</option>
                  <option value="chef">Chef</option>
                  <option value="athlete">Athlete</option>
                  <option value="gamer">Gamer</option>
                </select>
              </label>
              <label>Initials
                <input className="input" maxLength={2} placeholder="AB" value={miniGen.initials}
                       onChange={(e)=>setMiniGen(g=>({...g, initials: e.target.value.toUpperCase()}))} />
              </label>
              <label>Background
                <input type="color" className="input" value={miniGen.bg} onChange={(e)=>setMiniGen(g=>({...g, bg: e.target.value}))} />
              </label>
              <label>Accent
                <input type="color" className="input" value={miniGen.accent} onChange={(e)=>setMiniGen(g=>({...g, accent: e.target.value}))} />
              </label>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:12, marginTop:10}}>
              <img src={makeMiniatureDataURI(miniGen)} alt="mini-preview" style={{width:48,height:48,borderRadius:12,border:"1px solid var(--border)"}} />
              <button type="button" className="btn ghost" onClick={()=>setForm(f=>({...f, avatar: makeMiniatureDataURI(miniGen)}))}>Use this</button>
            </div>
          </div>

          <h3 className="section-title" style={{marginTop:8}}>Creator Profile</h3>
          <label style={{display:"block"}}>Category
            <input className="input" value={form.creatorCategory} onChange={(e)=>setForm({...form, creatorCategory:e.target.value})} placeholder="Category" />
          </label>
          <label style={{display:"block"}}>Creator bio
            <textarea className="textarea" value={form.creatorBio} onChange={(e)=>setForm({...form, creatorBio:e.target.value})} placeholder="Creator bio" />
          </label>

          <button className="btn" disabled={saving}>{saving?"Saving…":"Save"}</button>
        </form>
      </div>
    </div>
  );
}
