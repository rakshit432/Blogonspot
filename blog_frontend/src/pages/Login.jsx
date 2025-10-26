// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      nav("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your account</p>
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

          <motion.button 
            className="auth-button" 
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </motion.button>
        </motion.form>

        <motion.p 
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          No account? <Link to="/signup" className="auth-link">Create one</Link>
        </motion.p>
      </div>
    </motion.div>
  );
}
