export function toCentavos(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Amount must be a valid non-negative number.')
  return Math.round(amount * 100)
}

export function fromCentavos(value) {
  return Number(value || 0) / 100
}

export function formatPeso(centavos = 0) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCentavos(centavos))
}

export function calculateAvailableBalance({ openingBalance = 0, income = [], expenses = [] }) {
  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  return Number(openingBalance) + totalIncome - totalExpenses
}
