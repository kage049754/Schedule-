import test from 'node:test'
import assert from 'node:assert/strict'
import { allowanceRange } from './budgetRules.js'

test('daily allowance covers only the selected day', () => {
  assert.deepEqual(allowanceRange('daily', new Date(2026, 10, 18)), { startDate: '2026-11-18', endDate: '2026-11-18' })
})

test('weekly allowance is normalized to Monday through Sunday', () => {
  assert.deepEqual(allowanceRange('weekly', new Date(2026, 10, 18)), { startDate: '2026-11-16', endDate: '2026-11-22' })
})

test('monthly allowance covers the calendar month', () => {
  assert.deepEqual(allowanceRange('monthly', new Date(2026, 1, 12)), { startDate: '2026-02-01', endDate: '2026-02-28' })
})

test('unknown allowance periods are rejected', () => {
  assert.throws(() => allowanceRange('yearly', new Date(2026, 0, 1)), /daily, weekly, or monthly/)
})
