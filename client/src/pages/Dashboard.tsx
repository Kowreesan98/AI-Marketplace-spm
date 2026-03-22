import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Session, Payment } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sessions' | 'billing'>('sessions');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sessionsData, paymentsData] = await Promise.all([
          api.getSessions(),
          api.getPaymentHistory(),
        ]);
        setSessions(sessionsData);
        setPayments(paymentsData);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeSessions = sessions.filter((s) => !s.expired);
  const pastSessions = sessions.filter((s) => s.expired);
  const totalSpent = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleHireAgain = (agentId: string | number) => {
    navigate(`/hire/${agentId}`);
  };

  const renderPaymentBadge = (status: string) => {
    return (
      <span className={`payment-status-badge ${status}`}>
        {status === 'succeeded' ? 'Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div className="section-label">My Account</div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Manage your AI agent sessions and billing</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon">🤖</div>
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-label">Active Now</div>
          <div className="stat-value accent">{activeSessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">${totalSpent.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div className="stat-label">Payments</div>
          <div className="stat-value">{payments.filter((p) => p.status === 'succeeded').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <button
          id="tab-sessions"
          className={`dash-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          📊 Sessions
        </button>
        <button
          id="tab-billing"
          className={`dash-tab ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          💳 Billing
        </button>
      </div>

      {/* ── Sessions Tab ─────── */}
      {activeTab === 'sessions' && (
        <>
          {activeSessions.length > 0 && (
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Active Sessions</h3>
                <span className="badge-count">{activeSessions.length}</span>
              </div>
              <div className="session-list">
                {activeSessions.map((session) => (
                  <div key={session.id} className="session-item active-session">
                    <div className="session-info">
                      <div className="session-icon">{session.agent_icon}</div>
                      <div>
                        <div className="session-name">{session.agent_name}</div>
                        <div className="session-meta">
                          {session.duration_hours} hr &nbsp;·&nbsp; ${session.total_cost} &nbsp;·&nbsp;
                          Started {new Date(session.start_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="session-status">
                      <span className="status-badge active">Active</span>
                      <Link to={`/workspace/${session.id}`} className="btn btn-primary btn-sm">
                        Open →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Past Sessions</h3>
                <span className="badge-count muted">{pastSessions.length}</span>
              </div>
              <div className="session-list">
                {pastSessions.map((session) => (
                  <div key={session.id} className="session-item past-session">
                    <div className="session-info">
                      <div className="session-icon">{session.agent_icon}</div>
                      <div>
                        <div className="session-name">{session.agent_name}</div>
                        <div className="session-meta">
                          {session.duration_hours} hr &nbsp;·&nbsp; ${session.total_cost} &nbsp;·&nbsp;
                          {new Date(session.start_time).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="session-status">
                      <span className="status-badge expired">Expired</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => session.agent_id && handleHireAgain(session.agent_id)}
                      >
                        Hire again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sessions.length === 0 && (
            <div className="dashboard-section">
              <div className="empty-state">
                <div className="empty-state-icon">🤖</div>
                <p>You don't have any sessions yet.</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '8px' }}>
                  Browse Agents
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Billing Tab ─────── */}
      {activeTab === 'billing' && (
        <>
          {payments.length > 0 ? (
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Payment History</h3>
              </div>

              <div className="billing-table-wrap">
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {new Date(payment.created_at).toLocaleDateString()}
                          <br />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(payment.created_at).toLocaleTimeString()}
                          </span>
                        </td>
                        <td>
                          {payment.agent_icon && <span>{payment.agent_icon} </span>}
                          {payment.description || 'Session Payment'}
                        </td>
                        <td className="amount-cell">${payment.amount.toFixed(2)}</td>
                        <td>{renderPaymentBadge(payment.status)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {payment.stripe_payment_intent_id?.substring(0, 18)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Billing summary */}
              <div className="billing-summary-grid">
                <div className="billing-summary-item">
                  <label>Total Paid</label>
                  <div className="value success">
                    ${payments.filter((p) => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                  </div>
                </div>
                <div className="billing-summary-item">
                  <label>Pending</label>
                  <div className="value warning">
                    ${payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0).toFixed(2)}
                  </div>
                </div>
                <div className="billing-summary-item">
                  <label>Transactions</label>
                  <div className="value">{payments.length}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dashboard-section">
              <div className="empty-state">
                <div className="empty-state-icon">💳</div>
                <p>No payment history yet.</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: '8px' }}>
                  Browse Agents
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
