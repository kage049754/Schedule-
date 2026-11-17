export function sumActiveAllowances(allowances, dateKey) {
  return allowances
    .filter((item) => item.startDate && item.endDate && item.startDate <= dateKey && item.endDate >= dateKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}


export function calculateFinanceSummary({ allowances = [], income = [], expenses = [], savingsEntries = [] }, dateKey) {
  const allowanceTotal = sumActiveAllowances(allowances, dateKey)
  const incomeTotal = income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const savingsTotal = savingsEntries.reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    return sum + (item.type === 'withdrawal' ? -amount : amount)
  }, 0)
  return {
    allowanceTotal,
    incomeTotal,
    expenseTotal,
    availableBalance: allowanceTotal + incomeTotal - expenseTotal,
    savingsTotal,
  }
}

export function buildRecentTransactions(income = [], expenses = [], limit = 5) {
  return [
    ...income.map((item) => ({ ...item, type: 'income', label: item.source || 'Income', signedAmount: Number(item.amount || 0) })),
    ...expenses.map((item) => ({ ...item, type: 'expense', label: item.description || 'Expense', signedAmount: -Number(item.amount || 0) })),
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0)).slice(0, limit)
}
