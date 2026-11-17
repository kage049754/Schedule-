import test from 'node:test'
import assert from 'node:assert/strict'
import { findNearestTaskDeadline, findNextClass } from './widgetRules.js'

test('home widget finds the next future class and includes room and type', () => {
  const now = new Date(2026, 10, 18, 9, 0)
  const result = findNextClass({
    now,
    days: 3,
    subjects: [{ id: 1, code: 'ITEC 80', name: 'HCI' }, { id: 2, code: 'MATH' }],
    slots: [
      { id: 1, subjectId: 1, day: 3, startMinutes: 8 * 60, active: true },
      { id: 2, subjectId: 1, day: 4, startMinutes: 10 * 60, kind: 'Lecture', room: 'Room 204', active: true },
      { id: 3, subjectId: 2, day: 4, startMinutes: 9 * 60, active: false },
    ],
  })
  assert.equal(result.title, 'ITEC 80')
  assert.equal(result.details, 'Lecture · Room 204')
  assert.equal(result.startAt.getDate(), 19)
  assert.equal(result.startAt.getHours(), 10)
})

test('home widget picks the nearest incomplete task deadline', () => {
  const result = findNearestTaskDeadline([
    { id: 1, title: 'Later', dueDate: '2026-11-25', completed: false },
    { id: 2, title: 'Completed', dueDate: '2026-11-19', completed: true },
    { id: 3, title: 'Overdue', dueDate: '2026-11-17', completed: false },
    { id: 4, title: 'Soonest', dueDate: '2026-11-20', completed: false },
  ], new Date(2026, 10, 18, 12, 0))
  assert.equal(result.title, 'Soonest')
})
