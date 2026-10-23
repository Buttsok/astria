/**
 * Messages Component Script
 * Handles message inbox rendering and filtering
 */

// ==========================================================================
// Message Database Helpers
// ==========================================================================

function getMessagesDB() {
  return JSON.parse(localStorage.getItem('admin_messages_db')) || [];
}

function saveMessagesDB(messages) {
  localStorage.setItem('admin_messages_db', JSON.stringify(messages));
}

// ==========================================================================
// Message Inbox Rendering
// ==========================================================================

function renderMessages() {
  const inboxContainer = document.getElementById('message-inbox-container');
  if (!inboxContainer) return;

  const messages = getMessagesDB();

  // Sort messages by date (newest first)
  messages.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (messages.length === 0) {
    inboxContainer.innerHTML = `
      <div class="message-empty-state" id="message-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        <p class="empty-title">No Messages Yet</p>
        <p class="empty-subtitle">Your inbox is currently empty. Messages will appear here once received.</p>
      </div>
    `;
    return;
  }

  inboxContainer.innerHTML = messages.map(msg => `
    <div class="message-card" onclick="openMessageThread('${msg.id}')" style="cursor: pointer; transition: all 0.2s ease; border-left: 3px solid ${msg.status === 'unread' ? '#58B673' : '#e2e8f0'}; padding: 16px; background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1e293b;">${escapeHtml(msg.senderName)}</h4>
        <span style="font-size: 0.75rem; color: #94a3b8;">${formatDate(msg.date)}</span>
      </div>
      <p style="margin: 0 0 4px 0; font-size: 0.9rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(msg.subject)}</p>
      <p style="margin: 0; font-size: 0.8rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(msg.preview)}</p>
    </div>
  `).join('');

  // Mark all as read if this is the first visit
  markAllAsRead();
}

// ==========================================================================
// Message Thread View
// ==========================================================================

function openMessageThread(messageId) {
  const messages = getMessagesDB();
  const message = messages.find(m => m.id === messageId);

  if (!message) return;

  // Open message detail view
  const threadContainer = document.getElementById('message-thread-container');
  if (threadContainer) {
    threadContainer.innerHTML = `
      <div class="message-thread-content" style="padding: 24px; background: #f8fafc; border-radius: 8px; max-height: 600px; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b;">${escapeHtml(message.subject)}</h3>
          <button onclick="closeMessageThread()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">From:</p>
          <p style="margin: 0; font-weight: 600; color: #1e293b;">${escapeHtml(message.senderName)}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">Date:</p>
          <p style="margin: 0;">${formatDateTime(message.date)}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 4px;">Message:</p>
          <div style="padding: 16px; background: #ffffff; border-radius: 6px; border: 1px solid #cbd5e1;">
            ${escapeHtml(message.body || message.content)}
          </div>
        </div>

        <div style="margin-top: 24px;">
          <button onclick="replyToMessage('${message.id}')" class="btn-green-pill" style="padding: 10px 20px; border-radius: 6px; cursor: pointer; border: 1px solid #58B673; background: #58B673; color: white; font-weight: 600;">Reply</button>
        </div>
      </div>
    `;

    threadContainer.style.display = 'block';
    inboxContainer.style.display = 'none';
  }

  // Mark as read
  message.status = 'read';
  saveMessagesDB(messages);
}

function closeMessageThread() {
  const threadContainer = document.getElementById('message-thread-container');
  const inboxContainer = document.getElementById('message-inbox-container');

  if (threadContainer) threadContainer.style.display = 'none';
  if (inboxContainer) inboxContainer.style.display = 'block';

  renderMessages();
}

function replyToMessage(messageId) {
  const reply = prompt('Enter your reply:');
  if (reply && reply.trim()) {
    const messages = getMessagesDB();
    const message = messages.find(m => m.id === messageId);

    if (message) {
      message.replies = message.replies || [];
      message.replies.push({
        sender: 'Admin',
        text: reply,
        date: new Date().toISOString()
      });

      message.status = 'read';
      saveMessagesDB(messages);
      showToast('Reply sent successfully!');
    }
  }
}

// ==========================================================================
// Utility Functions
// ==========================================================================

function markAllAsRead() {
  const messages = getMessagesDB();
  let hasChanges = false;

  messages.forEach(msg => {
    if (msg.status === 'unread') {
      msg.status = 'read';
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveMessagesDB(messages);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatDateTime(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// ==========================================================================
// Page Load Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  if(window.location.pathname.includes('messages.html')) {
    renderMessages();
  }
});