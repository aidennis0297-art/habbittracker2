const TOKEN_KEY = 'habit_tracker_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY)
};

async function request(endpoint, options = {}) {
  const token = tokenStorage.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP 오류 ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    register: (username, password) =>
      request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    login: (username, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    me: () => request('/api/auth/me')
  },
  state: {
    get: () => request('/api/state')
  },
  habits: {
    create: (habit) =>
      request('/api/habits', {
        method: 'POST',
        body: JSON.stringify(habit)
      }),
    update: (id, updates) =>
      request(`/api/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      }),
    delete: (id) =>
      request(`/api/habits/${id}`, {
        method: 'DELETE'
      })
  },
  records: {
    toggle: (dateStr, habitId) =>
      request('/api/records/toggle', {
        method: 'POST',
        body: JSON.stringify({ dateStr, habitId })
      })
  },
  notes: {
    save: (dateStr, text) =>
      request('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ dateStr, text })
      })
  }
};

export default api;
