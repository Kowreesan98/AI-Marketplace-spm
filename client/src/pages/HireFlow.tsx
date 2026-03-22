import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';
import { Agent, CreateSessionResponse } from '../types';

const STRIPE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
const stripePromise = loadStripe(STRIPE_KEY);

const CheckoutForm = ({
  totalCost,
  totalHours,
  agentId,
  paymentIntentId,
  onSuccess,
  onError,
  onBack
}: {
  totalCost: number;
  totalHours: number;
  agentId: string;
  paymentIntentId: string;
  onSuccess: (session: CreateSessionResponse) => void;
  onError: (msg: string) => void;
  onBack: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    onError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const result = await api.createSession(Number(agentId), totalHours);
        await api.confirmPayment(paymentIntentId, result.session_id);
        onSuccess(result);
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err: any) {
      onError(err.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ padding: '12px 0', minHeight: '200px' }}>
        <PaymentElement />
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onBack}
          disabled={processing}
          style={{ flex: '1' }}
        >
          ← Back
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || processing}
          style={{ flex: '2', padding: '14px' }}
        >
          {processing ? 'Processing...' : `Pay $${totalCost}`}
        </button>
      </div>
    </form>
  );
};

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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
      ) as any;
      setPaymentIntentId(paymentData.paymentIntentId);
      setClientSecret(paymentData.clientSecret);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
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
              <h4>💳 Card Details</h4>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                  <CheckoutForm 
                    totalCost={getTotalCost()}
                    totalHours={getTotalHours()}
                    agentId={agentId!}
                    paymentIntentId={paymentIntentId!}
                    onSuccess={(result) => {
                      setSession(result);
                      setStep(3);
                    }}
                    onError={(msg) => setCardError(msg)}
                    onBack={() => setStep(1)}
                  />
                </Elements>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                </div>
              )}
            </div>

            {cardError && <div className="form-error" style={{ marginBottom: '16px' }}>{cardError}</div>}

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
