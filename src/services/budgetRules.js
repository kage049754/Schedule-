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
