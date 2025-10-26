import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProfile, getCreatorContent, userPosts, adminUserPosts, subscribe as apiSubscribe, unsubscribe as apiUnsubscribe, adminDeletePost, adminDisableUser, adminEnableUser } from "../api/axios";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

export default function CreatorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, role } = useAuth();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [adminActing, setAdminActing] = useState(false);
  
  const userId = currentUser?._id;
  const isOwnProfile = String(userId) === String(id);
  const isAdmin = role === 'admin';

  async function load() {
    try {
      setLoading(true);
      setError(null);
      
      const [profRes, contentRes] = await Promise.allSettled([
        getProfile(id).catch(() => ({ data: null })),
        getCreatorContent(id).catch(() => ({ 
          data: { posts: [], isSubscribed: false } 
        })),
      ]);

      const profileData = profRes.status === 'fulfilled' ? profRes.value?.data : null;
      const contentData = contentRes.status === 'fulfilled' ? contentRes.value?.data : { 
        posts: [], 
        isSubscribed: false 
      };

      if (!profileData) {
        throw new Error('Creator not found');
      }

      const subscribed = isAdmin || isOwnProfile || contentData?.isSubscribed;
      
      setCreator(profileData);
      setIsSubscribed(!!subscribed);

      if (isAdmin) {
        try {
          const all = await adminUserPosts(id);
          const arr = Array.isArray(all?.data) ? all.data : (all?.data?.posts || []);
          const unique = Array.from(new Map(arr.map(p => [String(p?._id), p])).values());
          setPosts(unique);
        } catch (e) {
          console.warn('Admin load all posts failed, falling back:', e);
          const base = Array.isArray(contentData) ? contentData : contentData?.posts || [];
          const unique = Array.from(new Map(base.map(p => [String(p?._id), p])).values());
          setPosts(unique);
        }
      } else {
        const base = Array.isArray(contentData) ? contentData : contentData?.posts || [];
        const unique = Array.from(new Map(base.map(p => [String(p?._id), p])).values());
        setPosts(unique);
      }

      // Fallback for public posts if needed
      if (!isAdmin && !subscribed && (!contentData?.posts?.length)) {
        try {
          const pub = await userPosts(id, true);
          const add = Array.isArray(pub?.data) ? pub.data : [];
          setPosts(prev => {
            const map = new Map(prev.map(p => [String(p?._id), p]));
            for (const p of add) map.set(String(p?._id), p);
            return Array.from(map.values());
          });
        } catch (e) {
          console.warn('Could not load public posts:', e);
        }
      }
    } catch (error) {
      console.error('Error loading creator profile:', error);
      setError(error.message || 'Failed to load creator profile');
      toast.error(error.message || 'Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  }

  const onLike = async (post, liked) => {
    // Your like implementation
    console.log(liked ? 'Liking post:' : 'Unliking post:', post._id);
  };

  const onBookmark = async (post, bookmarked) => {
    // Your bookmark implementation
    console.log(bookmarked ? 'Bookmarking post:' : 'Removing bookmark:', post._id);
  };

  const handleAdminToggleUser = async () => {
    try {
      setAdminActing(true);
      const active = creator?.isActive !== false; // treat undefined as active
      if (!active) {
        await adminEnableUser(creator._id);
        toast.success('User enabled');
      } else {
        await adminDisableUser(creator._id);
        toast.success('User disabled');
      }
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Admin action failed');
    } finally {
      setAdminActing(false);
    }
  };

  const handleAdminDeletePost = async (postId) => {
    try {
      setAdminActing(true);
      await adminDeletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      toast.success('Post deleted');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete post');
    } finally {
      setAdminActing(false);
    }
  };

  const toggleSubscription = async () => {
    if (!currentUser) {
      toast.error('Please log in to manage subscription');
      navigate('/login', { state: { from: `/creator/${id}` } });
      return;
    }
    try {
      setSubLoading(true);
      if (isSubscribed) {
        await apiUnsubscribe(id);
        setIsSubscribed(false);
        toast.success('Unsubscribed');
      } else {
        await apiSubscribe(id);
        setIsSubscribed(true);
        toast.success('Subscribed');
      }
      // Optionally reload content to reflect access changes
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id, userId]);

  if (loading && !creator) {
    return (
      <div className="container">
        <div className="skeleton skeleton-card" style={{ height: '200px', marginBottom: '2rem' }} />
        <div className="grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '300px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container">
        <div className="error-message">
          <p>Creator not found</p>
          <button onClick={() => navigate('/')} className="btn primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          {creator?.avatar ? (
            <img 
              src={creator.avatar} 
              alt={creator.username || 'User'} 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '2px solid var(--border)'
              }} 
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--text-secondary)',
              border: '2px solid var(--border)'
            }}>
              {creator?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h1 style={{ margin: 0 }}>
              {creator?.username || 'User'}
            </h1>
            <p style={{ margin: 0, maxWidth: '600px' }}>
              {creator?.bio || 'No bio available.'}
            </p>
          </div>
        </div>

        {!isOwnProfile && !isAdmin && (
          <div style={{ marginTop: '1rem' }}>
            <button 
              className={`btn ${isSubscribed ? 'ghost' : 'primary'}`}
              onClick={toggleSubscription}
              disabled={loading || subLoading}
            >
              {subLoading ? 'Please wait…' : (isSubscribed ? 'Unsubscribe' : 'Subscribe')}
            </button>
          </div>
        )}
        {isAdmin && !isOwnProfile && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button 
              className="btn"
              onClick={handleAdminToggleUser}
              disabled={loading || adminActing}
            >
              {adminActing ? 'Working…' : ((creator?.isActive === false) ? 'Enable User' : 'Disable User')}
            </button>
          </div>
        )}
      </div>

      <div className="posts-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <PostCard
                post={{
                  ...post,
                  author: post.author || creator
                }}
                onOpen={(p) => {
                  if (isAdmin || p?.isPublic || isSubscribed || isOwnProfile) {
                    navigate(`/post/${p._id}`);
                  }
                }}
                onLike={onLike}
                onBookmark={onBookmark}
                currentUserId={userId}
                isSubscribed={isSubscribed}
                isAdmin={isAdmin}
              />
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn ghost"
                    onClick={() => handleAdminDeletePost(post._id)}
                    disabled={adminActing}
                  >
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '2rem',
            color: 'var(--text-secondary)'
          }}>
            {isOwnProfile ? (
              <p>You haven't created any posts yet. <a href="/create" style={{ color: 'var(--brand)' }}>Create your first post</a>.</p>
            ) : (
              <p>No posts available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}