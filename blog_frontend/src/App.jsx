// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Creators from "./pages/Creators";
import CreatorProfile from "./pages/CreatorProfile";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import SubscriptionFeed from "./pages/SubscriptionFeed";
import AdminDashboard from "./pages/AdminDashboard";
import Bookmarks from "./pages/Bookmarks";
import { useAuth } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

function Private({ children }) {
  const { userId } = useAuth();
  return userId ? children : <Navigate to="/login" replace />;
}
function AdminOnly({ children }) {
  const { role } = useAuth();
  return role === "admin" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/creator/:id" element={<CreatorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/create" element={<Private><CreatePost /></Private>} />
        <Route path="/profile" element={<Private><Profile /></Private>} />
        <Route path="/settings" element={<Private><Profile /></Private>} />
        <Route path="/bookmarks" element={<Private><Bookmarks /></Private>} />
        <Route path="/feed" element={<Private><SubscriptionFeed /></Private>} />

        <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
