// src/pages/Signup.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiShield } from "react-icons/fi";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ 
    username: "", 
    email: "", 
    password: "",
    role: "user",
    adminKey: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form);
      nav("/login");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="auth-card">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join our community of writers and readers</p>
        </motion.div>

        <motion.form 
          onSubmit={onSubmit}
          className="auth-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <div className="form-group">
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input 
                className="auth-input" 
                placeholder="Username" 
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})} 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input 
                className="auth-input" 
                placeholder="Email" 
                type="email" 
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})} 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input 
                className="auth-input" 
                placeholder="Password" 
                type="password" 
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})} 
                required 
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="role-selector">
              <label className="role-label">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={form.role === "user"}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    disabled={loading}
                  />
                <span className="role-option">User</span>
              </label>
              <label className="role-label">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={form.role === "admin"}
                  onChange={(e) => setForm({...form, role: e.target.value})}
                  disabled={loading}
                />
                <span className="role-option">Admin</span>
              </label>
            </div>
          </div>

          {form.role === "admin" && (
            <motion.div 
              className="form-group"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="input-wrapper">
                <FiShield className="input-icon" />
                  <input 
                    className="auth-input" 
                    placeholder="Admin Key" 
                    type="password" 
                    value={form.adminKey}
                    onChange={(e) => setForm({...form, adminKey: e.target.value})} 
                    required={form.role === "admin"}
                    disabled={loading}
                  />
              </div>
            </motion.div>
          )}

          <motion.button 
            className="auth-button" 
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? "Creating account..." : "Create account"}
          </motion.button>
        </motion.form>

        <motion.p 
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
