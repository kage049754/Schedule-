import test from 'node:test'
import assert from 'node:assert/strict'
import { sumActiveAllowances } from './dashboardRules.js'

test('dashboard counts only allowances active on the selected date', () => {
  const rows = [
    { amount: 50000, startDate: '2026-11-16', endDate: '2026-11-22' },
    { amount: 10000, startDate: '2026-11-18', endDate: '2026-11-18' },
    { amount: 90000, startDate: '2026-11-01', endDate: '2026-11-15' },
  ]
  assert.equal(sumActiveAllowances(rows, '2026-11-18'), 60000)
})

test('dashboard ignores malformed or future allowances', () => {
  assert.equal(sumActiveAllowances([
    { amount: 2000, startDate: '2026-11-19', endDate: '2026-11-25' },
    { amount: 3000 },
  ], '2026-11-18'), 0)
})
