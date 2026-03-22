import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.register(name, email, password);
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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

        <h2 className="form-title">Get started free</h2>
        <p className="form-title-sub">Create your AgentHub account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Smith"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label>Email address</label>
            <input
              id="signup-email"
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
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '20px', padding: '13px' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="form-divider">or</div>

        <p className="form-footer-link">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          By signing up you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};

export default Signup;
