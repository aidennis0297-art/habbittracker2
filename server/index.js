import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db, { seedUserHabits } from './db.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth Middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }

  req.user = payload;
  next();
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================= AUTH ENDPOINTS =================
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  const trimmedUsername = username.trim().toLowerCase();
  if (trimmedUsername.length < 4) {
    return res.status(400).json({ error: '아이디는 4자 이상이어야 합니다.' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '비밀번호는 4자 이상이어야 합니다.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(trimmedUsername);
    if (existing) {
      return res.status(409).json({ error: '이미 존재하는 아이디입니다.' });
    }

    const userId = `u_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
      userId,
      trimmedUsername,
      passwordHash,
      now
    );

    // Seed default habits for this new user
    seedUserHabits(userId);

    const token = generateToken({ id: userId, username: trimmedUsername });
    res.status(201).json({
      user: { id: userId, username: trimmedUsername },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 입력해주세요.' });
  }

  const trimmedUsername = username.trim().toLowerCase();

  try {
    const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(trimmedUsername);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken({ id: user.id, username: user.username });
    res.json({
      user: { id: user.id, username: user.username },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ================= STATE (ALL IN ONE) =================
app.get('/api/state', requireAuth, (req, res) => {
  const userId = req.user.id;

  try {
    const habits = db
      .prepare('SELECT id, name, emoji, goal, category, order_index FROM habits WHERE user_id = ? ORDER BY order_index ASC')
      .all(userId);

    const rawRecords = db
      .prepare('SELECT date, habit_id FROM records WHERE user_id = ? AND completed = 1')
      .all(userId);

    const records = {};
    for (const r of rawRecords) {
      if (!records[r.date]) {
        records[r.date] = [];
      }
      records[r.date].push(r.habit_id);
    }

    const rawNotes = db
      .prepare('SELECT date, note FROM notes WHERE user_id = ?')
      .all(userId);

    const notes = {};
    for (const n of rawNotes) {
      notes[n.date] = n.note;
    }

    res.json({
      user: req.user,
      habits,
      records,
      notes
    });
  } catch (err) {
    console.error('Fetch state error:', err);
    res.status(500).json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' });
  }
});

// ================= HABITS =================
app.get('/api/habits', requireAuth, (req, res) => {
  try {
    const habits = db
      .prepare('SELECT id, name, emoji, goal, category, order_index FROM habits WHERE user_id = ? ORDER BY order_index ASC')
      .all(req.user.id);
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: '습관 목록 조회 실패' });
  }
});

app.post('/api/habits', requireAuth, (req, res) => {
  const { name, emoji, goal, category } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '습관 이름을 입력해주세요.' });
  }

  const id = `h_${Date.now()}`;
  const now = new Date().toISOString();
  const goalNum = parseInt(goal, 10) || 0;
  const cat = category || '기본';
  const em = emoji || '✨';

  try {
    const maxOrder = db
      .prepare('SELECT COALESCE(MAX(order_index), 0) as max_order FROM habits WHERE user_id = ?')
      .get(req.user.id);
    const orderIndex = (maxOrder?.max_order ?? 0) + 1;

    db.prepare(`
      INSERT INTO habits (id, user_id, name, emoji, goal, category, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, name.trim(), em, goalNum, cat, orderIndex, now);

    res.status(201).json({
      id,
      name: name.trim(),
      emoji: em,
      goal: goalNum,
      category: cat,
      order_index: orderIndex
    });
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ error: '습관 추가 실패' });
  }
});

app.put('/api/habits/:id', requireAuth, (req, res) => {
  const habitId = req.params.id;
  const { name, emoji, goal, category, order_index } = req.body;

  try {
    const current = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!current) {
      return res.status(404).json({ error: '해당 습관을 찾을 수 없습니다.' });
    }

    const updatedName = name !== undefined ? name.trim() : current.name;
    const updatedEmoji = emoji !== undefined ? emoji : current.emoji;
    const updatedGoal = goal !== undefined ? parseInt(goal, 10) || 0 : current.goal;
    const updatedCategory = category !== undefined ? category : current.category;
    const updatedOrder = order_index !== undefined ? parseInt(order_index, 10) : current.order_index;

    db.prepare(`
      UPDATE habits
      SET name = ?, emoji = ?, goal = ?, category = ?, order_index = ?
      WHERE id = ? AND user_id = ?
    `).run(updatedName, updatedEmoji, updatedGoal, updatedCategory, updatedOrder, habitId, req.user.id);

    res.json({
      id: habitId,
      name: updatedName,
      emoji: updatedEmoji,
      goal: updatedGoal,
      category: updatedCategory,
      order_index: updatedOrder
    });
  } catch (err) {
    console.error('Update habit error:', err);
    res.status(500).json({ error: '습관 수정 실패' });
  }
});

app.delete('/api/habits/:id', requireAuth, (req, res) => {
  const habitId = req.params.id;
  try {
    db.prepare('DELETE FROM records WHERE user_id = ? AND habit_id = ?').run(req.user.id, habitId);
    db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, req.user.id);
    res.json({ success: true, deletedId: habitId });
  } catch (err) {
    console.error('Delete habit error:', err);
    res.status(500).json({ error: '습관 삭제 실패' });
  }
});

// ================= RECORDS =================
app.post('/api/records/toggle', requireAuth, (req, res) => {
  const { dateStr, habitId } = req.body;
  if (!dateStr || !habitId) {
    return res.status(400).json({ error: 'dateStr과 habitId가 필요합니다.' });
  }

  const userId = req.user.id;

  try {
    const existing = db
      .prepare('SELECT id FROM records WHERE user_id = ? AND date = ? AND habit_id = ?')
      .get(userId, dateStr, habitId);

    if (existing) {
      db.prepare('DELETE FROM records WHERE id = ?').run(existing.id);
    } else {
      const recordId = `r_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const now = new Date().toISOString();
      db.prepare('INSERT INTO records (id, user_id, date, habit_id, completed, created_at) VALUES (?, ?, ?, ?, 1, ?)').run(
        recordId,
        userId,
        dateStr,
        habitId,
        now
      );
    }

    const currentRecords = db
      .prepare('SELECT habit_id FROM records WHERE user_id = ? AND date = ? AND completed = 1')
      .all(userId, dateStr);

    const habitIds = currentRecords.map(r => r.habit_id);
    res.json({ dateStr, records: habitIds });
  } catch (err) {
    console.error('Toggle record error:', err);
    res.status(500).json({ error: '기록 업데이트 실패' });
  }
});

// ================= NOTES =================
app.post('/api/notes', requireAuth, (req, res) => {
  const { dateStr, text } = req.body;
  if (!dateStr) {
    return res.status(400).json({ error: 'dateStr이 필요합니다.' });
  }

  const userId = req.user.id;
  const now = new Date().toISOString();

  try {
    if (!text || !text.trim()) {
      db.prepare('DELETE FROM notes WHERE user_id = ? AND date = ?').run(userId, dateStr);
      return res.json({ dateStr, note: '' });
    }

    db.prepare(`
      INSERT INTO notes (user_id, date, note, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET note = excluded.note, updated_at = excluded.updated_at
    `).run(userId, dateStr, text.trim(), now);

    res.json({ dateStr, note: text.trim() });
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ error: '메모 저장 실패' });
  }
});

// Serve static frontend in production
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Habit Tracker Backend Server running on http://localhost:${PORT}`);
});
