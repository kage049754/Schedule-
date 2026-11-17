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
