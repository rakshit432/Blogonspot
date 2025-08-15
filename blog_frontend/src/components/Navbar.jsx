// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiUser, FiSettings, FiLogOut, FiPlus, FiBookmark, FiShield, FiSun, FiMoon } from "react-icons/fi";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  function categoryMiniature(category, name){
    const map = {
      tech: { icon:"camera", bg:"#E0E7FF", accent:"#1D4ED8" },
      art: { icon:"artist", bg:"#FFE4E6", accent:"#DB2777" },
      photography: { icon:"camera", bg:"#E0F2FE", accent:"#0EA5E9" },
      music: { icon:"music", bg:"#F5F3FF", accent:"#6D28D9" },
      food: { icon:"chef", bg:"#FEF2F2", accent:"#DC2626" },
      sports: { icon:"athlete", bg:"#ECFCCB", accent:"#65A30D" },
      default: { icon:"writer", bg:"#ECFDF5", accent:"#065F46" }
    };
    const key = String(category||"").toLowerCase();
    const cfg = map[key] || map.default;
    const initials = (name||"U").slice(0,2).toUpperCase();
    const svg = `<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <rect width='128' height='128' rx='24' fill='${cfg.bg}'/>\n  <text x='50%' y='24%' dominant-baseline='middle' text-anchor='middle' fill='#111827' font-family='Inter, Arial' font-size='14' font-weight='800'>${initials}</text>\n</svg>`;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  const avatarSrc = (()=>{
    if (user?.avatar) return user.avatar;
    if (user?.role === 'admin') {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>\n  <defs>\n    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>\n      <stop offset='0%' stop-color='#111827'/>\n      <stop offset='100%' stop-color='#334155'/>\n    </linearGradient>\n  </defs>\n  <rect width='128' height='128' rx='24' fill='url(#g)'/>\n  <circle cx='64' cy='52' r='22' fill='#fef3c7'/>\n  <rect x='30' y='80' width='68' height='30' rx='15' fill='#1f2937'/>\n  <path d='M24 20 L104 20 L92 44 L36 44 Z' fill='#eab308'/>\n  <text x='50%' y='20%' dominant-baseline='middle' text-anchor='middle' fill='#000' font-family='Inter, Arial' font-size='12' font-weight='800'>BOSS</text>\n</svg>`)))}`;
    }
    return categoryMiniature(user?.creatorCategory, user?.username);
  })();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileOpen(false);
      setOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setProfileOpen(!profileOpen);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="nav-left">
          <button 
            className="icon-btn" 
            onClick={handleMenuClick} 
            aria-label="menu"
          >
            <FiMenu />
          </button>
          <Link to="/" className="brand">BlogOnSpot</Link>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/creators">Creators</Link>
            {role === "admin" && (
              <Link to="/admin" className="admin-link">
                <FiShield />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="nav-right">
          <button className="icon-btn" onClick={toggleTheme} aria-label="toggle theme" title="Toggle theme">
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          {!user ? (
            <>
              <Link className="btn ghost" to="/login">Sign in</Link>
              <Link className="btn" to="/signup">Get started</Link>
            </>
          ) : (
            <div className="profile-wrap">
              <button 
                className="icon-btn profile-btn" 
                onClick={handleProfileClick} 
                aria-label="profile"
              >
                <FiUser />
                {role === "admin" && <span className="admin-badge">A</span>}
              </button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    className="dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">
                      <strong>{user?.username || 'User'}</strong>
                      {role === "admin" && <span className="admin-tag">Admin</span>}
                    </div>
                    <button onClick={() => {setProfileOpen(false); nav("/profile");}}>
                      <FiUser />
                      Profile
                    </button>
                    <button onClick={() => {setProfileOpen(false); nav("/create");}}>
                      <FiPlus />
                      Create Post
                    </button>
                    <button onClick={() => {setProfileOpen(false); nav("/bookmarks");}}>
                      <FiBookmark />
                      Bookmarks
                    </button>
                    <button onClick={() => {setProfileOpen(false); nav("/settings");}}>
                      <FiSettings />
                      Settings
                    </button>
                    <hr className="dropdown-divider" />
                    <button 
                      onClick={() => {setProfileOpen(false); logout(); nav("/");}}
                      className="logout-btn"
                    >
                      <FiLogOut />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            className="drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/create" onClick={() => setOpen(false)}>
              <FiPlus />
              Create Post
            </Link>
            <Link to="/bookmarks" onClick={() => setOpen(false)}>
              <FiBookmark />
              Bookmarks
            </Link>
            {role === "admin" && (
              <Link to="/admin" onClick={() => setOpen(false)}>
                <FiShield />
                Admin Panel
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
