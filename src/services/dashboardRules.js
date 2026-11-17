export function sumActiveAllowances(allowances, dateKey) {
  return allowances
    .filter((item) => item.startDate && item.endDate && item.startDate <= dateKey && item.endDate >= dateKey)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
}
