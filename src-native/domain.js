export function parseMoneyToCentavos(value) {
  const amount = Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than ₱0.00.');
  return Math.round(amount * 100);
}
export function parseTimeToMinutes(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) throw new Error('Use 24-hour time, for example 08:30.');
  const hours = Number(match[1]), minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error('Enter a valid time.');
  return hours * 60 + minutes;
}
export function hasTimeConflict(entries, candidate) {
  return entries.some(entry => candidate.startMinutes < entry.endMinutes && candidate.endMinutes > entry.startMinutes);
}
export function getAllowanceRange(period, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  if (period === 'daily') { /* same date */ }
  else if (period === 'weekly') { start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); end.setTime(start.getTime()); end.setDate(end.getDate() + 6); }
  else if (period === 'monthly') { start.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
  else throw new Error('Choose a daily, weekly, or monthly allowance.');
  const key = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  return { startDate: key(start), endDate: key(end) };
}
export function calculateAvailableBalance({ allowances = [], income = [], expenses = [] }, today) {
  const allowance = allowances.filter(x => x.startDate <= today && x.endDate >= today).reduce((sum,x)=>sum+Number(x.amount||0),0);
  const earned = income.filter(x=>x.date<=today).reduce((sum,x)=>sum+Number(x.amount||0),0);
  const spent = expenses.filter(x=>x.date<=today).reduce((sum,x)=>sum+Number(x.amount||0),0);
  return allowance + earned - spent;
}

export function normalizeActivityInput(input = {}) {
  const title = String(input.title || '').trim();
  const day = Number(input.day);
  const startMinutes = Number(input.startMinutes);
  const endMinutes = Number(input.endMinutes);
  if (!title) throw new Error('Enter an activity title.');
  if (!Number.isInteger(day) || day < 1 || day > 6) throw new Error('Choose Monday–Saturday.');
  if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes)
      || startMinutes < 0 || endMinutes > 1440 || endMinutes <= startMinutes) {
    throw new Error('End time must be later than start time.');
  }
  return { title, day, startMinutes, endMinutes, location: String(input.location || '').trim(), notes: String(input.notes || '').trim() };
}

function dateKey(date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}

export function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function budgetDateRange(period, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (period === 'today') {
    const key = dateKey(start);
    return { startDate: key, endDate: key, label: 'Today' };
  }
  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startDate: dateKey(start), endDate: dateKey(end), label: 'This week' };
  }
  if (period === 'month') {
    return {
      startDate: dateKey(new Date(start.getFullYear(), start.getMonth(), 1)),
      endDate: dateKey(new Date(start.getFullYear(), start.getMonth() + 1, 0)),
      label: 'This month',
    };
  }
  if (period === 'all') return { startDate: null, endDate: null, label: 'All time' };
  throw new Error('Choose today, week, month, or all time.');
}

export function calculateFinanceSummary({ allowances = [], income = [], expenses = [], savingsEntries = [] }, today) {
  const allowanceTotal = allowances
    .filter(item => item.startDate <= today && item.endDate >= today)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const incomeTotal = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const incomeToDate = income.filter(item => item.date <= today).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expensesToDate = expenses.filter(item => item.date <= today).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savingsTotal = calculateSavingsBalance(savingsEntries);
  return { allowanceTotal, incomeTotal, expenseTotal, incomeToDate, expensesToDate, savingsTotal, availableBalance: allowanceTotal + incomeToDate - expensesToDate };
}

export function calculateCategoryUsage(limitAmount, expenses = []) {
  const spent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const limit = Number(limitAmount || 0);
  return {
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.min(100, Math.round(spent / limit * 100)) : 0,
    exceeded: spent > limit,
  };
}

export function calculateSavingsBalance(entries = []) {
  return entries.reduce((sum, item) => sum + (item.type === 'withdrawal' ? -Number(item.amount || 0) : Number(item.amount || 0)), 0);
}

export function validateSavingsWithdrawal(entries = [], requestedAmount) {
  const amount = Number(requestedAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Enter a withdrawal greater than ₱0.00.');
  const balance = calculateSavingsBalance(entries);
  if (amount > balance) throw new Error('Withdrawal cannot exceed the amount saved in this goal.');
  return balance - amount;
}

export function summarizeBudgetTransactions(income = [], expenses = [], period = 'month', date = new Date()) {
  const range = budgetDateRange(period, date);
  const inRange = item => !range.startDate || (item.date >= range.startDate && item.date <= range.endDate);
  const filteredIncome = income.filter(inRange);
  const filteredExpenses = expenses.filter(inRange);
  const incomeTotal = filteredIncome.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const transactions = [
    ...filteredIncome.map(item => ({ ...item, table: 'income', kind: 'Income', label: item.source || 'Income', sign: 1 })),
    ...filteredExpenses.map(item => ({ ...item, table: 'expenses', kind: 'Expense', label: item.description || 'Expense', sign: -1 })),
  ].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || Number(b.id || 0) - Number(a.id || 0));
  return {
    ...range,
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
    transactionCount: transactions.length,
    transactions,
  };
}
