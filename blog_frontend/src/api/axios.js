// src/api/apiSimple.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Attach token if present
API.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// GET
export const getProfile = (id) => API.get(`/api/user/profile/${id}`);            // or `/profile/${id}` alias
export const getPublicPosts = () => API.get(`/api/user/post`, { params: { ispublic: true } });
export const getSubFeed = () => API.get(`/api/subscription/content`);
export const searchPosts = (q) => API.get(`/api/posts/search`, { params: { q } }); // alias
export const searchUsers = (q) => API.get(`/api/user/search/users`, { params: { q } });
export const listUsers = (q) => API.get(`/api/users`, { params: { search: q } });  // alias
export const userPosts = (id, onlyPublic = true) => API.get(`/api/user/${id}/posts`, { params: { public: onlyPublic } });
export const postsByAuthor = (id) => API.get(`/api/posts`, { params: { author: id, public: true } }); // alias
export const adminPublicContent = () => API.get(`/api/admin/create-content`);
export const creatorList = (q) => API.get(`/api/subscription/creators`, { params: { search: q } });
export const bookmarks = () => API.get(`/api/user/bookmarks`);
export const getCreatorContent = (creatorId) => API.get(`/api/subscription/creator/${creatorId}/content`);
export const getPost = (id) => API.get(`/api/posts/${id}`);

// POST
export const signup = (payload) => API.post(`/api/user/signup`, payload);
export const login = (payload) => API.post(`/api/user/login`, payload);
export const createPost = (payload) => API.post(`/api/user/post`, payload);
export const like = (postId) => API.post(`/api/user/like/${postId}`); // alias exists `/api/posts/:id/like`
export const bookmarkAdd = (postId) => API.post(`/api/user/bookmarks/${postId}`); // alias exists `/api/user/bookmark/:id`
export const subscribe = (creatorId) => API.post(`/api/subscription/subscribe/${creatorId}`);
export const adminCreateContent = (payload) => API.post(`/api/admin/create-content`, payload);
export const addComment = (postId, comment) => API.post(`/api/user/comment/${postId}`, { comment });

// PUT
export const editProfile = (id, payload) => API.put(`/api/user/edit/${id}`, payload);
export const adminVerifyCreator = (id) => API.put(`/api/admin/verify-creator/${id}`);

// DELETE
export const bookmarkRemove = (postId) => API.delete(`/api/user/bookmarks/${postId}`); // alias exists `/api/user/bookmark/:id`
export const unsubscribe = (creatorId) => API.delete(`/api/subscription/unsubscribe/${creatorId}`);

// ---------------- Backward-compatible helpers ----------------
// These preserve older imports in the codebase that expect tryGet/tryPost/etc.
export async function tryGet(paths, params) {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr;
  for (const p of list) {
    try {
      return await API.get(p, { params });
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("GET failed");
}
export async function tryPost(paths, data, config) {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr;
  for (const p of list) {
    try {
      return await API.post(p, data, config);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("POST failed");
}
export async function tryPut(paths, data) {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr;
  for (const p of list) {
    try {
      return await API.put(p, data);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("PUT failed");
}
export async function tryDel(paths) {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastErr;
  for (const p of list) {
    try {
      return await API.delete(p);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("DELETE failed");
}