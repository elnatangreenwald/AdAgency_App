// Global Chat Manager
const ChatManager = {
    currentChatUserId: null,
    refreshInterval: null,
    isOpen: false,

    init() {
        // טעינת שיחות בעת פתיחה
        this.loadConversations();
        // טעינת משתמשים לבחירה
        this.loadUsersForSelection();
    },
    
    async loadUsersForSelection() {
        try {
            const response = await fetch('/api/chat/users');
            const data = await response.json();
            if (data.status === 'success') {
                const select = document.getElementById('chatUserSelect');
                if (select) {
                    // נקה את הרשימה (למעט האופציה הראשונה)
                    while (select.children.length > 1) {
                        select.removeChild(select.lastChild);
                    }
                    // הוסף משתמשים
                    data.users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = user.name;
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading users for selection:', error);
        }
    },
    
    selectUserForNewConversation(userId) {
        if (!userId) return;
        
        // מצא את שם המשתמש
        const select = document.getElementById('chatUserSelect');
        const selectedOption = select.options[select.selectedIndex];
        const userName = selectedOption.textContent;
        
        // פתח שיחה עם המשתמש
        this.openConversation(userId, userName);
        
        // אפס את הבחירה
        select.value = '';
    },

    openChat() {
        console.log('openChat called');
        const modal = document.getElementById('chatModal');
        const usersSection = document.getElementById('chatUsersSection');
        const messagesSection = document.getElementById('chatMessagesSection');
        
        if (!modal || !usersSection || !messagesSection) {
            console.error('Chat elements not found!', {modal, usersSection, messagesSection});
            return;
        }
        
        modal.style.display = 'flex';
        this.isOpen = true;
        this.currentChatUserId = null; // אפס שיחה פתוחה
        // הצג את רשימת השיחות והסתר את ההודעות
        usersSection.style.display = 'flex';
        messagesSection.style.display = 'none';
        console.log('Display set - usersSection: flex, messagesSection: none');
        this.loadConversations();
        this.loadUsersForSelection(); // טען משתמשים לבחירה
        // התחל auto-refresh כל 3 שניות
        this.startAutoRefresh();
    },

    closeChat() {
        document.getElementById('chatModal').style.display = 'none';
        this.isOpen = false;
        this.currentChatUserId = null;
        this.stopAutoRefresh();
    },

    startAutoRefresh() {
        // אם יש שיחה פתוחה, רענן כל 3 שניות
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            if (this.currentChatUserId) {
                this.loadMessages(this.currentChatUserId);
                // עדכן גם את הסטטוס בחלון השיחה
                this.updateConversationHeaderStatus(this.currentChatUserId);
            } else {
                this.loadConversations();
            }
        }, 3000);
    },
    
    async updateConversationHeaderStatus(userId) {
        const conversations = await this.getConversations();
        const conversation = conversations.find(c => c.user_id === userId);
        if (conversation) {
            const nameElement = document.getElementById('chatWithUserName');
            if (nameElement) {
                const userName = conversation.user_name;
                const isActive = conversation.is_active;
                const statusDot = `<span class="user-status-dot ${isActive ? 'status-online' : 'status-offline'}" title="${isActive ? 'מחובר' : 'לא מחובר'}"></span>`;
                nameElement.innerHTML = `${this.escapeHtml(userName)}${statusDot}`;
            }
        }
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    async loadConversations() {
        try {
            console.log('Loading conversations...');
            const response = await fetch('/api/chat/conversations');
            
            // בדוק אם התשובה היא rate limited
            if (response.status === 429) {
                console.warn('Rate limited, skipping refresh');
                return;
            }
            
            // בדוק אם התשובה היא JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Server returned non-JSON response. Status:', response.status);
                console.error('Response preview:', text.substring(0, 200));
                return;
            }
            
            const data = await response.json();
            console.log('Conversations response:', data);
            if (data.status === 'success') {
                this.renderConversations(data.conversations);
                // עדכן את הבאדג' על הכפתור
                this.updateButtonBadge(data.conversations);
            } else {
                console.error('Failed to load conversations:', data.error);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    },
    
    updateButtonBadge(conversations) {
        const badge = document.getElementById('chatUnreadBadge');
        if (!badge) return;
        
        // סכום של כל ההודעות הלא נקראות
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        
        if (totalUnread > 0) {
            badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    renderConversations(conversations) {
        const list = document.getElementById('chatUsersList');
        if (!list) {
            console.error('chatUsersList not found!');
            return;
        }
        
        console.log('Rendering conversations:', conversations.length);
        list.innerHTML = '';
        
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'chat-user-item';
            const userId = conv.user_id;
            const userName = conv.user_name;
            item.onclick = function() {
                console.log('User clicked:', userId, userName);
                ChatManager.openConversation(userId, userName);
            };
            
            const unreadBadge = conv.unread_count > 0 
                ? `<span class="chat-unread-badge">${conv.unread_count}</span>`
                : '';
            
            const statusDot = `<span class="user-status-dot ${conv.is_active ? 'status-online' : 'status-offline'}" title="${conv.is_active ? 'מחובר' : 'לא מחובר'}"></span>`;
            item.innerHTML = `
                <div class="chat-user-avatar">${conv.user_name.charAt(0)}</div>
                <div class="chat-user-info">
                    <div class="chat-user-name">${this.escapeHtml(conv.user_name)}${statusDot}${unreadBadge}</div>
                    <div class="chat-user-last-message">${this.escapeHtml(conv.last_message || 'אין הודעות')}</div>
                </div>
                <div class="chat-user-time">${conv.last_message_time || ''}</div>
            `;
            
            list.appendChild(item);
        });
        
        console.log('Rendered', list.children.length, 'conversation items');
    },

    async openConversation(userId, userName) {
        console.log('openConversation called with:', userId, userName);
        this.currentChatUserId = userId;
        // מצא את הסטטוס של המשתמש מהשיחות
        const conversations = await this.getConversations();
        const conversation = conversations.find(c => c.user_id === userId);
        const isActive = conversation ? conversation.is_active : false;
        
        // עדכן את השם עם נקודת סטטוס
        const nameElement = document.getElementById('chatWithUserName');
        if (!nameElement) {
            console.error('chatWithUserName element not found!');
            return;
        }
        const statusDot = `<span class="user-status-dot ${isActive ? 'status-online' : 'status-offline'}" title="${isActive ? 'מחובר' : 'לא מחובר'}"></span>`;
        nameElement.innerHTML = `${this.escapeHtml(userName)}${statusDot}`;
        
        const usersSection = document.getElementById('chatUsersSection');
        const messagesSection = document.getElementById('chatMessagesSection');
        if (!usersSection || !messagesSection) {
            console.error('Chat sections not found!', {usersSection, messagesSection});
            return;
        }
        
        usersSection.style.display = 'none';
        messagesSection.style.display = 'flex';
        console.log('Switched to messages section');
        await this.loadMessages(userId);
        // סמן הודעות כנקראות
        this.markAsRead(userId);
    },
    
    async getConversations() {
        try {
            const response = await fetch('/api/chat/conversations');
            
            // בדוק אם התשובה היא rate limited
            if (response.status === 429) {
                console.warn('Rate limited, skipping conversations fetch');
                return [];
            }
            
            // בדוק אם התשובה היא JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                console.error('Server returned non-JSON response. Status:', response.status);
                return [];
            }
            
            const data = await response.json();
            if (data.status === 'success') {
                return data.conversations;
            }
            return [];
        } catch (error) {
            console.error('Error loading conversations:', error);
            return [];
        }
    },

    backToUsers() {
        this.currentChatUserId = null;
        document.getElementById('chatUsersSection').style.display = 'flex';
        document.getElementById('chatMessagesSection').style.display = 'none';
        this.loadConversations();
    },
    

    async loadMessages(userId) {
        try {
            const response = await fetch(`/api/chat/messages/${userId}`);
            
            // בדוק אם התשובה היא rate limited
            if (response.status === 429) {
                console.warn('Rate limited, skipping message refresh');
                return;
            }
            
            // בדוק אם התשובה היא JSON
            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Server returned non-JSON response. Status:', response.status);
                console.error('Response preview:', text.substring(0, 200));
                return;
            }
            
            const data = await response.json();
            if (data.status === 'success') {
                this.renderMessages(data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    },

    renderMessages(messages) {
        const container = document.getElementById('chatMessagesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        messages.forEach(msg => {
            const isMe = msg.from_user === currentUserId;
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${isMe ? 'chat-message-sent' : 'chat-message-received'}`;
            
            let filesHtml = '';
            if (msg.files && msg.files.length > 0) {
                filesHtml = '<div class="chat-message-files">';
                msg.files.forEach(file => {
                    // בדיקה אם זה קובץ תמונה לפי הסיומת
                    const fileName = file.original_name || file.filename || '';
                    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName);
                    
                    if (isImage) {
                        // הצג תמונה
                        filesHtml += `
                            <div class="chat-image-wrapper">
                                <a href="/static/chat_files/${file.filename}" target="_blank">
                                    <img src="/static/chat_files/${file.filename}" 
                                         alt="${this.escapeHtml(fileName)}"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <a href="/static/chat_files/${file.filename}" target="_blank" class="chat-file-link" style="display: none;">📎 ${this.escapeHtml(fileName)}</a>
                                </a>
                            </div>
                        `;
                    } else {
                        // הצג קישור רגיל
                        filesHtml += `<a href="/static/chat_files/${file.filename}" target="_blank" class="chat-file-link">📎 ${this.escapeHtml(fileName)}</a>`;
                    }
                });
                filesHtml += '</div>';
            }
            
            // אם יש is_manager_note, תן להודעה להציג HTML (עבור קישורים)
            const contentHtml = msg.content ? (msg.is_manager_note ? msg.content : this.escapeHtml(msg.content)) : '';
            msgDiv.innerHTML = `
                ${contentHtml ? `<div class="chat-message-content">${contentHtml}</div>` : ''}
                ${filesHtml}
                <div class="chat-message-time">${msg.created_date}</div>
            `;
            container.appendChild(msgDiv);
        });
        
        // גלול למטה
        container.scrollTop = container.scrollHeight;
    },


    async markAsRead(userId) {
        try {
            await fetch(`/api/chat/mark-read/${userId}`, {
                method: 'POST'
            });
            this.loadConversations(); // עדכן את הרשימה
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    },

    selectedFiles: [],
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        console.log('Files selected:', files.length);
        if (files.length > 0) {
            this.selectedFiles = this.selectedFiles.concat(files);
            this.updateFilesPreview();
            // אפס את ה-input כדי שניתן יהיה לבחור את אותו קובץ שוב
            event.target.value = '';
        }
    },
    
    updateFilesPreview() {
        const preview = document.getElementById('chatFilesPreview');
        if (!preview) return;
        
        if (this.selectedFiles.length === 0) {
            preview.style.display = 'none';
            return;
        }
        
        preview.style.display = 'flex';
        preview.style.flexDirection = 'column';
        preview.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'chat-file-item';
            fileItem.style.position = 'relative';
            
            // בדיקה אם זה קובץ תמונה
            const escapedFileName = this.escapeHtml(file.name);
            if (file.type && file.type.startsWith('image/')) {
                const reader = new FileReader();
                const fileIndex = index; // שמור את האינדקס למקרה שה-fileItem ישתנה
                reader.onload = function(e) {
                    fileItem.innerHTML = `
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 5px; display: block;" alt="${escapedFileName}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="chat-file-item-name" title="${escapedFileName}">${escapedFileName}</span>
                            <span class="chat-file-item-remove" onclick="ChatManager.removeFile(${fileIndex})" style="cursor: pointer; color: #dc3545; font-size: 18px; padding: 5px;">×</span>
                        </div>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                fileItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="chat-file-item-name" title="${escapedFileName}">📎 ${escapedFileName}</span>
                        <span class="chat-file-item-remove" onclick="ChatManager.removeFile(${index})" style="cursor: pointer; color: #dc3545; font-size: 18px; padding: 5px;">×</span>
                    </div>
                `;
            }
            
            preview.appendChild(fileItem);
        });
    },
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFilesPreview();
        // עדכן את input file
        const fileInput = document.getElementById('chatFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    },
    
    addPastedImage(file) {
        // הוסף את התמונה לרשימת הקבצים הנבחרים
        console.log('Adding pasted image:', file.name, file.type, file.size);
        this.selectedFiles.push(file);
        this.updateFilesPreview();
    },
    
    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        const content = input.value.trim();
        
        if (!this.currentChatUserId) {
            alert('אנא בחר משתמש לשיחה');
            return;
        }
        
        if (!content && this.selectedFiles.length === 0) {
            alert('אנא הזן הודעה או צרף קובץ');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('to_user', this.currentChatUserId);
            formData.append('content', content || '');
            
            // הוסף קבצים
            if (this.selectedFiles.length > 0) {
                console.log('Adding', this.selectedFiles.length, 'files to FormData');
                this.selectedFiles.forEach((file, index) => {
                    console.log(`File ${index}:`, file.name, file.type, file.size);
                    formData.append('files', file);
                });
            }
            
            console.log('Sending message to:', this.currentChatUserId);
            
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                body: formData
            });
            
            // בדוק אם התשובה היא JSON או HTML (שגיאה)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Server returned non-JSON response:', text.substring(0, 200));
                alert('שגיאה בשליחת ההודעה: השרת החזיר שגיאה. בדוק את הקונסול לפרטים נוספים.');
                return;
            }
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (data.status === 'success') {
                input.value = '';
                this.selectedFiles = [];
                this.updateFilesPreview();
                await this.loadMessages(this.currentChatUserId);
                this.loadConversations(); // עדכן את רשימת השיחות
            } else {
                console.error('Server error:', data.error);
                alert(data.error || 'שגיאה בשליחת ההודעה');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('שגיאה בשליחת ההודעה: ' + error.message);
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Handle Enter key in chat input
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat manager
    ChatManager.init();
    
    // Handle Enter key in chat input
    document.addEventListener('keypress', function(e) {
        const chatInput = document.getElementById('chatMessageInput');
        if (chatInput && document.activeElement === chatInput) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatManager.sendMessage();
            }
        }
    });
    
    // Setup paste event for images - only on chat input
    const chatInput = document.getElementById('chatMessageInput');
    if (chatInput) {
        chatInput.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    e.stopPropagation();
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const file = new File([blob], `pasted-image-${Date.now()}.png`, {type: 'image/png'});
                        ChatManager.addPastedImage(file);
                    }
                }
            }
        });
    }
    
    // Get current user ID from global variable or data attribute
    if (typeof currentUserId === 'undefined') {
        // Try to get from body data attribute
        const body = document.body;
        if (body) {
            currentUserId = body.getAttribute('data-user-id') || 'unknown';
        }
    }
});

