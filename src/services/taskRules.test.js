import test from 'node:test'
import assert from 'node:assert/strict'
import { filterTasks, normalizeTask } from './taskRules.js'

test('task validation trims title and applies defaults', () => {
  const task = normalizeTask({ title: '  Submit project  ' })
  assert.equal(task.title, 'Submit project')
  assert.equal(task.priority, 'normal')
  assert.equal(task.dueDate, '')
  assert.equal(task.subjectId, null)
})

test('task validation rejects empty title and malformed date', () => {
  assert.throws(() => normalizeTask({ title: ' ' }), /title/)
  assert.throws(() => normalizeTask({ title: 'Exam', dueDate: 'tomorrow' }), /valid due date/)
})

test('task views filter pending completed overdue and search text', () => {
  const tasks = [
    { id: 1, title: 'Read chapter', dueDate: '2026-11-20', priority: 'normal', completed: false },
    { id: 2, title: 'Submit lab', dueDate: '2026-11-17', priority: 'high', completed: false },
    { id: 3, title: 'Old task', dueDate: '2026-11-10', priority: 'low', completed: true },
  ]
  assert.deepEqual(filterTasks(tasks, 'pending', '', '2026-11-18').map((x) => x.id), [2, 1])
  assert.deepEqual(filterTasks(tasks, 'overdue', '', '2026-11-18').map((x) => x.id), [2])
  assert.deepEqual(filterTasks(tasks, 'completed', 'old', '2026-11-18').map((x) => x.id), [3])
})
