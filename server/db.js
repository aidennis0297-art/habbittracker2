import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'habits.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    goal INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT '기본',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    habit_id TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, date, habit_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_records_user_date ON records(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
`);

export const defaultHabitsTemplate = [
  { name: '운동하기', emoji: '🏃‍♂️', goal: 20, category: '건강' },
  { name: '물 마시기', emoji: '💧', goal: 30, category: '건강' },
  { name: '독서하기', emoji: '📚', goal: 15, category: '자기계발' },
  { name: '명상하기', emoji: '🧘‍♂️', goal: 30, category: '자기계발' },
  { name: '설탕 안 먹기', emoji: '🚫', goal: 25, category: '생활습관' }
];

export function seedUserHabits(userId) {
  const insertHabit = db.prepare(`
    INSERT INTO habits (id, user_id, name, emoji, goal, category, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  defaultHabitsTemplate.forEach((habit, idx) => {
    const habitId = `${Date.now()}_${idx}`;
    insertHabit.run(habitId, userId, habit.name, habit.emoji, habit.goal, habit.category, idx, now);
  });
}

export default db;
