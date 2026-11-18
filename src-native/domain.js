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
  else { start.setDate(1); end.setMonth(end.getMonth() + 1, 0); }
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
