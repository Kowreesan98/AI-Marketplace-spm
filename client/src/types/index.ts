export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Agent {
  id: number | string;
  name: string;
  description: string;
  long_description?: string;
  icon: string;
  category: string;
  rate: number;
}

export interface Session {
  id: number | string;
  session_id?: number | string;
  agent_id: number | string;
  user_id: number | string;
  agent_icon?: string;
  agent_name?: string;
  agent_category?: string;
  duration_hours: number;
  start_time: string;
  end_time?: string;
  total_cost: number;
  expired?: boolean;
  remaining_ms?: number;
}

export interface ChatMessage {
  id?: number;
  session_id: number | string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatResponse {
  reply: string;
  remaining_ms: number;
  session_id: number | string;
}

export interface ChatHistoryResponse {
  session_id: number | string;
  messages: ChatMessage[];
  remaining_ms: number;
  expired: boolean;
}

export interface CreateSessionResponse {
  session_id: number | string;
  agent_name: string;
  duration_hours: number;
  total_cost: number;
  start_time: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Payment {
  id: number;
  user_id: number;
  session_id: number | null;
  stripe_payment_intent_id: string;
  stripe_customer_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description: string;
  created_at: string;
  agent_id?: number;
  agent_name?: string;
  agent_icon?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  demo: boolean;
}
