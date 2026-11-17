import test from 'node:test'
import assert from 'node:assert/strict'
import { allowanceRange, calculateCategoryUsage } from './budgetRules.js'

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

test('category spending limits report remaining amount and over-limit state', () => {
  assert.deepEqual(calculateCategoryUsage(10000, [{ amount: 3500 }, { amount: 2500 }]), {
    spent: 6000, remaining: 4000, percent: 60, exceeded: false,
  })
  assert.deepEqual(calculateCategoryUsage(10000, [{ amount: 12000 }]), {
    spent: 12000, remaining: -2000, percent: 100, exceeded: true,
  })
})
