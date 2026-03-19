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
    { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState(2);
  const chatEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    apiGet('/get_chat_history')
      .then((data) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.history) && data.history.length) {
          const restored = [];
          let idCounter = 2;
          for (const item of data.history) {
            restored.push({ id: `msg-${idCounter}`, sender: 'user', text: item.message, ui_type: null, options: [] });
            idCounter++;
            restored.push({ id: `msg-${idCounter}`, sender: 'bot', text: item.response, ui_type: null, options: [] });
            idCounter++;
          }
          setNextId(idCounter);
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
    const userId = nextId;
    const botId = nextId + 1;
    setNextId((prev) => prev + 2);

    setMessages((prev) => [...prev, { id: `msg-${userId}`, sender: 'user', text: outgoing, ui_type: null, options: [] }]);
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
          id: `msg-${botId}`,
          sender: 'bot',
          text: data?.response ?? 'I am here to help. Could you describe your symptoms?',
          ui_type: data?.ui_type || null,
          options: data?.options || [],
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

  const handleOptionClick = async (value) => {
    const userId = nextId;
    const botId = nextId + 1;
    setNextId((prev) => prev + 2);

    // Add user selection as message
    const selectedOption = messages[messages.length - 1]?.options?.find(opt => opt.value === value);
    const userText = selectedOption?.label || value;
    
    setMessages((prev) => [...prev, { id: `msg-${userId}`, sender: 'user', text: userText, ui_type: null, options: [] }]);
    setLoading(true);
    setError('');

    try {
      const data = await apiPost('/send_message', { message: value });

      // Small delay so typing indicator is visible
      await new Promise((r) => setTimeout(r, 650));

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${botId}`,
          sender: 'bot',
          text: data?.response ?? 'I am here to help. Could you describe your symptoms?',
          ui_type: data?.ui_type || null,
          options: data?.options || [],
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

  const lastMessage = messages[messages.length - 1];
  const showInput = !lastMessage?.ui_type || lastMessage?.ui_type === 'text';

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-wrapper" style={{ maxWidth: '800px' }}>
        <Card title="AI Medical Consultation" className="mb-md">
          <div className="chat-container">
            <style>
              {`
                @keyframes chatbotDot { 
                  0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 
                  30% { transform: translateY(-4px); opacity: 1; } 
                }
                .selection-options {
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                  margin-top: 12px;
                }
                .selection-button {
                  padding: 10px 16px;
                  background: var(--primary-color);
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: all 0.2s ease;
                  text-align: left;
                }
                .selection-button:hover {
                  background: var(--primary-dark);
                  transform: translateX(4px);
                }
                .selection-button:active {
                  transform: translateX(2px);
                }
                .selection-button:disabled {
                  opacity: 0.5;
                  cursor: not-allowed;
                }
                .confirmation-box {
                  background: #f8f9fa;
                  border: 2px solid var(--primary-color);
                  border-radius: 8px;
                  padding: 16px;
                  margin-top: 12px;
                  font-size: 14px;
                  line-height: 1.6;
                }
                .confirmation-box strong {
                  color: var(--primary-color);
                }
                .confirmation-options {
                  display: flex;
                  gap: 8px;
                  margin-top: 12px;
                  flex-wrap: wrap;
                }
                .btn-confirm {
                  flex: 1;
                  min-width: 120px;
                  padding: 10px 16px;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-weight: 600;
                  transition: all 0.2s ease;
                }
                .btn-confirm-yes {
                  background: #28a745;
                  color: white;
                }
                .btn-confirm-yes:hover {
                  background: #218838;
                }
                .btn-confirm-no {
                  background: #dc3545;
                  color: white;
                }
                .btn-confirm-no:hover {
                  background: #c82333;
                }
              `}
            </style>
            <div className="chat-history">
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <div className={`chat-message ${msg.sender === 'bot' ? 'chat-bot' : 'chat-user'}`} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    {msg.sender === 'bot' && <div style={{ background: 'white', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)', flexShrink: 0 }}><FaRobot size={16} /></div>}
                    <div style={{ flex: 1 }}>
                      <div style={{ wordBreak: 'break-word', paddingTop: '4px', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      
                      {msg.ui_type === 'doctor_selection' && msg.options.length > 0 && (
                        <div className="selection-options">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.value}
                              className="selection-button"
                              onClick={() => handleOptionClick(opt.value)}
                              disabled={loading}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.ui_type === 'date_selection' && msg.options.length > 0 && (
                        <div className="selection-options">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.value}
                              className="selection-button"
                              onClick={() => handleOptionClick(opt.value)}
                              disabled={loading}
                            >
                              📅 {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.ui_type === 'time_selection' && msg.options.length > 0 && (
                        <div className="selection-options">
                          {msg.options.map((opt) => (
                            <button
                              key={opt.value}
                              className="selection-button"
                              onClick={() => handleOptionClick(opt.value)}
                              disabled={loading}
                            >
                              🕐 {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.ui_type === 'confirmation' && msg.options.length > 0 && (
                        <>
                          <div className="confirmation-box">
                            {msg.text.split('\n').map((line, i) => {
                              if (line.startsWith('**') && line.endsWith('**')) {
                                return <strong key={i}>{line.replace(/\*\*/g, '')}<br /></strong>;
                              }
                              if (line.startsWith('###')) {
                                return <div key={i} style={{ fontWeight: 'bold', marginBottom: '8px' }}>{line.replace(/^###\s*/, '')}</div>;
                              }
                              return line.trim() ? <div key={i}>{line}</div> : null;
                            })}
                          </div>
                          <div className="confirmation-options">
                            {msg.options.map((opt) => (
                              <button
                                key={opt.value}
                                className={`btn-confirm ${opt.value === 'yes' ? 'btn-confirm-yes' : 'btn-confirm-no'}`}
                                onClick={() => handleOptionClick(opt.value)}
                                disabled={loading}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {msg.sender === 'user' && <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', color: 'white', flexShrink: 0 }}><FaUser size={16} /></div>}
                  </div>
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
            {showInput && (
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
            )}
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
