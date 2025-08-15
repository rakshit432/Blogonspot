// src/pages/CreatePost.jsx
import { useState } from "react";
import { tryPost } from "../api/axios";
import { useNavigate } from "react-router-dom";

const paths = {
  create: ["/api/user/post"]
};

export default function CreatePost() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title:"", content:"", tags:"", isPublic:true });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        tags: form.tags ? form.tags.split(",").map(s=>s.trim()) : [],
        isPublic: !!form.isPublic
      };
      await tryPost(paths.create, payload);
      nav("/");
    } finally { setLoading(false); }
  }

  return (
    <div className="container narrow">
      <h2>Create Post</h2>
      <form onSubmit={onSubmit}>
        <input className="input" placeholder="Title"
          value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
        <textarea className="textarea" placeholder="Write your content..."
          value={form.content} onChange={(e)=>setForm({...form, content:e.target.value})} required />
        <input className="input" placeholder="Tags (comma separated)"
          value={form.tags} onChange={(e)=>setForm({...form, tags:e.target.value})} />
        <label className="switch">
          <input type="checkbox" checked={form.isPublic}
            onChange={(e)=>setForm({...form, isPublic:e.target.checked})} />
          <span>Public (uncheck for subscribers-only)</span>
        </label>
        <button className="btn" disabled={loading}>{loading?"Publishing…":"Publish"}</button>
      </form>
    </div>
  );
}
