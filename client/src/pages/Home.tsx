import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Agent } from '../types';

const AGENT_COLORS: Record<number, string> = {
  1: 'linear-gradient(135deg, #f97316, #ea580c)',
  2: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  3: 'linear-gradient(135deg, #10b981, #059669)',
  4: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  5: 'linear-gradient(135deg, #ec4899, #db2777)',
};

const Home: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(data);
      } catch (err) {
        setError('Failed to load agents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading agents…</span>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Hero */}
      <div className="home-hero">
        <div className="section-label">AI Agent Marketplace</div>
        <h1 className="page-title" style={{
          fontSize: '52px',
          background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '14px',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Your AI Workforce.<br/>On Demand.
        </h1>
        <p className="page-subtitle" style={{ fontSize: '17px', maxWidth: '500px', margin: '0 auto 48px' }}>
          Hire specialized AI agents by the hour. Browse, hire, and start working—no setup required.
        </p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* Agent Grid */}
      <div className="agent-grid" style={{ marginBottom: '40px' }}>
        {agents.map((agent, idx) => (
          <div key={agent.id} className="agent-card">
            {/* Card top row */}
            <div className="agent-card-top">
              <div
                className="agent-icon-wrap"
                style={{
                  background: AGENT_COLORS[(Number(agent.id) % 5) + 1] || AGENT_COLORS[1],
                  border: 'none',
                }}
              >
                {agent.icon}
              </div>
              <span className="agent-rate-badge">${agent.rate}/hr</span>
            </div>

            {/* Info */}
            <h3 className="agent-name">{agent.name}</h3>
            <span className="agent-category">{agent.category}</span>
            <p className="agent-description">{agent.description}</p>

            {/* CTA */}
            <Link
              to={`/agent/${agent.id}`}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 'auto' }}
            >
              View Agent →
            </Link>
          </div>
        ))}
      </div>

      {/* Bottom CTA strip */}
      <div style={{
        textAlign: 'center',
        padding: '32px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-lg)',
        backdropFilter: 'var(--glass-blur)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          🔒 Sessions are time-bounded &nbsp;·&nbsp; 💳 Powered by Stripe &nbsp;·&nbsp; 🤖 Backed by MiniMax AI
        </p>
      </div>
    </div>
  );
};

export default Home;
