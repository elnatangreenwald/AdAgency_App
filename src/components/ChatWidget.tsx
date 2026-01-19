import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  is_active: boolean;
}

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  content: string;
  created_date: string;
  read: boolean;
  files?: { filename: string; original_name: string }[];
  is_manager_note?: boolean;
}

interface Conversation {
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_active: boolean;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentChatUser, setCurrentChatUser] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const response = await api.get('/api/chat/conversations');
      if (response.data.status === 'success') {
        setConversations(response.data.conversations);
        const unread = response.data.conversations.reduce(
          (sum: number, conv: Conversation) => sum + (conv.unread_count || 0),
          0
        );
        setTotalUnread(unread);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load available users for new conversations
  const loadAvailableUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/chat/users');
      if (response.data.status === 'success') {
        setAvailableUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (userId: string) => {
    try {
      const response = await api.get(`/api/chat/messages/${userId}`);
      if (response.data.status === 'success') {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (userId: string) => {
    try {
      await api.post(`/api/chat/mark-read/${userId}`);
      loadConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, [loadConversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start/stop auto-refresh
  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadAvailableUsers();
      
      refreshIntervalRef.current = setInterval(() => {
        if (currentChatUser) {
          loadMessages(currentChatUser.id);
        } else {
          loadConversations();
        }
      }, 3000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isOpen, currentChatUser, loadConversations, loadMessages, loadAvailableUsers]);

  // Open chat modal
  const openChat = () => {
    setIsOpen(true);
    setCurrentChatUser(null);
  };

  // Close chat modal
  const closeChat = () => {
    setIsOpen(false);
    setCurrentChatUser(null);
    setMessages([]);
  };

  // Open conversation with specific user
  const openConversation = async (userId: string, userName: string) => {
    setCurrentChatUser({ id: userId, name: userName });
    await loadMessages(userId);
    markAsRead(userId);
  };

  // Back to user list
  const backToUsers = () => {
    setCurrentChatUser(null);
    setMessages([]);
    loadConversations();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  // Remove selected file
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle paste event for images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: 'image/png' });
          setSelectedFiles(prev => [...prev, file]);
        }
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!currentChatUser) return;
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('to_user', currentChatUser.id);
      formData.append('content', newMessage);
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/api/chat/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        setNewMessage('');
        setSelectedFiles([]);
        await loadMessages(currentChatUser.id);
        loadConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get user initials
  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  // Check if file is an image
  const isImage = (filename: string) => /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={openChat}
        className="fixed bottom-5 left-5 w-[60px] h-[60px] bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 border-[3px] border-[#3d817a] flex items-center justify-center p-2 overflow-hidden"
        title="צ'אט פנימי"
      >
        <img 
          src="/static/Vatkin_Logo.jpg" 
          alt="Chat" 
          className="w-full h-full object-contain rounded-full"
        />
        {totalUnread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 left-5 w-96 h-[500px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-l from-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👋</span>
                <div>
                  <h2 className="font-bold text-lg">שלום</h2>
                  <p className="text-sm opacity-90">מה תרצו להגיד היום?</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!currentChatUser ? (
              /* Users List */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* New Conversation */}
                <div className="p-4 border-b-2 border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">התחלת שיחה חדשה</h3>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    onChange={(e) => {
                      const userId = e.target.value;
                      if (userId) {
                        const selectedUser = availableUsers.find(u => u.id === userId);
                        if (selectedUser) {
                          openConversation(userId, selectedUser.name);
                        }
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">-- בחר משתמש לשיחה חדשה --</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      אין שיחות עדיין
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.user_id}
                        onClick={() => openConversation(conv.user_id, conv.user_name)}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-r-4 border-transparent hover:border-blue-500 transition-all"
                      >
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {getInitials(conv.user_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            {conv.user_name}
                            <span className={`w-2 h-2 rounded-full ${conv.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                            {conv.unread_count > 0 && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {conv.last_message || 'אין הודעות'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {conv.last_message_time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Messages View */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Messages Header */}
                <div className="p-3 border-b-2 border-gray-100 flex items-center gap-3">
                  <button
                    onClick={backToUsers}
                    className="text-gray-500 hover:text-blue-500 text-xl"
                  >
                    ←
                  </button>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {getInitials(currentChatUser.name)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 flex items-center gap-2">
                      {currentChatUser.name}
                      {conversations.find(c => c.user_id === currentChatUser.id)?.is_active && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {conversations.find(c => c.user_id === currentChatUser.id)?.is_active ? 'מחובר כעת' : 'לא מחובר'}
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                  {messages.map(msg => {
                    const isMe = msg.from_user === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`max-w-[85%] p-3 rounded-2xl ${
                          isMe
                            ? 'self-end bg-gradient-to-l from-indigo-500 to-purple-600 text-white rounded-bl-sm'
                            : 'self-start bg-white text-gray-800 rounded-br-sm shadow'
                        }`}
                      >
                        {msg.content && (
                          <div 
                            className="text-sm leading-relaxed mb-1"
                            dangerouslySetInnerHTML={msg.is_manager_note ? { __html: msg.content } : undefined}
                          >
                            {!msg.is_manager_note ? msg.content : null}
                          </div>
                        )}
                        {msg.files && msg.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.files.map((file, idx) => (
                              isImage(file.original_name || file.filename) ? (
                                <a
                                  key={idx}
                                  href={`/static/chat_files/${file.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={`/static/chat_files/${file.filename}`}
                                    alt={file.original_name}
                                    className="max-w-full rounded-lg max-h-48 object-contain"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={idx}
                                  href={`/static/chat_files/${file.filename}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block text-sm underline ${isMe ? 'text-white/90' : 'text-blue-500'}`}
                                >
                                  📎 {file.original_name || file.filename}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        <div className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.created_date}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="p-2 border-t bg-gray-50 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border text-sm">
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div className="p-3 border-t-2 border-gray-100 flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-blue-500 flex items-center justify-center text-xl transition-colors"
                  >
                    📎
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onPaste={handlePaste}
                      placeholder="הקלד הודעה..."
                      className="w-full p-3 pl-12 border-2 border-gray-200 rounded-full resize-none focus:border-blue-500 focus:outline-none text-sm"
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
