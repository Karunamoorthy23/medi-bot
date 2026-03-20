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
import AppointmentModal from '../components/AppointmentModal';
import { renderFormattedLines, renderParsedText } from '../utils/textParser.jsx';
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
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextId, setNextId] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const chatEndRef = useRef(null);

  // Load all chats on component mount and when page becomes visible
  const loadAllChats = async () => {
    try {
      const data = await apiGet('/get_all_chats');
      if (data?.success && Array.isArray(data.chats)) {
        setChats(data.chats);
        if (data.chats.length > 0) {
          // Auto-select first chat if none selected
          if (!currentChatId) {
            setCurrentChatId(data.chats[0].id);
            loadChatMessages(data.chats[0].id);
          } else {
            // Reload current chat messages if a chat is already selected
            loadChatMessages(currentChatId);
          }
        }
        // If no chats, don't create one automatically - wait for user to send a message
      } else {
        console.warn('Unexpected response format:', data);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      if (err.message.includes('Not authenticated')) {
        setIsAuthenticated(false);
        setAuthError('Please log in to access the chatbot');
      }
    }
  };

  useEffect(() => {
    loadAllChats();
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again - reload chats
        setIsPageVisible(true);
        loadAllChats();
      } else {
        setIsPageVisible(false);
      }
    };

    const handleFocus = () => {
      // Window gained focus - reload chats
      loadAllChats();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentChatId, chats]);

  // Load messages for a specific chat
  const loadChatMessages = async (chatId) => {
    try {
      const data = await apiGet(`/get_chat_messages/${chatId}`);
      if (data?.success && Array.isArray(data.messages)) {
        const restored = [
          { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
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
      } else if (data?.success) {
        // Chat exists but is empty - show fresh start
        setMessages([
          { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
        ]);
        setNextId(2);
      }
    } catch (err) {
      // If chat is not found (404), remove it from the chat list
      if (err.message.includes('Chat not found')) {
        console.warn('Chat not found, removing from list:', chatId);
        const updatedChats = chats.filter(c => c.id !== chatId);
        setChats(updatedChats);
        setError('Chat not found or was deleted');

        // Switch to another chat or show empty state
        if (updatedChats.length > 0) {
          setCurrentChatId(updatedChats[0].id);
          await loadChatMessages(updatedChats[0].id);
        } else {
          setCurrentChatId(null);
          setMessages([
            { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
          ]);
          setNextId(2);
        }
      } else {
        console.error('Failed to load chat messages:', err);
        setError(`Failed to load chat: ${err.message}`);
      }
    }
  };

  // Create a new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([
      { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
    ]);
    setNextId(2);
    setInput('');
    setError('');

    // Don't add to chats list yet - wait for first message to be sent
    // This prevents "New Conversation" duplicates
  };

  // Delete a chat
  const deleteChat = async (chatId, e) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await apiPost(`/delete_chat/${chatId}`, {});

      if (response?.success) {
        // Remove from local state
        const updatedChats = chats.filter(c => c.id !== chatId);
        setChats(updatedChats);

        // If deleted chat was currently open, switch to another or create new
        if (currentChatId === chatId) {
          if (updatedChats.length > 0) {
            const nextChat = updatedChats[0];
            setCurrentChatId(nextChat.id);
            await loadChatMessages(nextChat.id);
          } else {
            // If no chats left, just reset state - don't auto-create
            setCurrentChatId(null);
            setMessages([
              { id: 1, sender: 'bot', text: 'Hello! I am your virtual hospital assistant. How can I help you today? Please describe your symptoms or ask any health-related questions.', ui_type: null, options: [] }
            ]);
            setNextId(2);
          }
        }
      } else {
        setError('Failed to delete chat. Please try again.');
        console.error('Delete chat failed:', response?.error);
      }
    } catch (err) {
      setError('Error deleting chat: ' + (err?.message || 'Unknown error'));
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
      const data = await apiPost('/send_message', { message: outgoing, chat_id: currentChatId });

      const activeChatId = data?.chat_id || currentChatId;
      if (!currentChatId && activeChatId) {
        setCurrentChatId(activeChatId);
      }

      // Check if this is a new chat (not yet in the list) and add it
      if (!chats.find(c => c.id === activeChatId)) {
        // Use title from backend response (saved from first message)
        const chatTitle = data?.chat_title || outgoing.substring(0, 40) + (outgoing.length > 40 ? '...' : '');
        const newChat = {
          id: activeChatId,
          title: chatTitle || 'New Conversation',
          created_at: new Date().toISOString()
        };
        setChats([newChat, ...chats]);
      } else {
        // If this is an existing chat and we have a new title from backend, update it
        if (data?.chat_title && messages.length <= 2) {
          setChats(chats.map(c => c.id === activeChatId ? { ...c, title: data.chat_title } : c));
        }
      }

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

      // If appointment is confirmed, show modal
      if (data?.complete && data?.session_context) {
        const context = data.session_context;
        const appointmentData = {
          patient_name: context.patient_name,
          age: context.age,
          gender: context.gender,
          contact_number: context.contact_number,
          doctor_name: context.doctor_name,
          appointment_date: new Date(context.appointment_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          start_time: context.start_time,
          symptoms: context.symptoms,
        };
        setAppointmentDetails(appointmentData);
        setShowAppointmentModal(true);
      }
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
      const data = await apiPost('/send_message', { message: value, chat_id: currentChatId });

      const activeChatId = data?.chat_id || currentChatId;
      if (!currentChatId && activeChatId) {
        setCurrentChatId(activeChatId);
      }

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

      // If appointment is confirmed, show modal
      if (data?.complete && data?.session_context) {
        const context = data.session_context;
        const appointmentData = {
          patient_name: context.patient_name,
          age: context.age,
          gender: context.gender,
          contact_number: context.contact_number,
          doctor_name: context.doctor_name,
          appointment_date: new Date(context.appointment_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          start_time: context.start_time,
          symptoms: context.symptoms,
        };
        setAppointmentDetails(appointmentData);
        setShowAppointmentModal(true);
      }
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const showInput = !lastMessage?.ui_type || lastMessage?.ui_type === 'text';

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Navbar />

      {/* Authentication Error */}
      {!isAuthenticated && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
          <Card style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
            <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>Authentication Required</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>{authError}</p>
            <Link to="/login" style={{ display: 'inline-block', marginRight: '12px' }}>
              <button style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Go to Login
              </button>
            </Link>
            <Link to="/register" style={{ display: 'inline-block' }}>
              <button style={{ padding: '10px 24px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Register
              </button>
            </Link>
          </Card>
        </div>
      )}

      {isAuthenticated && (
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
            {/* Sidebar Header with Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 12px',
                borderBottom: '1px solid #444',
                minHeight: '50px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#999', opacity: sidebarOpen ? 1 : 0 }}>
                Chats
              </h3>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                  borderRadius: '6px',
                }}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#999';
                }}
              >
                {sidebarOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={createNewChat}
              style={{
                margin: '12px',
                padding: '10px 16px',
                backgroundColor: '#2d2d4a',
                color: 'white',
                border: '1px solid #444',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease',
                opacity: sidebarOpen ? 1 : 0,
                pointerEvents: sidebarOpen ? 'auto' : 'none',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#3a3a5a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2d2d4a'}
              title="Create new chat"
            >
              <FaPlus size={14} />
              {sidebarOpen && <span>New Chat</span>}
            </button>

            {/* Chat List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
              {sidebarOpen && (
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', padding: '8px 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Chat History
                </div>
              )}
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  style={{
                    marginBottom: '6px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: currentChatId === chat.id ? '#2d2d4a' : 'transparent',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <button
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      loadChatMessages(chat.id);
                      // Only close sidebar on mobile (width < 768px)
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      color: currentChatId === chat.id ? 'white' : '#ccc',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (currentChatId !== chat.id) e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      if (currentChatId !== chat.id) e.target.style.color = '#ccc';
                    }}
                    title={chat.title}
                  >
                    {chat.title}
                  </button>
                  {currentChatId === chat.id && (
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        transition: 'color 0.2s ease',
                      }}
                      title="Delete chat"
                      onMouseEnter={(e) => e.target.style.color = '#ff4444'}
                      onMouseLeave={(e) => e.target.style.color = '#999'}
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Collapsed Sidebar Toggle & Mobile Hamburger */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 999,
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                }}
                title="Expand sidebar"
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(117, 106, 106, 0.15)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.border = '1px solid #999';
                  e.target.style.color = '#fff';
                }}
              >
                <FaBars size={18} />
              </button>
            )}

            {/* Mobile Sidebar Toggle (only visible on mobile) */}
            {sidebarOpen && window.innerWidth < 768 && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  zIndex: 999,
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                }}
                title="Close sidebar"
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#999';
                }}
              >
                <FaTimes size={18} />
              </button>
            )}

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: sidebarOpen ? '0' : '0px' }}>
              <Card title="AI Medical Consultation" className="mb-md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <style>
                    {`
                    @keyframes chatbotDot { 
                      0%, 60%, 100% { transform: translateY(0); opacity: 0.35; } 
                      30% { transform: translateY(-4px); opacity: 1; } 
                    }
                    @keyframes slideInSidebar {
                      from {
                        opacity: 0;
                        transform: translateX(-20px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(0);
                      }
                    }
                    .chat-container {
                      animation: slideInSidebar 0.3s ease-out;
                    }
                    .selection-options {
                      display: flex;
                      flex-direction: column;
                      gap: 8px;
                      margin-top: 12px;
                    }
                    .selection-button {
                      padding: 12px 16px;
                      background: #3b82f6;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 14px;
                      font-weight: 500;
                      transition: all 0.2s ease;
                      text-align: left;
                      display: flex;
                      align-items: center;
                      gap: 10px;
                      position: relative;
                      overflow: hidden;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    }
                    .selection-button::before {
                      content: '';
                      position: absolute;
                      left: 0;
                      top: 0;
                      height: 100%;
                      width: 4px;
                      background: rgba(255, 255, 255, 0.3);
                      transition: all 0.2s ease;
                    }
                    .selection-button:hover {
                      background: #2563eb;
                      transform: translateX(6px);
                      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                    }
                    .selection-button:hover::before {
                      width: 8px;
                    }
                    .selection-button:active {
                      transform: translateX(4px);
                    }
                    .selection-button:disabled {
                      opacity: 0.5;
                      cursor: not-allowed;
                      transform: none;
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
                      font-weight: 600;
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
                      transform: translateY(-2px);
                      box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                    }
                    .btn-confirm-no {
                      background: #dc3545;
                      color: white;
                    }
                    .btn-confirm-no:hover {
                      background: #c82333;
                      transform: translateY(-2px);
                      box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
                    }
                  `}
                  </style>
                  <div className="chat-history" style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f5f5f5' }}>
                    {messages.map((msg, idx) => (
                      <div key={msg.id} style={{ display: 'flex', marginBottom: '12px', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                        {msg.sender === 'bot' && <div style={{ background: 'white', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)', flexShrink: 0 }}><FaRobot size={14} /></div>}

                        <div style={{
                          maxWidth: '70%',
                          backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : '#ffffff',
                          color: msg.sender === 'user' ? '#ffffff' : '#333333',
                          padding: '10px 14px',
                          borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}>
                          {/* Only render text normally if NOT a confirmation message (confirmation has its own styled box) */}
                          {msg.ui_type !== 'confirmation' && (
                            <div style={{ wordBreak: 'break-word' }}>
                              {msg.sender === 'user' ? msg.text : renderFormattedLines(msg.text)}
                            </div>
                          )}

                          {msg.ui_type === 'doctor_selection' && msg.options.length > 0 && (
                            <div className="selection-options" style={{ marginTop: '12px' }}>
                              {msg.options.map((opt, idx) => (
                                <button
                                  key={opt.value || idx}
                                  className="selection-button"
                                  onClick={() => handleOptionClick(opt.value)}
                                  disabled={loading}
                                >
                                  <FaUserMd /> {opt.label?.replace('👨‍⚕️', '').trim() || opt.value}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.ui_type === 'date_selection' && msg.options.length > 0 && (
                            <div className="selection-options" style={{ marginTop: '12px' }}>
                              {msg.options.map((opt, idx) => (
                                <button
                                  key={opt.value || idx}
                                  className="selection-button"
                                  onClick={() => handleOptionClick(opt.value)}
                                  disabled={loading}
                                >
                                  <FaCalendarAlt /> {opt.label?.replace('📅', '').trim() || opt.value}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.ui_type === 'time_selection' && msg.options.length > 0 && (
                            <div className="selection-options" style={{ marginTop: '12px' }}>
                              {msg.options.map((opt, idx) => (
                                <button
                                  key={opt.value || idx}
                                  className="selection-button"
                                  onClick={() => handleOptionClick(opt.value)}
                                  disabled={loading}
                                >
                                  <FaClock /> {opt.label?.replace('🕐', '').trim() || opt.value}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.ui_type === 'gender_selection' && msg.options.length > 0 && (
                            <div className="selection-options" style={{ marginTop: '12px' }}>
                              {msg.options.map((opt, idx) => (
                                <button
                                  key={opt.value || idx}
                                  className="selection-button"
                                  onClick={() => handleOptionClick(opt.value)}
                                  disabled={loading}
                                >
                                  {opt.label || opt.value || 'Option'}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.ui_type === 'emergency_selection' && msg.options.length > 0 && (
                            <div className="selection-options" style={{ marginTop: '12px' }}>
                              {msg.options.map((opt, idx) => (
                                <button
                                  key={opt.value || idx}
                                  className="selection-button"
                                  onClick={() => handleOptionClick(opt.value)}
                                  disabled={loading}
                                  style={{
                                    background: opt.value === 'high' ? '#fee2e2' :
                                      opt.value === 'medium' ? '#ffedd5' :
                                        opt.value === 'low' ? '#fefce8' : '#f0fdf4',
                                    color: opt.value === 'high' ? '#991b1b' :
                                      opt.value === 'medium' ? '#9a3412' :
                                        opt.value === 'low' ? '#854d0e' : '#166534',
                                    border: `1px solid ${opt.value === 'high' ? '#fecaca' :
                                      opt.value === 'medium' ? '#fed7aa' :
                                        opt.value === 'low' ? '#fef08a' : '#bbf7d0'}`
                                  }}
                                >
                                  {opt.value === 'high' ? <FaExclamationCircle /> :
                                    opt.value === 'medium' ? <FaExclamationTriangle /> :
                                      opt.value === 'low' ? <FaInfoCircle /> : <FaCheckCircle />}
                                  {opt.label?.replace(/[🔴🟠🟡🟢]/g, '').trim() || opt.value}
                                </button>
                              ))}
                            </div>
                          )}

                          {msg.ui_type === 'confirmation' && msg.options.length > 0 && (
                            <>
                              <div className="confirmation-box" style={{ backgroundColor: msg.sender === 'user' ? 'rgba(255,255,255,0.15)' : '#f8f9fa', borderColor: msg.sender === 'user' ? 'rgba(255,255,255,0.3)' : 'var(--primary-color)', color: msg.sender === 'user' ? '#ffffff' : '#333333' }}>
                                {renderFormattedLines(msg.text)}
                              </div>
                              <div className="confirmation-options" style={{ marginTop: '12px' }}>
                                {msg.options.map((opt, idx) => (
                                  <button
                                    key={opt.value || idx}
                                    className={`btn-confirm ${opt.value === 'yes' ? 'btn-confirm-yes' : 'btn-confirm-no'}`}
                                    onClick={() => handleOptionClick(opt.value)}
                                    disabled={loading}
                                  >
                                    {opt.label || (opt.value === 'yes' ? 'Confirm' : 'Cancel')}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {loading ? (
                      <div style={{ display: 'flex', marginBottom: '12px', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ background: 'white', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)', flexShrink: 0 }}><FaRobot size={14} /></div>
                        <div style={{
                          backgroundColor: '#ffffff',
                          color: '#333333',
                          padding: '10px 14px',
                          borderRadius: '18px 18px 18px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}>
                          <TypingDots />
                        </div>
                      </div>
                    ) : null}
                    <div ref={chatEndRef} />
                  </div>
                  {showInput && (
                    <form className="chat-input-area" onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid #eee' }}>
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
                    <div className="text-muted" style={{ color: 'crimson', marginTop: '8px', padding: '0 16px 16px' }}>
                      {error}
                    </div>
                  ) : null}
                </div>
              </Card>
            </main>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        appointmentData={appointmentDetails}
        onClose={() => setShowAppointmentModal(false)}
      />
    </div>
  );
}

export default ChatbotPage;
