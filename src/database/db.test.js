import test from 'node:test'
import assert from 'node:assert/strict'
import { db } from './db.js'

test('Dexie v2 keeps every v1 data table and adds category budgets', () => {
  const names = new Set(db.tables.map((table) => table.name))
  for (const name of [
    'profile', 'subjects', 'scheduleSlots', 'activities', 'allowances',
    'income', 'expenses', 'categories', 'savingsGoals', 'savingsEntries',
    'notes', 'tasks', 'taskChecklist', 'settings', 'categoryBudgets',
  ]) {
    assert.ok(names.has(name), 'missing Dexie store: ' + name)
  }
  assert.equal(db.verno, 2)
})
