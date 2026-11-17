export function allowanceRange(period, date = new Date()) {
  const key = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (period === 'daily') return { startDate: key(start), endDate: key(start) }
  if (period === 'weekly') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const end = new Date(start); end.setDate(end.getDate() + 6)
    return { startDate: key(start), endDate: key(end) }
  }
  if (period === 'monthly') return { startDate: key(new Date(start.getFullYear(), start.getMonth(), 1)), endDate: key(new Date(start.getFullYear(), start.getMonth() + 1, 0)) }
  throw new Error('Choose a daily, weekly, or monthly allowance.')
}

export function calculateCategoryUsage(limitAmount, expenses = []) {
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const limit = Number(limitAmount || 0)
  return {
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.min(100, Math.round(spent / limit * 100)) : 0,
    exceeded: spent > limit,
  }
}

export function budgetReportRange(period, date = new Date()) {
  const key = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (period === 'today') {
    const value = key(start)
    return { startDate: value, endDate: value, label: 'Today' }
  }
  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    const end = new Date(start); end.setDate(end.getDate() + 6)
    return { startDate: key(start), endDate: key(end), label: 'This week' }
  }
  if (period === 'month') {
    const first = new Date(start.getFullYear(), start.getMonth(), 1)
    const last = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return { startDate: key(first), endDate: key(last), label: 'This month' }
  }
  if (period === 'all') return { startDate: null, endDate: null, label: 'All time' }
  throw new Error('Choose today, week, month, or all time.')
}

export function summarizeBudgetTransactions(income = [], expenses = [], period = 'month', date = new Date()) {
  const range = budgetReportRange(period, date)
  const inRange = (item) => !range.startDate || (item.date >= range.startDate && item.date <= range.endDate)
  const filteredIncome = income.filter(inRange)
  const filteredExpenses = expenses.filter(inRange)
  const incomeTotal = filteredIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const expenseTotal = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return {
    ...range,
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
    transactionCount: filteredIncome.length + filteredExpenses.length,
    transactions: [
      ...filteredIncome.map((item) => ({ ...item, kind: 'Income', label: item.source || 'Income', sign: 1, table: 'income' })),
      ...filteredExpenses.map((item) => ({ ...item, kind: 'Expense', label: item.description || 'Expense', sign: -1, table: 'expenses' })),
    ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0)),
  }
}
