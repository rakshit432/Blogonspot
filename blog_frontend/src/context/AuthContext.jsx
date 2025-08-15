// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { tryGet, tryPost } from "../api/axios";
import { toast } from "react-hot-toast";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const paths = {
  signup: ["/api/user/signup"],
  login: ["/api/user/login"],
  me: (id) => [`/api/user/profile/${id}`],
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "user");
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    setBooting(false);
  }, []);

  useEffect(() => {
    if (!token || !userId) { setUser(null); return; }
    (async () => {
      try {
        const res = await tryGet(paths.me(userId));
        setUser(res.data);
        if (res.data?.role && res.data.role !== role) {
          setRole(res.data.role);
          localStorage.setItem("role", res.data.role);
        }
      } catch (e) {
        // handled by interceptor
      }
    })();
  }, [token, userId]);

  async function signup(values) {
    const res = await tryPost(paths.signup, values);
    toast.success(res.data?.message || "Signup successful. Please log in.");
    return res.data;
  }

  async function login(values) {
    const res = await tryPost(paths.login, values);
    const t = res.data?.token || res.data?.jwt || "";
    const uid = res.data?.user_id || res.data?.userId || res.data?.id || "";
    const r = res.data?.role || "user";
    
    if (!t) throw new Error("Backend did not return token");
    
    // For login, we need to decode the token to get user info
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      const userInfo = await tryGet(paths.me(payload.id));
      setUser(userInfo.data);
      setRole(userInfo.data.role || "user");
      localStorage.setItem("role", userInfo.data.role || "user");
    } catch (e) {
      console.error("Error fetching user info:", e);
    }
    
    setToken(t);
    setUserId(uid || payload?.id);
    localStorage.setItem("token", t);
    localStorage.setItem("user_id", uid || payload?.id);
    toast.success("Logged in");
  }

  function logout() {
    setToken(""); setUserId(""); setRole("user"); setUser(null);
    localStorage.clear();
    toast("Logged out");
  }

  const value = { token, userId, role, user, setUser, login, signup, logout, booting };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
