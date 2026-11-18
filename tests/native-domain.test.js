import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, getAllowanceRange, calculateAvailableBalance, normalizeActivityInput, isValidDateKey, budgetDateRange, calculateFinanceSummary, calculateCategoryUsage, calculateSavingsBalance, validateSavingsWithdrawal, summarizeBudgetTransactions } from '../src-native/domain.js';

test('money is stored as integer centavos', () => {
  assert.equal(parseMoneyToCentavos('205'), 20500);
  assert.equal(parseMoneyToCentavos('20.50'), 2050);
  assert.throws(() => parseMoneyToCentavos('0'));
});
test('time parsing validates 24-hour values', () => {
  assert.equal(parseTimeToMinutes('08:30'), 510);
  assert.throws(() => parseTimeToMinutes('25:00'));
});
test('schedule overlap rejects intersecting entries but allows adjacency', () => {
  const current = [{ startMinutes: 480, endMinutes: 540 }];
  assert.equal(hasTimeConflict(current, { startMinutes: 500, endMinutes: 560 }), true);
  assert.equal(hasTimeConflict(current, { startMinutes: 540, endMinutes: 600 }), false);
});
test('weekly allowance begins Monday and spans seven days', () => {
  assert.deepEqual(getAllowanceRange('weekly', new Date(2026, 10, 18)), { startDate: '2026-11-16', endDate: '2026-11-22' });
});
test('balance combines active allowance and income less expenses', () => {
  assert.equal(calculateAvailableBalance({allowances:[{amount:10000,startDate:'2026-01-01',endDate:'2026-12-31'}],income:[{amount:5000,date:'2026-11-01'}],expenses:[{amount:2500,date:'2026-11-18'}]},'2026-11-18'),12500);
});

test('personal activities validate and normalize their weekly schedule fields', () => {
  assert.deepEqual(normalizeActivityInput({title:' Study group ',day:3,startMinutes:600,endMinutes:660,location:' Library ',notes:' Bring notes '}),
    {title:'Study group',day:3,startMinutes:600,endMinutes:660,location:'Library',notes:'Bring notes'});
  assert.throws(() => normalizeActivityInput({title:'',day:3,startMinutes:600,endMinutes:660}), /title/);
  assert.throws(() => normalizeActivityInput({title:'Activity',day:0,startMinutes:600,endMinutes:660}), /Monday–Saturday/);
  assert.throws(() => normalizeActivityInput({title:'Activity',day:3,startMinutes:660,endMinutes:600}), /End time/);
});
test('personal activity overlap checks treat class and activity entries equally', () => {
  const classSlot = {startMinutes:480,endMinutes:540};
  const otherActivity = {startMinutes:600,endMinutes:660};
  const candidate = normalizeActivityInput({title:'Appointment',day:1,startMinutes:530,endMinutes:570});
  assert.equal(hasTimeConflict([classSlot,otherActivity],candidate),true);
  const adjacent = normalizeActivityInput({title:'Appointment',day:1,startMinutes:540,endMinutes:600});
  assert.equal(hasTimeConflict([classSlot,otherActivity],adjacent),false);
});

test('budget periods use local calendar-day boundaries and Monday week starts', () => {
  const date = new Date(2026, 10, 18);
  assert.deepEqual(budgetDateRange('today', date), { startDate: '2026-11-18', endDate: '2026-11-18', label: 'Today' });
  assert.deepEqual(budgetDateRange('week', date), { startDate: '2026-11-16', endDate: '2026-11-22', label: 'This week' });
  assert.deepEqual(budgetDateRange('month', date), { startDate: '2026-11-01', endDate: '2026-11-30', label: 'This month' });
  assert.deepEqual(budgetDateRange('all', date), { startDate: null, endDate: null, label: 'All time' });
  assert.throws(() => budgetDateRange('year', date), /today, week, month, or all time/);
});

test('date key validation rejects impossible calendar dates', () => {
  assert.equal(isValidDateKey('2026-11-19'), true);
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2026-13-01'), false);
  assert.equal(isValidDateKey('19-11-2026'), false);
});

test('finance summary counts active allowance and only transactions up to today in available balance', () => {
  const summary = calculateFinanceSummary({
    allowances: [
      { amount: 10000, startDate: '2026-11-16', endDate: '2026-11-22' },
      { amount: 5000, startDate: '2026-11-01', endDate: '2026-11-10' },
    ],
    income: [{ amount: 4000, date: '2026-11-18' }, { amount: 9000, date: '2026-11-20' }],
    expenses: [{ amount: 1500, date: '2026-11-17' }, { amount: 800, date: '2026-11-21' }],
    savingsEntries: [{ amount: 3000, type: 'deposit' }, { amount: 500, type: 'withdrawal' }],
  }, '2026-11-19');
  assert.deepEqual(summary, {
    allowanceTotal: 10000, incomeTotal: 13000, expenseTotal: 2300,
    incomeToDate: 4000, expensesToDate: 1500, savingsTotal: 2500, availableBalance: 12500,
  });
});

test('category usage reports remaining, capped progress, and overspending', () => {
  assert.deepEqual(calculateCategoryUsage(10000, [{ amount: 2500 }, { amount: 1500 }]),
    { spent: 4000, remaining: 6000, percent: 40, exceeded: false });
  assert.deepEqual(calculateCategoryUsage(1000, [{ amount: 1500 }]),
    { spent: 1500, remaining: -500, percent: 100, exceeded: true });
});

test('savings withdrawals cannot exceed the goal balance', () => {
  const entries = [{ amount: 10000, type: 'deposit' }, { amount: 2500, type: 'withdrawal' }];
  assert.equal(calculateSavingsBalance(entries), 7500);
  assert.equal(validateSavingsWithdrawal(entries, 5000), 2500);
  assert.throws(() => validateSavingsWithdrawal(entries, 7501), /cannot exceed/);
  assert.throws(() => validateSavingsWithdrawal(entries, 0), /greater than/);
});

test('money reports filter by period and sort newest transactions first', () => {
  const result = summarizeBudgetTransactions(
    [{ id: 1, amount: 5000, source: 'Work', date: '2026-11-18' }, { id: 2, amount: 1000, source: 'Refund', date: '2026-11-02' }],
    [{ id: 3, amount: 2000, description: 'Lunch', date: '2026-11-18' }, { id: 4, amount: 3000, description: 'Books', date: '2026-10-31' }],
    'month',
    new Date(2026, 10, 19)
  );
  assert.equal(result.incomeTotal, 5000);
  assert.equal(result.expenseTotal, 2000);
  assert.equal(result.net, 3000);
  assert.equal(result.transactionCount, 2);
  assert.deepEqual(result.transactions.map(item => item.id), [3, 1]);
});
