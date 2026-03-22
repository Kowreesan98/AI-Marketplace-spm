import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  from?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const state = location.state as LocationState;
  const from = state?.from || '/';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-container">
        {/* Logo */}
        <div className="form-logo">
          <div className="logo-mark">⚡</div>
        </div>

        <h2 className="form-title">Welcome back</h2>
        <p className="form-title-sub">Sign in to your AgentHub account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '13px' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="form-divider">or</div>

        <p className="form-footer-link">
          Don't have an account?{' '}
          <Link to="/signup">Create one free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
