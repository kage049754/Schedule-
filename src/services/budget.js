import { allowanceRange } from './budgetRules.js'
import { db } from '../database/db'
import { toLocalDateKey } from '../utils/dates'

function requireAmount(amount) {
  const value = Number(amount)
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Enter an amount greater than ₱0.00.')
  return value
}

export async function addAllowance({ amount, period, date = new Date() }) {
  const range = allowanceRange(period, date)
  return db.allowances.add({ amount: requireAmount(amount), period, ...range, createdAt: new Date().toISOString() })
}

export async function addIncome({ amount, source, date = toLocalDateKey() }) {
  const label = String(source || '').trim()
  if (!label) throw new Error('Enter an income source.')
  return db.income.add({ amount: requireAmount(amount), source: label, date, createdAt: new Date().toISOString() })
}

export async function addExpense({ amount, description, categoryId = null, date = toLocalDateKey() }) {
  const label = String(description || '').trim()
  if (!label) throw new Error('Enter what the expense was for.')
  return db.expenses.add({ amount: requireAmount(amount), description: label, categoryId: categoryId ? Number(categoryId) : null, date, createdAt: new Date().toISOString() })
}

export async function addExpenseCategory(name) {
  const label = String(name || '').trim()
  if (!label) throw new Error('Enter a category name.')
  const existing = await db.categories.where('name').equalsIgnoreCase(label).and((item) => item.type === 'expense').first()
  if (existing) return existing.id
  return db.categories.add({ name: label, type: 'expense', active: true })
}

export async function addSavingsGoal({ title, targetAmount }) {
  const label = String(title || '').trim()
  if (!label) throw new Error('Enter a savings goal name.')
  return db.savingsGoals.add({ title: label, targetAmount: requireAmount(targetAmount), createdAt: new Date().toISOString() })
}

export async function addSavingsEntry({ goalId, amount, type = 'deposit', date = toLocalDateKey() }) {
  const id = Number(goalId)
  if (!Number.isInteger(id) || id <= 0) throw new Error('Choose a savings goal.')
  if (!['deposit', 'withdrawal'].includes(type)) throw new Error('Choose a valid savings action.')
  const goal = await db.savingsGoals.get(id)
  if (!goal) throw new Error('This savings goal no longer exists.')
  const value = requireAmount(amount)
  if (type === 'withdrawal') {
    const entries = await db.savingsEntries.where('goalId').equals(id).toArray()
    const balance = entries.reduce((sum, entry) => sum + (entry.type === 'withdrawal' ? -entry.amount : entry.amount), 0)
    if (value > balance) throw new Error('Withdrawal cannot exceed the amount saved in this goal.')
  }
  return db.savingsEntries.add({ goalId: id, amount: value, type, date })
}

export async function deleteMoneyRecord(tableName, id) {
  const allowed = ['allowances', 'income', 'expenses', 'savingsGoals']
  if (!allowed.includes(tableName)) throw new Error('Unsupported record type.')
  const recordId = Number(id)
  if (!Number.isInteger(recordId) || recordId <= 0) throw new Error('Invalid record identifier.')
  if (tableName === 'savingsGoals') {
    return db.transaction('rw', db.savingsGoals, db.savingsEntries, async () => {
      await db.savingsEntries.where('goalId').equals(recordId).delete()
      await db.savingsGoals.delete(recordId)
    })
  }
  return db[tableName].delete(recordId)
}
