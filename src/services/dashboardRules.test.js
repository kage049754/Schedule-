import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRecentTransactions, calculateFinanceSummary, sumActiveAllowances } from './dashboardRules.js'

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


test('dashboard finance summary reflects newly recorded expenses immediately', () => {
  const records = {
    allowances: [{ amount: 50000, startDate: '2026-11-16', endDate: '2026-11-22' }],
    income: [{ amount: 12000, date: '2026-11-18' }],
    expenses: [{ amount: 15000, date: '2026-11-18' }],
    savingsEntries: [{ amount: 5000, type: 'deposit' }],
  }
  const before = calculateFinanceSummary(records, '2026-11-18')
  assert.equal(before.availableBalance, 47000)
  records.expenses.push({ amount: 15000, date: '2026-11-18' })
  const after = calculateFinanceSummary(records, '2026-11-18')
  assert.equal(after.availableBalance, 32000)
  assert.equal(after.expenseTotal, 30000)
  assert.equal(after.savingsTotal, 5000)
})

test('dashboard recent transactions includes new and edited ledger records in date order', () => {
  const rows = buildRecentTransactions(
    [{ id: 2, source: 'Allowance', amount: 20000, date: '2026-11-18' }],
    [{ id: 3, description: 'Lunch', amount: 15000, date: '2026-11-18' }, { id: 1, description: 'Fare', amount: 3000, date: '2026-11-17' }],
    2,
  )
  assert.deepEqual(rows.map((item) => [item.type, item.label, item.signedAmount]), [
    ['expense', 'Lunch', -15000],
    ['income', 'Allowance', 20000],
  ])
})


test('future-dated income and expenses do not change the current available balance', () => {
  const summary = calculateFinanceSummary({
    allowances: [{ amount: 10000, startDate: '2026-11-16', endDate: '2026-11-22' }],
    income: [{ amount: 5000, date: '2026-11-18' }, { amount: 9000, date: '2026-11-20' }],
    expenses: [{ amount: 2000, date: '2026-11-18' }, { amount: 7000, date: '2026-11-21' }],
  }, '2026-11-18')
  assert.equal(summary.incomeTotal, 14000)
  assert.equal(summary.expenseTotal, 9000)
  assert.equal(summary.availableBalance, 13000)
})
