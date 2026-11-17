import test from 'node:test'
import assert from 'node:assert/strict'
import { buildReminderCandidates, reminderDefaults, stableNotificationId } from './reminderRules.js'

test('class reminders use selected lead time and correct weekday', () => {
  const now = new Date(2026, 10, 18, 7, 0)
  const candidates = buildReminderCandidates({
    now, days: 2, settings: { ...reminderDefaults(), leadMinutes: 15 },
    subjects: [{ id: 3, code: 'ITEC 80' }],
    slots: [{ id: 9, subjectId: 3, day: 3, startMinutes: 8 * 60, endMinutes: 9 * 60, room: 'Lab 2', kind: 'Lecture' }],
  })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].at.getHours(), 7)
  assert.equal(candidates[0].at.getMinutes(), 45)
  assert.match(candidates[0].body, /Lab 2/)
})

test('task reminders skip completed, overdue, and undated tasks', () => {
  const now = new Date(2026, 10, 18, 9, 0)
  const candidates = buildReminderCandidates({ now, days: 7, settings: { ...reminderDefaults(), classesEnabled: false }, tasks: [
    { id: 1, title: 'Future task', dueDate: '2026-11-20', completed: false },
    { id: 2, title: 'Done', dueDate: '2026-11-20', completed: true },
    { id: 3, title: 'Past', dueDate: '2026-11-17', completed: false },
    { id: 4, title: 'No date', completed: false },
  ] })
  assert.deepEqual(candidates.map((x) => x.key), ['task-1-2026-11-20'])
})

test('notification ids are stable and stay within the reserved range', () => {
  const a = stableNotificationId('class-1-2026-11-18', 1000000)
  assert.equal(a, stableNotificationId('class-1-2026-11-18', 1000000))
  assert.ok(a >= 1000000 && a < 1800000)
})
