// src/api/axios.js
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message || err?.message || "Request failed";
    if (err?.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
      localStorage.clear();
      // Optional: window.location.href = "/login";
    } else {
      toast.error(message);
    }
    return Promise.reject(err);
  }
);

// Helper to try multiple endpoints in order
export async function tryGet(paths, params) {
  for (const p of paths) {
    try { return await api.get(p, { params }); } catch {}
  }
  throw new Error("GET failed: " + paths.join(", "));
}
export async function tryPost(paths, data, config) {
  for (const p of paths) {
    try { return await api.post(p, data, config); } catch {}
  }
  throw new Error("POST failed: " + paths.join(", "));
}
export async function tryPut(paths, data) {
  for (const p of paths) {
    try { return await api.put(p, data); } catch {}
  }
  throw new Error("PUT failed: " + paths.join(", "));
}
export async function tryDel(paths) {
  for (const p of paths) {
    try { return await api.delete(p); } catch {}
  }
  throw new Error("DELETE failed: " + paths.join(", "));
}
