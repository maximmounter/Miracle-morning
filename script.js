/* ── Constants ── */
const SYSTEM_PROMPT = `You are Dawn, an upbeat and practical morning coach. The user currently wakes up at 8:00 AM and wants to wake up at 6:30 AM. You've created a morning routine for them starting at 6:30 AM: wake + hydrate, light stretching, shower, get dressed, breakfast, plan the day, then start the day at 7:30 AM.

Your job: help them actually make this transition succeed. Give practical, science-backed advice about sleep schedules, alarm strategies, circadian rhythm, evening wind-down routines, and staying motivated. Be warm, encouraging, and concise. Never be preachy. Keep replies under 120 words unless the user clearly wants more detail. Use simple language.`;

const API_URL = 'https://api.anthropic.com/v1/messages';

/* ── State ── */
let history = [];
let loading = false;

/* ── DOM refs ── */
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const sendBtn      = document.getElementById('sendBtn');
const chips        = document.getElementById('chips');

/* ── Event listeners ── */
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', () => autoResize(chatInput));

chips.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chatInput.value = chip.dataset.msg;
    sendMessage();
  });
});

/* ── Core functions ── */
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function sendMessage() {
  if (loading) return;

  const text = chatInput.value.trim();
  if (!text) return;

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Hide suggestion chips after first send
  chips.style.display = 'none';

  // Lock UI
  sendBtn.disabled = true;
  loading = true;

  // Show user message
  appendMessage('user', text);
  history.push({ role: 'user', content: text });

  // Show typing indicator
  const typingId = showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: history,
      }),
    });

    const data = await response.json();
    const reply = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    removeTyping(typingId);
    appendMessage('ai', reply);
    history.push({ role: 'assistant', content: reply });

  } catch (err) {
    console.error('API error:', err);
    removeTyping(typingId);
    appendMessage('ai', "Sorry, I couldn't connect right now. Try again in a moment!");
  }

  // Unlock UI
  loading = false;
  sendBtn.disabled = false;
  chatInput.focus();
}

/* ── UI helpers ── */
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;

  const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  if (role === 'ai') {
    div.innerHTML = `
      <div class="avatar ai-avatar">D</div>
      <div class="msg-bubble">${safeText}</div>
    `;
  } else {
    div.innerHTML = `<div class="msg-bubble">${safeText}</div>`;
  }

  chatMessages.appendChild(div);
  scrollToBottom();
}

function showTyping() {
  const id = `typing_${Date.now()}`;
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = id;
  div.innerHTML = `
    <div class="avatar ai-avatar">D</div>
    <div class="msg-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  chatMessages.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
