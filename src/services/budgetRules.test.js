import test from 'node:test'
import assert from 'node:assert/strict'
import { allowanceRange, budgetReportRange, calculateCategoryUsage, summarizeBudgetTransactions } from './budgetRules.js'

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

test('budget report ranges use local calendar dates and Monday week starts', () => {
  const date = new Date(2026, 10, 18, 14, 30)
  assert.deepEqual(budgetReportRange('today', date), { startDate: '2026-11-18', endDate: '2026-11-18', label: 'Today' })
  assert.deepEqual(budgetReportRange('week', date), { startDate: '2026-11-16', endDate: '2026-11-22', label: 'This week' })
  assert.deepEqual(budgetReportRange('month', date), { startDate: '2026-11-01', endDate: '2026-11-30', label: 'This month' })
  assert.deepEqual(budgetReportRange('all', date), { startDate: null, endDate: null, label: 'All time' })
})

test('budget reports filter income and expenses by period and calculate net', () => {
  const result = summarizeBudgetTransactions(
    [
      { id: 1, source: 'Allowance', amount: 50000, date: '2026-11-18' },
      { id: 2, source: 'Work', amount: 10000, date: '2026-11-10' },
      { id: 3, source: 'Future', amount: 90000, date: '2026-12-01' },
    ],
    [
      { id: 4, description: 'Lunch', amount: 7500, date: '2026-11-18' },
      { id: 5, description: 'Fare', amount: 2500, date: '2026-11-17' },
      { id: 6, description: 'Next month', amount: 1000, date: '2026-12-02' },
    ],
    'week',
    new Date(2026, 10, 18, 12, 0),
  )
  assert.equal(result.incomeTotal, 50000)
  assert.equal(result.expenseTotal, 10000)
  assert.equal(result.net, 40000)
  assert.equal(result.transactionCount, 3)
  assert.deepEqual(result.transactions.map((item) => item.id), [4, 1, 5])
})
