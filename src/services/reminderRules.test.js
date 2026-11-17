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
  assert.deepEqual(candidates.map((x) => x.key), ['task-1-2026-11-20-0-08:00'])
})

test('notification ids are stable and stay within the reserved range', () => {
  const a = stableNotificationId('class-1-2026-11-18', 1000000)
  assert.equal(a, stableNotificationId('class-1-2026-11-18', 1000000))
  assert.ok(a >= 1000000 && a < 1800000)
})


test('task reminder supports configurable lead days and local alert time', () => {
  const now = new Date(2026, 10, 18, 7, 0)
  const candidates = buildReminderCandidates({
    now, days: 7,
    settings: { ...reminderDefaults(), classesEnabled: false, taskLeadDays: 2, taskReminderTime: '18:30' },
    tasks: [{ id: 7, title: 'Submit project', dueDate: '2026-11-22', completed: false }],
  })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].at.getFullYear(), 2026)
  assert.equal(candidates[0].at.getMonth(), 10)
  assert.equal(candidates[0].at.getDate(), 20)
  assert.equal(candidates[0].at.getHours(), 18)
  assert.equal(candidates[0].at.getMinutes(), 30)
  assert.equal(candidates[0].body, 'Due in 2 days.')
})

test('invalid task reminder time falls back to 8 AM', () => {
  const candidates = buildReminderCandidates({
    now: new Date(2026, 10, 18, 7, 0), days: 3,
    settings: { ...reminderDefaults(), classesEnabled: false, taskReminderTime: '25:99' },
    tasks: [{ id: 8, title: 'Read chapter', dueDate: '2026-11-19', completed: false }],
  })
  assert.equal(candidates[0].at.getHours(), 8)
  assert.equal(candidates[0].at.getMinutes(), 0)
})

test('activity reminders use the selected lead time and repeat on the chosen weekday', () => {
  const now = new Date(2026, 10, 18, 7, 0)
  const candidates = buildReminderCandidates({
    now, days: 2,
    settings: { ...reminderDefaults(), classesEnabled: false, tasksEnabled: false, activitiesEnabled: true, leadMinutes: 10 },
    activities: [{ id: 12, title: 'Study group', day: 3, startMinutes: 8 * 60, location: 'Library' }],
  })
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].kind, 'activity')
  assert.equal(candidates[0].at.getHours(), 7)
  assert.equal(candidates[0].at.getMinutes(), 50)
  assert.match(candidates[0].title, /Study group/)
  assert.match(candidates[0].body, /Library/)
})

test('activity reminders can be disabled independently', () => {
  const candidates = buildReminderCandidates({
    now: new Date(2026, 10, 18, 7, 0), days: 2,
    settings: { ...reminderDefaults(), classesEnabled: false, tasksEnabled: false, activitiesEnabled: false },
    activities: [{ id: 13, title: 'Meeting', day: 3, startMinutes: 9 * 60 }],
  })
  assert.equal(candidates.length, 0)
})
