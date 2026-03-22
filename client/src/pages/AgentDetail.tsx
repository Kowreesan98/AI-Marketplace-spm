import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Agent } from '../types';

const AGENT_COLORS: Record<number, string> = {
  1: 'linear-gradient(135deg, #f97316, #ea580c)',
  2: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  3: 'linear-gradient(135deg, #10b981, #059669)',
  4: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  5: 'linear-gradient(135deg, #ec4899, #db2777)',
};

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        if (id) {
          const data = await api.getAgent(id);
          setAgent(data);
        }
      } catch (err) {
        setError('Failed to load agent');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [id]);

  const handleHire = () => {
    if (!user) {
      navigate('/login', { state: { from: `/hire/${id}` } });
    } else {
      navigate(`/hire/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading agent…</span>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="container">
        <div className="form-error">{error || 'Agent not found'}</div>
      </div>
    );
  }

  const colorGrad = AGENT_COLORS[(Number(agent.id) % 5) + 1] || AGENT_COLORS[1];

  const capabilities = [
    'Powered by MiniMax AI',
    'Real-time responses',
    'Context-aware conversations',
    'Session-based billing',
  ];

  return (
    <div className="container">
      <Link to="/" className="back-btn">← Back to Agents</Link>

      <div className="agent-detail">
        {/* Header */}
        <div className="agent-detail-header">
          <div
            className="agent-detail-icon"
            style={{ background: colorGrad, border: 'none' }}
          >
            {agent.icon}
          </div>
          <div className="agent-detail-info">
            <div className="section-label">{agent.category}</div>
            <h1>{agent.name}</h1>
            <div className="agent-detail-rate">
              ${agent.rate}
              <small>/ hour</small>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '16px',
            }}>
              {capabilities.map((cap) => (
                <span key={cap} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-full)',
                  padding: '4px 12px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500',
                }}>
                  {cap}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '32px' }} />

        {/* Description */}
        <div className="section-label">About this agent</div>
        <p className="agent-detail-description">
          {agent.long_description || agent.description}
        </p>

        {/* Pricing breakdown */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Rate', value: `$${agent.rate}/hr` },
            { label: '2 Hours', value: `$${agent.rate * 2}` },
            { label: '5 Hours', value: `$${agent.rate * 5}` },
            { label: '10 Hours', value: `$${agent.rate * 10}` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <button
          id="hire-agent-btn"
          className="btn btn-primary"
          onClick={handleHire}
          style={{ padding: '15px 48px', fontSize: '16px' }}
        >
          Hire this Agent →
        </button>
      </div>
    </div>
  );
};

export default AgentDetail;
