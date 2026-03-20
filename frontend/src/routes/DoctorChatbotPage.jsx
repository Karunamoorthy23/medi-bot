import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaPaperPlane, FaRobot, FaUser, FaTrash, FaPlus, FaBars, FaTimes,
    FaChevronLeft, FaChevronRight, FaExclamationCircle, FaExclamationTriangle,
    FaInfoCircle, FaCheckCircle, FaMars, FaVenus, FaTransgender,
    FaUserMd, FaCalendarAlt, FaClock
} from 'react-icons/fa';
import Navbar from '../components/Layout/Navbar';
import Card from '../components/Widget/Card';
import { renderFormattedLines } from '../utils/textParser.jsx';
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

function DoctorChatbotPage() {
    const [chats, setChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello Doctor! I am your AI medical assistant. You can ask me for a second opinion on medical cases, or query your patient and appointment lists. Try asking "List high priority patients" or "Find recent appointments in Chennai".', ui_type: null, options: [] }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [nextId, setNextId] = useState(2);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [authError, setAuthError] = useState('');
    const chatEndRef = useRef(null);

    // Load all doctor chats
    const loadAllChats = async () => {
        try {
            const data = await apiGet('/api/doctor/get_all_chats');
            if (data?.success && Array.isArray(data.chats)) {
                setChats(data.chats);
                if (data.chats.length > 0 && !currentChatId) {
                    setCurrentChatId(data.chats[0].id);
                    loadChatMessages(data.chats[0].id);
                }
            }
        } catch (err) {
            console.error('Error loading chats:', err);
            if (err.message.includes('Not authenticated')) {
                setIsAuthenticated(false);
                setAuthError('Please log in as a doctor to access the AI assistant');
            }
        }
    };

    useEffect(() => {
        loadAllChats();
    }, []);

    const loadChatMessages = async (chatId) => {
        try {
            const data = await apiGet(`/api/doctor/get_chat_messages/${chatId}`);
            if (data?.success && Array.isArray(data.messages)) {
                const restored = [
                    { id: 1, sender: 'bot', text: 'Hello Doctor! I am your AI medical assistant. How can I assist you today?', ui_type: null, options: [] }
                ];
                let idCounter = 2;
                for (const item of data.messages) {
                    restored.push({ id: `msg-${idCounter}`, sender: 'user', text: item.message, ui_type: null, options: [] });
                    idCounter++;
                    restored.push({ id: `msg-${idCounter}`, sender: 'bot', text: item.response, ui_type: null, options: [] });
                    idCounter++;
                }
                setNextId(idCounter);
                setMessages(restored);
            }
        } catch (err) {
            console.error('Failed to load chat messages:', err);
        }
    };

    const createNewChat = () => {
        setCurrentChatId(null);
        setMessages([
            { id: 1, sender: 'bot', text: 'New Consultation Session. How can I help you, Doctor?', ui_type: null, options: [] }
        ]);
        setNextId(2);
        setInput('');
        setError('');
    };

    const deleteChat = async (chatId, e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            const response = await apiPost(`/api/doctor/delete_chat/${chatId}`, {});
            if (response?.success) {
                setChats(chats.filter(c => c.id !== chatId));
                if (currentChatId === chatId) {
                    createNewChat();
                }
            }
        } catch (err) {
            console.error('Failed to delete chat:', err);
        }
    };

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
            const data = await apiPost('/api/doctor/send_message', { message: outgoing, chat_id: currentChatId });
            const activeChatId = data?.chat_id || currentChatId;
            if (!currentChatId && activeChatId) {
                setCurrentChatId(activeChatId);
            }

            // Add to chats list if new
            if (!chats.find(c => c.id === activeChatId)) {
                const newChat = {
                    id: activeChatId,
                    title: data?.chat_title || outgoing.substring(0, 40),
                    created_at: new Date().toISOString()
                };
                setChats([newChat, ...chats]);
            }

            setMessages((prev) => [
                ...prev,
                {
                    id: `msg-${botId}`,
                    sender: 'bot',
                    text: data?.response ?? 'I processed your query.',
                    ui_type: data?.ui_type || null,
                    options: data?.options || []
                },
            ]);
        } catch (err) {
            setError(err?.message || 'Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
            <Navbar />

            {!isAuthenticated ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                    <Card style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
                        <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>Doctor Access Required</h2>
                        <p style={{ color: '#666', marginBottom: '24px' }}>{authError}</p>
                        <Link to="/doctor-login" style={{ display: 'inline-block' }}>
                            <button style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                Go to Doctor Login
                            </button>
                        </Link>
                    </Card>
                </div>
            ) : (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <div
                        style={{
                            width: sidebarOpen ? '280px' : '0',
                            backgroundColor: '#1a1a2e',
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRight: '1px solid #444',
                            transition: 'width 0.3s ease',
                            overflow: 'hidden',
                            zIndex: 1000,
                            position: 'relative',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #444' }}>
                            <h3 style={{ margin: 0, fontSize: '14px', color: '#999', textTransform: 'uppercase' }}>Consultations</h3>
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: '8px' }}>
                                {sidebarOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
                            </button>
                        </div>

                        <button
                            onClick={createNewChat}
                            style={{ margin: '12px', padding: '10px', backgroundColor: '#2d2d4a', color: 'white', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
                        >
                            <FaPlus size={14} /> <span>New Consultation</span>
                        </button>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                            {chats.map((chat) => (
                                <div key={chat.id} style={{ marginBottom: '6px', borderRadius: '6px', backgroundColor: currentChatId === chat.id ? '#2d2d4a' : 'transparent', display: 'flex', alignItems: 'center' }}>
                                    <button
                                        onClick={() => { setCurrentChatId(chat.id); loadChatMessages(chat.id); }}
                                        style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', color: currentChatId === chat.id ? 'white' : '#ccc', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {chat.title}
                                    </button>
                                    {currentChatId === chat.id && (
                                        <button onClick={(e) => deleteChat(chat.id, e)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: '6px 12px' }} title="Delete chat">
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {!sidebarOpen && (
                            <button onClick={() => setSidebarOpen(true)} style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 999, background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                                <FaBars size={18} />
                            </button>
                        )}

                        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Card title="Doctor AI Assistant" className="mb-md" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '16px' }}>
                                <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <style>{`
                    @keyframes chatbotDot { 
                      0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 
                      30% { transform: translateY(-4px); opacity: 1; } 
                    }
                    .chat-history::-webkit-scrollbar { width: 6px; }
                    .chat-history::-webkit-scrollbar-thumb { background: #cbd5e1; borderRadius: 3px; }
                  `}</style>

                                    <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f8fafc' }}>
                                        {messages.map((msg) => (
                                            <div key={msg.id} style={{ display: 'flex', marginBottom: '20px', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '12px' }}>
                                                {msg.sender === 'bot' && (
                                                    <div style={{ background: '#e2e8f0', padding: '8px', borderRadius: '50%', color: '#1e293b', marginTop: '4px' }}>
                                                        <FaRobot size={18} />
                                                    </div>
                                                )}
                                                <div style={{
                                                    maxWidth: '75%',
                                                    backgroundColor: msg.sender === 'user' ? '#1e40af' : '#ffffff',
                                                    color: msg.sender === 'user' ? '#ffffff' : '#334155',
                                                    padding: '12px 18px',
                                                    borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                                    lineHeight: '1.6',
                                                    fontSize: '14px'
                                                }}>
                                                    {renderFormattedLines(msg.text)}
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div style={{ display: 'flex', padding: '12px' }}><TypingDots /></div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <form
                                        onSubmit={handleSend}
                                        style={{ padding: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: 'white' }}
                                    >
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ask for medical consultation or query patients (e.g., 'List high priority patients')..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}
                                            disabled={loading}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={!input.trim() || loading}
                                            style={{ backgroundColor: '#1e40af', border: 'none', borderRadius: '10px', padding: '0 20px' }}
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </form>
                                    {error && (
                                        <div style={{ color: '#ef4444', padding: '0 20px 10px', fontSize: '12px' }}>{error}</div>
                                    )}
                                </div>
                            </Card>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorChatbotPage;
