import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon">⚡</div>
        <span>Agent<span className="brand-accent">Hub</span></span>
      </Link>

      <div className="navbar-links">
        <Link
          to="/"
          style={{
            color: isActive('/') ? 'var(--accent)' : undefined,
            background: isActive('/') ? 'var(--accent-dim)' : undefined,
          }}
        >
          Explore
        </Link>

        {user && (
          <Link
            to="/dashboard"
            style={{
              color: isActive('/dashboard') ? 'var(--accent)' : undefined,
              background: isActive('/dashboard') ? 'var(--accent-dim)' : undefined,
            }}
          >
            Dashboard
          </Link>
        )}

        {user ? (
          <div className="navbar-user">
            <div className="user-chip">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
