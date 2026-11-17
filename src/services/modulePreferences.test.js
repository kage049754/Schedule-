import test from 'node:test'
import assert from 'node:assert/strict'
import { MODULE_ORDER, normalizeModulePreferences } from './modulePreferences.js'

test('module order keeps each supported module exactly once', () => {
  const result = normalizeModulePreferences({ order: ['budget', 'schedule', 'budget', 'unknown'] })
  assert.deepEqual(result.order, ['budget', 'schedule', 'dashboard', 'notepad', 'tasks'])
})

test('Dashboard cannot be hidden and unknown hidden modules are discarded', () => {
  const result = normalizeModulePreferences({ hidden: ['dashboard', 'budget', 'bad', 'budget'] })
  assert.deepEqual(result.hidden, ['budget'])
  assert.deepEqual(MODULE_ORDER, ['dashboard', 'schedule', 'budget', 'notepad', 'tasks'])
})
