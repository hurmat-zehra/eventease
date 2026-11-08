// Load events from Supabase
const eventList = document.getElementById('event-list');
if (eventList) {
  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error loading events:', error);
      eventList.innerHTML = `<p>Error loading events.</p>`;
      return;
    }

    if (data.length === 0) {
      eventList.innerHTML = `<p>No upcoming events.</p>`;
      return;
    }

    eventList.innerHTML = data.map(ev => `
      <div class="event">
        <h3>${ev.title}</h3>
        <p>${ev.description}</p>
        <small>${new Date(ev.date).toLocaleDateString()}</small><br />
        <button class="register-btn" data-title="${ev.title}">Register</button>
      </div>
    `).join('');

    // Register button logic
    document.querySelectorAll('.register-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-event-name').textContent = btn.dataset.title;
        document.getElementById('reg-event').value = btn.dataset.title;
        document.getElementById('registration-modal').classList.remove('hidden');
      });
    });
  }

  loadEvents();
}



// HOD login
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('Login failed: ' + error.message);
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

// HOD adds event
const addEventForm = document.getElementById('add-event-form');
if (addEventForm) {
  addEventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const date = document.getElementById('event-date').value;
    const club_name = document.getElementById('club-name').value;

    const { error } = await supabase.from('events').insert([
      { title, description, date, club_name }
    ]);

    if (error) {
      alert('Failed to add event: ' + error.message);
    } else {
      alert('Event added!');
      addEventForm.reset();
    }
  });
}

// Modal close logic
const modal = document.getElementById('registration-modal');
const closeModalBtn = document.getElementById('close-modal');
if (modal && closeModalBtn) {
  closeModalBtn.onclick = () => modal.classList.add('hidden');
}

// Event registration form
const regForm = document.getElementById('register-form');
if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const event_title = document.getElementById('reg-event').value;

    const { error } = await supabase.from('registrations').insert([{ name, email, event_title }]);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Successfully registered!');
      regForm.reset();
      modal.classList.add('hidden');
    }
  });
}

// CHATROOM LOGIC
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

if (chatBox && chatInput && sendBtn) {
  console.log('Supabase loaded:', supabase);

  async function loadMessages() {
    const { data, error } = await supabase
      .from('chatroom')
      .select('*')
      .order('created_at', { ascending: false }) // newest first
      .limit(30);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    chatBox.innerHTML = data.map(msg =>
      `<p><strong>${msg.username}</strong>: ${msg.text}</p>`
    ).join('');
  }

  sendBtn.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    const { error } = await supabase.from('chatroom').insert([{ username: 'Student', text }]);
    if (error) {
      console.error('Send error:', error.message);
    } else {
      chatInput.value = '';
      loadMessages();
    }
  });

  supabase
    .channel('chatroom')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chatroom' }, payload => {
      const msg = payload.new;
      const messageHTML = `<p><strong>${msg.username}</strong>: ${msg.text}</p>`;
      chatBox.innerHTML = messageHTML + chatBox.innerHTML;
    })
    .subscribe();

  loadMessages();
}
