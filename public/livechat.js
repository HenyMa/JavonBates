// Simple polling-based live chat (no websockets)
// Uses shared admin mode from app.js: window.adminMode

// Get references to elements
const chatBox = document.getElementById('chatBox');
const chatUserInput = document.getElementById('chatUser');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSend');
const chatAdminBtn = document.getElementById('chatAdmin');

// Load chat messages
async function loadMessages() {
  try {
    const res = await fetch('/chat-messages');
    const msgs = await res.json();
    chatBox.innerHTML = '';
    msgs.forEach(msg => {
      const div = document.createElement('div');
      div.style = 'margin-bottom:6px;padding:6px;background:#f0f0f0;border-radius:3px;position:relative;';
      div.innerHTML = `<b>${msg.user}:</b> ${msg.text}`;
      
      if (window.adminMode && window.adminMode.enabled) {
        const del = document.createElement('button');
        del.textContent = '🗑';
        del.style = 'margin-left:8px;background:#ff4444;color:#fff;border:none;border-radius:3px;cursor:pointer;padding:2px 6px;font-size:12px;';
        del.onclick = async () => {
          const res = await fetch('/chat-delete', {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa('admin:' + window.adminMode.password),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: msg.id })
          });
          if (res.ok) loadMessages();
        };
        div.appendChild(del);
      }
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    console.error('Chat load error:', err);
  }
}

// Send message
async function sendMessage() {
  const user = chatUserInput.value.trim() || 'Anonymous';
  const text = chatInput.value.trim();
  if (!text) return;
  
  try {
    const res = await fetch('/chat-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, text })
    });
    if (res.ok) {
      chatInput.value = '';
      loadMessages();
    }
  } catch (err) {
    console.error('Chat send error:', err);
  }
}

// Event listeners
chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendMessage();
  }
});

// Watch for admin mode changes and refresh messages
const checkAdminInterval = setInterval(() => {
  if (window.adminMode && window.adminMode.enabled) {
    chatAdminBtn.style.display = 'inline-block';
    chatAdminBtn.style.backgroundColor = '#ff4444';
    chatAdminBtn.style.color = '#fff';
  } else {
    chatAdminBtn.style.display = 'none';
  }
}, 100);

// Poll for new messages every 2 seconds
setInterval(loadMessages, 2000);
loadMessages();
