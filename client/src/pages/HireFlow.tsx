import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';
import { Agent, CreateSessionResponse } from '../types';

const stripePromise = loadStripe('pk_test_placeholder');

const HOUR_OPTIONS = [1, 2, 3, 5, 10];

const HireFlow: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [hours, setHours] = useState(1);
  const [customHours, setCustomHours] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<CreateSessionResponse | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        if (agentId) {
          const data = await api.getAgent(agentId);
          setAgent(data);
        }
      } catch (err: any) {
        setError('Failed to load agent');
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [agentId]);

  const getTotalHours = () => {
    if (customHours) return parseInt(customHours) || 0;
    return hours;
  };

  const getTotalCost = () => {
    if (!agent) return 0;
    return agent.rate * getTotalHours();
  };

  const handleSelectHours = (h: number) => {
    setHours(h);
    setCustomHours('');
  };

  const handleCustomHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomHours(e.target.value);
  };

  const handleProceedToPayment = async () => {
    setProcessing(true);
    setError('');

    try {
      const totalHours = getTotalHours();
      if (totalHours < 1) {
        setError('Please select at least 1 hour');
        setProcessing(false);
        return;
      }
      if (!agent) {
        setError('Agent not found');
        setProcessing(false);
        return;
      }
      const paymentData = await api.createPaymentIntent(
        getTotalCost(),
        Number(agentId),
        agent.name,
        totalHours
      );
      setPaymentIntentId(paymentData.paymentIntentId);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setCardError('');

    try {
      if (!paymentIntentId || !agentId) throw new Error('Payment not initialized');
      const totalHours = getTotalHours();
      const result = await api.createSession(Number(agentId), totalHours);
      await api.confirmPayment(paymentIntentId, result.session_id);
      setSession(result);
      setStep(3);
    } catch (err: any) {
      setCardError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleGoToWorkspace = () => {
    if (session) navigate(`/workspace/${session.session_id}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading…</span>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container">
        <div className="form-error">Agent not found</div>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Select Hours' },
    { num: 2, label: 'Payment' },
    { num: 3, label: 'Complete' },
  ];

  return (
    <div className="hire-flow-page">
      <Link to={`/agent/${agentId}`} className="back-btn">← Back to Agent</Link>

      <div className="hire-flow">
        {/* Title */}
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '26px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          Hire {agent.name}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          {agent.icon} {agent.category}
        </p>

        {/* Progress stepper */}
        <div className="progress-stepper">
          {steps.map((s, i) => (
            <div key={s.num} className="progress-step-wrap">
              <div className={`progress-step ${step >= s.num ? (step > s.num ? 'done' : 'active') : ''}`}>
                <div className="progress-step-circle">
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="progress-step-label">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`progress-connector ${step > s.num ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Select Hours ─────────── */}
        {step === 1 && (
          <div>
            <div className="section-label" style={{ marginBottom: '16px' }}>Duration</div>

            <div className="hours-grid">
              {HOUR_OPTIONS.map((h) => (
                <div
                  key={h}
                  id={`hour-option-${h}`}
                  className={`hour-option ${hours === h && !customHours ? 'selected' : ''}`}
                  onClick={() => handleSelectHours(h)}
                >
                  <div className="hours">{h}h</div>
                  <div className="price">${agent.rate * h}</div>
                </div>
              ))}
            </div>

            <div className="custom-hours-wrap">
              <label>Custom hours:</label>
              <input
                id="custom-hours-input"
                type="number"
                min="1"
                value={customHours}
                onChange={handleCustomHoursChange}
                placeholder="e.g. 8"
              />
              {customHours && (
                <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '600' }}>
                  = ${agent.rate * (parseInt(customHours) || 0)}
                </span>
              )}
            </div>

            {/* Cost summary */}
            <div className="cost-summary">
              <div className="cost-summary-header">Order Summary</div>
              <div className="cost-row">
                <span>Agent</span>
                <span>{agent.icon} {agent.name}</span>
              </div>
              <div className="cost-row">
                <span>Rate</span>
                <span>${agent.rate}/hour</span>
              </div>
              <div className="cost-row">
                <span>Duration</span>
                <span>{getTotalHours()} hour{getTotalHours() !== 1 ? 's' : ''}</span>
              </div>
              <div className="cost-row total">
                <span>Total</span>
                <span>${getTotalCost()}</span>
              </div>
            </div>

            {error && <div className="form-error" style={{ marginTop: '16px' }}>{error}</div>}

            <button
              id="proceed-to-payment-btn"
              className="btn btn-primary"
              onClick={handleProceedToPayment}
              disabled={processing || getTotalHours() < 1}
              style={{ width: '100%', marginTop: '24px', padding: '14px' }}
            >
              {processing ? 'Processing…' : 'Proceed to Payment →'}
            </button>
          </div>
        )}

        {/* ── STEP 2: Payment ─────────────── */}
        {step === 2 && (
          <div>
            {/* Mini summary */}
            <div className="cost-summary" style={{ marginBottom: '20px' }}>
              <div className="cost-summary-header">Billing Summary</div>
              <div className="cost-row">
                <span>Agent</span>
                <span>{agent.icon} {agent.name}</span>
              </div>
              <div className="cost-row">
                <span>Duration</span>
                <span>{getTotalHours()} hour{getTotalHours() !== 1 ? 's' : ''}</span>
              </div>
              <div className="cost-row total">
                <span>Total</span>
                <span>${getTotalCost()}</span>
              </div>
            </div>

            {/* Card form */}
            <div className="payment-card-form">
              <h4>💳 Card Details <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>(Test Mode)</span></h4>

              <div className="stripe-test-banner">
                <strong>Stripe Test Mode</strong><br />
                Use card: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px' }}>4242 4242 4242 4242</code><br />
                Any future date · Any CVC · Any postal code
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label>Card Number</label>
                <input
                  id="card-number"
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="form-input"
                  onChange={(e) => setCardComplete(e.target.value.replace(/\s/g, '').length >= 16)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Expiry</label>
                  <input id="card-expiry" type="text" placeholder="MM/YY" className="form-input" />
                </div>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>CVC</label>
                  <input id="card-cvc" type="text" placeholder="123" className="form-input" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>Postal Code</label>
                <input id="card-postal" type="text" placeholder="12345" className="form-input" />
              </div>
            </div>

            {cardError && <div className="form-error" style={{ marginBottom: '16px' }}>{cardError}</div>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={processing}
                style={{ flex: '1' }}
              >
                ← Back
              </button>
              <button
                id="pay-btn"
                className="btn btn-primary"
                onClick={handlePayment}
                disabled={processing || !cardComplete}
                style={{ flex: '2', padding: '14px' }}
              >
                {processing ? 'Processing…' : `Pay $${getTotalCost()}`}
              </button>
            </div>

            <div className="secure-note">
              🔒 Your payment is secured by Stripe
            </div>
          </div>
        )}

        {/* ── STEP 3: Success ─────────────── */}
        {step === 3 && (
          <div className="success-screen">
            <div className="success-icon-wrap">✅</div>
            <h3 className="success-title">Payment Successful!</h3>
            <p className="success-message">
              Your session with <strong>{agent.name}</strong> is ready.<br />
              You have <strong>{getTotalHours()} hour{getTotalHours() !== 1 ? 's' : ''}</strong> of access.
            </p>

            <div className="success-details">
              <div className="success-detail-row">
                <span>Agent</span>
                <span>{agent.icon} {agent.name}</span>
              </div>
              <div className="success-detail-row">
                <span>Duration</span>
                <span>{getTotalHours()} hour{getTotalHours() !== 1 ? 's' : ''}</span>
              </div>
              <div className="success-detail-row">
                <span>Amount charged</span>
                <span style={{ color: 'var(--success)', fontWeight: '700' }}>${getTotalCost()}</span>
              </div>
              <div className="success-detail-row">
                <span>Status</span>
                <span style={{ color: 'var(--success)' }}>✓ Completed</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                id="open-workspace-btn"
                className="btn btn-primary"
                onClick={handleGoToWorkspace}
                style={{ padding: '13px 32px' }}
              >
                Open Workspace →
              </button>
              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '13px 24px' }}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HireFlow;
