import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/Widget/Card';
import { apiGet, apiPost } from '../api/client';

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', opacity: 0.8, animation: 'chatbotDot 1.2s infinite ease-in-out' }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', opacity: 0.6, animation: 'chatbotDot 1.2s 0.2s infinite ease-in-out' }} />
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', opacity: 0.4, animation: 'chatbotDot 1.2s 0.4s infinite ease-in-out' }} />
    </span>
  );
}

function ChatbotPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    apiGet('/get_chat_history')
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.history) && data.history.length) {
          const restored = [];
          for (const item of data.history) {
            restored.push({ id: `${item.timestamp}-u`, sender: 'user', text: item.message });
            restored.push({ id: `${item.timestamp}-b`, sender: 'bot', text: item.response });
          }
          setMessages((prev) => (prev.length > 1 ? prev : [prev[0], ...restored]));
        }
      })
      .catch(() => { });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const outgoing = input;
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: outgoing }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/send_message', { message: outgoing });

      // Small delay so typing indicator is visible and feels natural.
      await new Promise((r) => setTimeout(r, 650));

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: data?.response ?? 'I am here to help. Could you describe your symptoms?',
          meta: {
            emergency_level: data?.emergency_level,
            severity: data?.severity,
            booking_active: data?.booking_active,
          },
        },
      ]);
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-wrapper" style={{ maxWidth: '800px' }}>
        <Card title="AI Medical Consultation" className="mb-md">
          <div className="chat-container">
            <style>
              {`@keyframes chatbotDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 30% { transform: translateY(-4px); opacity: 1; } }`}
            </style>
            <div className="chat-history">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender === 'bot' ? 'chat-bot' : 'chat-user'}`} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  {msg.sender === 'bot' && <div style={{ background: 'white', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)', flexShrink: 0 }}><FaRobot size={16} /></div>}
                  <div style={{ wordBreak: 'break-word', paddingTop: '4px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  {msg.sender === 'user' && <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', color: 'white', flexShrink: 0 }}><FaUser size={16} /></div>}
                </div>
              ))}
              {loading ? (
                <div className="chat-message chat-bot" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'white', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)', flexShrink: 0 }}><FaRobot size={16} /></div>
                  <div style={{ wordBreak: 'break-word', paddingTop: '4px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Thinking</span> <TypingDots />
                  </div>
                </div>
              ) : null}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text"
                className="form-control"
                placeholder="Talk to your health assistant..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim() || loading}>
                <FaPaperPlane /> Send
              </button>
            </form>
            {error ? (
              <div className="text-muted" style={{ color: 'crimson', marginTop: '8px' }}>
                {error}
              </div>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}

export default ChatbotPage;
