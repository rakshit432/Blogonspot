// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiUser, FiSettings, FiLogOut, FiPlus, FiBookmark, FiShield } from "react-icons/fi";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileOpen(false);
      setOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setProfileOpen(!profileOpen);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setOpen(!open);
  };

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
            {user && <Link to="/feed">Subscriptions</Link>}
            {role === "admin" && (
              <Link to="/admin" className="admin-link">
                <FiShield />
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="nav-right">
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
