import { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import API from '../services/api';

function ChatWindow({ currentUser, initialContact }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const connectionRef = useRef(null);
  const messageEndRef = useRef(null);

  useEffect(() => {
    fetchContacts();
    initSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop()
          .then(() => console.log('SignalR Chat Connection Stopped.'))
          .catch(err => console.error('Error stopping SignalR connection', err));
      }
    };
  }, []);

  // Auto-scroll message feed to bottom
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchContacts = async () => {
    setLoadingContacts(true);
    try {
      const res = await API.get('/chat/contacts');
      let data = res.data;

      // Handle custom initial chat contact
      if (initialContact && !data.some(c => c.userId === initialContact.userId)) {
        const newContact = {
          userId: initialContact.userId,
          fullName: initialContact.fullName,
          userType: initialContact.userType,
          lastMessage: 'No messages yet. Send a greeting!',
          lastMessageTimestamp: new Date().toISOString(),
          unreadCount: 0
        };
        data = [newContact, ...data];
      }

      setContacts(data);

      if (initialContact) {
        const matchingContact = data.find(c => c.userId === initialContact.userId);
        if (matchingContact) {
          handleSelectContact(matchingContact);
        }
      }
    } catch (err) {
      console.error('Error fetching chat contacts', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const initSignalR = async () => {
    const token = localStorage.getItem('skillsathi_token');
    if (!token) return;

    try {
      // Connect to Hub passing token in query string
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5008/r/chat', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      connection.on('ReceiveMessage', (senderId, messageText, timestamp, messageId) => {
        // 1. If the message is from/to the currently open conversation, append it
        setSelectedContact(currContact => {
          if (currContact && (senderId === currContact.userId || senderId === currentUser.id)) {
            setMessages(prev => {
              // Prevent duplicates (e.g. from multi-tab sync)
              if (prev.some(m => m.id === messageId)) return prev;
              return [...prev, {
                id: messageId,
                senderId,
                receiverId: senderId === currentUser.id ? currContact.userId : currentUser.id,
                message: messageText,
                timestamp: new Date(timestamp),
                isRead: false
              }];
            });

            // Mark as read in DB if receiving from active partner
            if (senderId === currContact.userId) {
              API.post(`/chat/read/${senderId}`).catch(err => console.error(err));
            }
          }
          return currContact;
        });

        // 2. Refresh inbox list to show updated last message/unread count
        fetchContacts();
      });

      await connection.start();
      console.log('SignalR Chat Connection Started Successfully.');
      connectionRef.current = connection;
    } catch (err) {
      console.error('SignalR Chat Connection Failed', err);
    }
  };

  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setLoadingMessages(true);
    setMessages([]);
    setInputText('');

    try {
      // 1. Mark conversation messages as read
      await API.post(`/chat/read/${contact.userId}`);
      
      // 2. Fetch historic messages
      const res = await API.get(`/chat/history/${contact.userId}`);
      setMessages(res.data);
      
      // 3. Clear unread badge locally in contact list
      setContacts(prev => prev.map(c => c.userId === contact.userId ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error('Error loading chat history', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact || !connectionRef.current) return;

    try {
      // Send message via SignalR Hub (persists and broadcasts to both tabs)
      await connectionRef.current.invoke('SendMessage', selectedContact.userId, inputText);
      setInputText('');
    } catch (err) {
      console.error('Error sending hub message', err);
    }
  };

  return (
    <div className="container py-4 text-start animate-fade-in">
      <div className="glass-card glow-effect p-0 overflow-hidden" style={{ height: '75vh', minHeight: '500px' }}>
        <div className="row g-0 h-100">
          
          {/* LEFT PANEL: Inbox Contacts */}
          <div className="col-md-4 border-end border-secondary border-opacity-10 d-flex flex-column h-100">
            <div className="p-3 border-bottom border-secondary border-opacity-10">
              <h3 className="h5 text-white mb-0">Conversations</h3>
            </div>
            
            <div className="flex-grow-1 overflow-auto">
              {loadingContacts ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                </div>
              ) : contacts.length > 0 ? (
                <div className="list-group list-group-flush">
                  {contacts.map(c => (
                    <button
                      key={c.userId}
                      onClick={() => handleSelectContact(c)}
                      className={`list-group-item list-group-item-action border-0 px-3 py-3 d-flex flex-column text-start justify-content-center ${selectedContact?.userId === c.userId ? 'active-chat-item' : ''}`}
                      style={{
                        background: selectedContact?.userId === c.userId ? 'rgba(154, 85, 241, 0.12)' : 'transparent',
                        borderLeft: selectedContact?.userId === c.userId ? '3px solid var(--primary)' : '3px solid transparent',
                        color: 'var(--text-primary)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1 w-100">
                        <span className="text-white fw-bold" style={{ fontSize: '0.95rem' }}>{c.fullName}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(c.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center w-100">
                        <span className="text-secondary text-truncate pe-2" style={{ fontSize: '0.85rem', maxWidth: '85%' }}>
                          {c.lastMessage}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="badge rounded-pill bg-danger py-1 px-2" style={{ fontSize: '0.7rem' }}>
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-5" style={{ fontSize: '0.9rem' }}>
                  No active conversations found. Apply for jobs or view candidates to initiate chat.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Message Stream */}
          <div className="col-md-8 d-flex flex-column h-100">
            {selectedContact ? (
              <>
                {/* Contact Header */}
                <div className="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center bg-black bg-opacity-10">
                  <div>
                    <h3 className="h5 text-white mb-0">{selectedContact.fullName}</h3>
                    <span className="text-secondary" style={{ fontSize: '0.8rem' }}>{selectedContact.userType}</span>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-2" style={{ background: 'rgba(0,0,0,0.15)' }}>
                  {loadingMessages ? (
                    <div className="text-center my-auto">
                      <span className="spinner-border text-primary" role="status"></span>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map(m => {
                      const isMe = m.senderId === currentUser.id;
                      return (
                        <div 
                          key={m.id} 
                          className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                        >
                          <div 
                            className="p-3 rounded-3" 
                            style={{ 
                              maxWidth: '70%', 
                              background: isMe ? 'linear-gradient(135deg, var(--primary) 0%, #7c2dcf 100%)' : 'rgba(255,255,255,0.04)',
                              border: isMe ? 'none' : '1px solid var(--border-light)',
                              color: '#ffffff',
                              borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                          >
                            <p className="m-0" style={{ fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                              {m.message}
                            </p>
                          </div>
                          <span className="text-muted mt-1 px-1" style={{ fontSize: '0.7rem' }}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-muted my-auto" style={{ fontSize: '0.9rem' }}>
                      No messages yet. Send a greeting to start the conversation!
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Message Input Box */}
                <div className="p-3 border-top border-secondary border-opacity-10 bg-black bg-opacity-10">
                  <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input
                      type="text"
                      className="glass-input flex-grow-1"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-premium px-4" style={{ borderRadius: '10px' }}>
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary p-4">
                <svg className="mb-3" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h4 className="h5 text-white">Your SkillSathi Inbox</h4>
                <p className="text-muted text-center" style={{ maxWidth: '350px', fontSize: '0.9rem' }}>
                  Select a candidate or recruiter from the list on the left to exchange real-time messages.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
