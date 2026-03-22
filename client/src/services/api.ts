import { Agent, Session, ChatMessage, AuthResponse, ChatResponse, ChatHistoryResponse, CreateSessionResponse, Payment, PaymentIntentResponse } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || '';

const getHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // Agents
  getAgents: async (): Promise<Agent[]> => {
    const response = await fetch(`${API_BASE}/agents`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch agents');
    return data;
  },

  getAgent: async (id: string | number): Promise<Agent> => {
    const response = await fetch(`${API_BASE}/agents/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch agent');
    return data;
  },

  // Sessions
  createSession: async (agentId: number, durationHours: number): Promise<CreateSessionResponse> => {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ agent_id: agentId, duration_hours: durationHours }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create session');
    return data;
  },

  getSessions: async (): Promise<Session[]> => {
    const response = await fetch(`${API_BASE}/sessions`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch sessions');
    return data;
  },

  getSession: async (id: string | number): Promise<Session> => {
    const response = await fetch(`${API_BASE}/sessions/${id}`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch session');
    return data;
  },

  // Chat
  sendMessage: async (sessionId: string | number, message: string): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },

  getChatHistory: async (sessionId: string | number): Promise<ChatHistoryResponse> => {
    const response = await fetch(`${API_BASE}/chat/${sessionId}`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch chat history');
    return data;
  },

  // Payments
  createPaymentIntent: async (amount: number, agentId: number, agentName: string, durationHours: number): Promise<PaymentIntentResponse> => {
    const response = await fetch(`${API_BASE}/payments/create-payment-intent`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount, agentId, agentName, durationHours }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create payment intent');
    return data;
  },

  confirmPayment: async (paymentIntentId: string, sessionId: number | string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE}/payments/confirm`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ paymentIntentId, sessionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to confirm payment');
    return data;
  },

  getPaymentHistory: async (): Promise<Payment[]> => {
    const response = await fetch(`${API_BASE}/payments/history`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch payment history');
    return data;
  },

  getPaymentStatus: async (paymentIntentId: string): Promise<{ status: string; amount: number }> => {
    const response = await fetch(`${API_BASE}/payments/status/${paymentIntentId}`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get payment status');
    return data;
  },
};

export default api;
