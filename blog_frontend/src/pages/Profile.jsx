// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { tryGet, tryPut } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const paths = {
  me: (id) => [`/api/user/profile/${id}`, `/profile/${id}`],
  edit: (id) => [`/api/user/edit/${id}`, `/api/user/profile/${id}`],
};

export default function Profile() {
  const { userId, user, setUser } = useAuth();
  const [form, setForm] = useState({ username:"", bio:"", creatorBio:"", creatorCategory:"" });
  const [saving, setSaving] = useState(false);

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
      });
    })();
  },[userId]);

  async function onSave(e){
    e.preventDefault(); setSaving(true);
    try {
      const res = await tryPut(paths.edit(userId), form);
      setUser(res.data);
    } finally { setSaving(false); }
  }

  return (
    <div className="container narrow">
      <h2>Profile</h2>
      <form onSubmit={onSave}>
        <input className="input" value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})} />
        <textarea className="textarea" value={form.bio} onChange={(e)=>setForm({...form, bio:e.target.value})} placeholder="Bio" />
        <h3 className="section-title">Creator Profile</h3>
        <input className="input" value={form.creatorCategory} onChange={(e)=>setForm({...form, creatorCategory:e.target.value})} placeholder="Category" />
        <textarea className="textarea" value={form.creatorBio} onChange={(e)=>setForm({...form, creatorBio:e.target.value})} placeholder="Creator bio" />
        <button className="btn" disabled={saving}>{saving?"Saving…":"Save"}</button>
      </form>
    </div>
  );
}
