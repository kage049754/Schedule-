import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLegacyBackup, validateLegacyBackup } from '../src-native/backup.js';

const legacy = {
  format: 'schedule-local-backup',
  version: 1,
  exportedAt: '2026-11-18T00:00:00.000Z',
  tables: {
    profile: [{ id: 'local', displayName: 'Student', program: 'BSIT', yearSection: '2-6' }],
    subjects: [{ id: 7, code: 'ITEC 80', name: 'HCI', professor: 'Prof', lectureRoom: 'A1' }],
    scheduleSlots: [{ id: 12, subjectId: 7, day: 1, startMinutes: 480, endMinutes: 540, kind: 'Lecture' }],
    activities: [{ id: 4, title: 'Study', date: '2026-11-18', startMinutes: 600, endMinutes: 660 }],
    expenses: [{ id: 9, amount: 2050, description: 'Lunch', categoryId: 2, date: '2026-11-18' }],
    categories: [{ id: 2, name: 'Food', type: 'expense' }],
    tasks: [{ id: 3, title: 'Reviewer', dueDate: '2026-11-20' }],
    taskChecklist: [{ id: 5, taskId: 3, text: 'Read chapter 1' }],
    savingsGoals: [{ id: 1, title: 'Laptop', targetAmount: 500000 }],
    savingsEntries: [{ id: 1, goalId: 1, amount: 10000, type: 'deposit', date: '2026-11-18' }],
    categoryBudgets: [{ id: 1, categoryId: 2, amount: 100000, period: 'monthly', startDate: '2026-11-01', endDate: '2026-11-30' }],
    notes: [{ id: 2, title: 'Lecture', content: 'Notes' }],
    settings: [{ key: 'theme', value: 'forest' }],
  },
};

test('accepts the existing Capacitor backup format version 1', () => {
  assert.equal(validateLegacyBackup(legacy), true);
});

test('normalizes old records without losing identifiers or relationships', () => {
  const data = normalizeLegacyBackup(legacy);
  assert.equal(data.subjects[0].id, 7);
  assert.equal(data.scheduleSlots[0].subjectId, 7);
  assert.equal(data.taskChecklist[0].taskId, 3);
  assert.equal(data.savingsEntries[0].goalId, 1);
  assert.equal(data.activities[0].day, 3);
  assert.equal(data.activities[0].date, '2026-11-18');
  assert.equal(data.tasks[0].priority, 'Normal');
  assert.equal(data.notes[0].kind, 'personal');
  assert.deepEqual(data.categoryBudgets, legacy.tables.categoryBudgets);
});

test('rejects unsupported formats and malformed table payloads', () => {
  assert.throws(() => validateLegacyBackup({ ...legacy, version: 2 }), /Unsupported backup/);
  assert.throws(() => validateLegacyBackup({ ...legacy, tables: { subjects: {} } }), /Invalid data/);
});

test('rejects empty backups and rows missing required fields', () => {
  assert.throws(() => validateLegacyBackup({ ...legacy, tables: { subjects: [] } }), /no planner records/);
  assert.throws(() => validateLegacyBackup({ ...legacy, tables: { subjects: [{ id: 1, code: 'X' }] } }), /Missing name/);
});

test('rejects duplicate primary identifiers before any database writes', () => {
  const duplicate = { ...legacy, tables: { ...legacy.tables, subjects: [
    { id: 7, code: 'A', name: 'A' }, { id: 7, code: 'B', name: 'B' },
  ] } };
  assert.throws(() => validateLegacyBackup(duplicate), /Duplicate record ID/);
});
