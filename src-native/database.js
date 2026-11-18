import * as SQLite from 'expo-sqlite';

let database;
const schema = [
  'CREATE TABLE IF NOT EXISTS profile (id TEXT PRIMARY KEY NOT NULL, displayName TEXT, program TEXT, yearSection TEXT, updatedAt TEXT)',
  'CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, professor TEXT, lectureRoom TEXT, labRoom TEXT, color TEXT, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS scheduleSlots (id INTEGER PRIMARY KEY AUTOINCREMENT, subjectId INTEGER NOT NULL, day INTEGER NOT NULL, startMinutes INTEGER NOT NULL, endMinutes INTEGER NOT NULL, kind TEXT NOT NULL, room TEXT, active INTEGER DEFAULT 1, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, day INTEGER NOT NULL, startMinutes INTEGER NOT NULL, endMinutes INTEGER NOT NULL, date TEXT, location TEXT, notes TEXT, createdAt TEXT, updatedAt TEXT)',
  'CREATE TABLE IF NOT EXISTS allowances (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER NOT NULL, period TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT NOT NULL, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS income (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER NOT NULL, source TEXT NOT NULL, date TEXT NOT NULL, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, amount INTEGER NOT NULL, description TEXT NOT NULL, categoryId INTEGER, date TEXT NOT NULL, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, active INTEGER DEFAULT 1)',
  'CREATE TABLE IF NOT EXISTS savingsGoals (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, targetAmount INTEGER NOT NULL, createdAt TEXT)',
  'CREATE TABLE IF NOT EXISTS savingsEntries (id INTEGER PRIMARY KEY AUTOINCREMENT, goalId INTEGER NOT NULL, amount INTEGER NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS categoryBudgets (id INTEGER PRIMARY KEY AUTOINCREMENT, categoryId INTEGER NOT NULL, amount INTEGER NOT NULL, period TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, subjectId INTEGER, kind TEXT DEFAULT "personal", updatedAt TEXT, archived INTEGER DEFAULT 0, pinned INTEGER DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, subjectId INTEGER, dueDate TEXT, priority TEXT DEFAULT "Normal", completed INTEGER DEFAULT 0, createdAt TEXT, updatedAt TEXT)',
  'CREATE TABLE IF NOT EXISTS taskChecklist (id INTEGER PRIMARY KEY AUTOINCREMENT, taskId INTEGER NOT NULL, text TEXT NOT NULL, position INTEGER DEFAULT 0, completed INTEGER DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT, updatedAt TEXT)'
];
export async function getDatabase() {
  if (database) return database;
  database = await SQLite.openDatabaseAsync('schedule-local.db');
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  for (const statement of schema) await database.execAsync(statement);
  const activityColumns = await database.getAllAsync('PRAGMA table_info(activities)');
  if (!activityColumns.some(column => column.name === 'date')) {
    await database.execAsync('ALTER TABLE activities ADD COLUMN date TEXT');
  }
  if (!activityColumns.some(column => column.name === 'updatedAt')) {
    await database.execAsync('ALTER TABLE activities ADD COLUMN updatedAt TEXT');
  }
  await database.runAsync('INSERT OR IGNORE INTO categories (name, type, active) VALUES (?, ?, 1), (?, ?, 1), (?, ?, 1), (?, ?, 1), (?, ?, 1), (?, ?, 1)', 'Food', 'expense', 'Transportation', 'expense', 'School', 'expense', 'Bills', 'expense', 'Health', 'expense', 'Others', 'expense');
  await database.runAsync('INSERT OR IGNORE INTO profile (id, displayName, program, yearSection, updatedAt) VALUES (?, ?, ?, ?, ?)', 'local', '', '', '', new Date().toISOString());
  return database;
}
export async function getSetting(key, fallback = null) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', key);
  return row ? row.value : fallback;
}
export async function setSetting(key, value) {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)', key, String(value), new Date().toISOString());
}
