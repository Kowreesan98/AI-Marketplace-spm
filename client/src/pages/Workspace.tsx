import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Session, ChatMessage } from '../types';

const Workspace: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        if (!sessionId) return;
        const sessionData = await api.getSession(sessionId);
        setSession(sessionData);
        setRemainingMs(sessionData.remaining_ms || 0);
        setExpired(sessionData.expired || false);

        if (!sessionData.expired) {
          const chatData = await api.getChatHistory(sessionId);
          setMessages(chatData.messages || []);
        }
      } catch (err) {
        setError('Failed to load session');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (expired || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const sessionData = await api.getSession(sessionId);
        const remaining = sessionData.remaining_ms || 0;
        setRemainingMs(remaining);
        if (remaining <= 0) {
          setExpired(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Timer sync error:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, expired]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || sending || expired || !sessionId) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setError('');

    setMessages((prev) => [...prev, { role: 'user', content: userMessage, session_id: sessionId }]);

    try {
      const response = await api.sendMessage(sessionId, userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply, session_id: sessionId }]);

      const remMs = response.remaining_ms || 0;
      setRemainingMs(remMs);
      if (remMs <= 0) setExpired(true);
    } catch (err: unknown) {
      setMessages((prev) => prev.slice(0, -1));
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      if (errorMessage === 'Session expired') {
        setError('Session has expired');
        setExpired(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
      handleSend(fakeEvent);
    }
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (remainingMs <= 0) return 'timer-value danger';
    if (remainingMs < 300000) return 'timer-value danger';
    if (remainingMs < 900000) return 'timer-value warning';
    return 'timer-value';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span className="loading-text">Loading workspace…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container">
        <div className="form-error">Session not found</div>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="workspace">
      {/* Sidebar */}
      <div className="workspace-sidebar">
        <div className="workspace-sidebar-header">
          ⚡ Session
        </div>

        {/* Timer */}
        <div className="session-timer">
          <div className="timer-label">Time Remaining</div>
          {expired ? (
            <div className="timer-expired">⏰ Session Expired</div>
          ) : (
            <div className={getTimerClass()}>
              {formatTime(remainingMs)}
            </div>
          )}
        </div>

        {/* Agent info */}
        <div className="sidebar-info-block">
          <div className="sidebar-info-label">Agent</div>
          <div className="sidebar-info-value">
            <span>{session.agent_icon}</span>
            <span>{session.agent_name}</span>
          </div>
        </div>

        <div className="sidebar-info-block">
          <div className="sidebar-info-label">Duration</div>
          <div className="sidebar-info-value">
            {session.duration_hours} hour{session.duration_hours > 1 ? 's' : ''}
          </div>
        </div>

        <div className="sidebar-info-block">
          <div className="sidebar-info-label">Messages</div>
          <div className="sidebar-info-value">{messages.length}</div>
        </div>

        <Link
          to="/dashboard"
          className="btn btn-secondary"
          style={{ width: '100%', textAlign: 'center', marginTop: 'auto' }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Main chat area */}
      <div className="workspace-main">
        {/* Header */}
        <div className="workspace-header">
          <div className="workspace-agent-icon">{session.agent_icon}</div>
          <div>
            <h2>{session.agent_name}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              AI Assistant &nbsp;·&nbsp; Powered by MiniMax
            </span>
          </div>
          {expired && (
            <span className="status-badge expired" style={{ marginLeft: 'auto' }}>
              Session Expired
            </span>
          )}
        </div>

        {/* Chat */}
        <div className="chat-container">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <div className="empty-state-icon">{session.agent_icon}</div>
                <p>Start a conversation with {session.agent_name}</p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Type a message below to begin
                </span>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  {msg.content}
                </div>
              ))
            )}

            {sending && (
              <div className="message assistant thinking">
                <div className="thinking-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="chat-error-banner">
              ⚠️ {error}
            </div>
          )}

          <form className="chat-input-container" onSubmit={handleSend}>
            <input
              id="chat-input"
              type="text"
              className="chat-input"
              placeholder={expired ? 'Session expired — hire again to continue' : `Message ${session.agent_name}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={expired || sending}
            />
            <button
              id="chat-send-btn"
              type="submit"
              className="chat-send"
              disabled={!input.trim() || sending || expired}
              title="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
