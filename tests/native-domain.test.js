import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, getAllowanceRange, calculateAvailableBalance, normalizeActivityInput, isValidDateKey, budgetDateRange, calculateFinanceSummary, calculateCategoryUsage, calculateSavingsBalance, validateSavingsWithdrawal, summarizeBudgetTransactions, normalizeNativeNote, filterNativeNotes, normalizeNativeTask, filterNativeTasks, findNextNativeClass, findNearestNativeTask, buildDashboardTimeline } from '../src-native/domain.js';

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
    [{ id: 1, amount: 5000, source: 'Work', date: '2026-11-18' }, { id: 2, amount: 1000, source: 'Refund', date: '2026-10-02' }],
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

test('native notes require title and content and preserve valid subject links', () => {
  assert.deepEqual(normalizeNativeNote({ title: '  HCI  ', content: '  Review prototype  ', kind: 'subject', subjectId: '4', pinned: true }),
    { title: 'HCI', content: 'Review prototype', kind: 'subject', subjectId: 4, pinned: true });
  assert.equal(normalizeNativeNote({ title: 'Personal', content: 'Text' }).kind, 'personal');
  assert.throws(() => normalizeNativeNote({ title: '', content: 'Text' }), /title/);
  assert.throws(() => normalizeNativeNote({ title: 'Title', content: ' ' }), /Write something/);
  assert.throws(() => normalizeNativeNote({ title: 'Title', content: 'Text', kind: 'subject' }), /Choose a subject/);
});

test('native note search, kind filters, archive state, and pinned ordering work together', () => {
  const notes = [
    { id: 1, title: 'Lecture 1', content: 'Database normalization', kind: 'lecture', updatedAt: '2026-11-17', pinned: 0, archived: 0 },
    { id: 2, title: 'Exam prep', content: 'Database final review', kind: 'personal', updatedAt: '2026-11-16', pinned: 1, archived: 0 },
    { id: 3, title: 'Old lecture', content: 'Normalization', kind: 'lecture', updatedAt: '2026-11-15', pinned: 1, archived: 1 },
  ];
  assert.deepEqual(filterNativeNotes(notes, 'database').map(note => note.id), [2, 1]);
  assert.deepEqual(filterNativeNotes(notes, '', 'lecture').map(note => note.id), [1]);
  assert.deepEqual(filterNativeNotes(notes, '', 'all', true).map(note => note.id), [3]);
  assert.deepEqual(filterNativeNotes(notes, 'missing').map(note => note.id), []);
});

test('native task validation normalizes descriptions, subject links, priorities, and optional dates', () => {
  assert.deepEqual(normalizeNativeTask({
    title: '  Submit project  ', description: '  Include the prototype  ',
    subjectId: '3', dueDate: '2026-11-25', priority: 'high',
  }), {
    title: 'Submit project', description: 'Include the prototype',
    subjectId: 3, dueDate: '2026-11-25', priority: 'High',
  });
  assert.equal(normalizeNativeTask({ title: 'Exam' }).priority, 'Normal');
  assert.throws(() => normalizeNativeTask({ title: ' ' }), /task title/);
  assert.throws(() => normalizeNativeTask({ title: 'Exam', dueDate: '2026-02-30' }), /valid due date/);
  assert.throws(() => normalizeNativeTask({ title: 'Exam', subjectId: 'bad' }), /valid subject/);
});

test('native task views filter pending, completed, and overdue items and sort due dates and priority', () => {
  const tasks = [
    { id: 1, title: 'Read chapter', description: 'HCI', dueDate: '2026-11-20', priority: 'Normal', completed: 0 },
    { id: 2, title: 'Submit lab', description: 'Database', dueDate: '2026-11-17', priority: 'High', completed: 0 },
    { id: 3, title: 'Another lab', description: 'Network', dueDate: '2026-11-17', priority: 'Low', completed: 0 },
    { id: 4, title: 'Old task', description: 'Finished work', dueDate: '2026-11-10', priority: 'Low', completed: 1 },
  ];
  assert.deepEqual(filterNativeTasks(tasks, 'pending', '', '2026-11-18').map(task => task.id), [2, 3, 1]);
  assert.deepEqual(filterNativeTasks(tasks, 'overdue', '', '2026-11-18').map(task => task.id), [2, 3]);
  assert.deepEqual(filterNativeTasks(tasks, 'completed', 'finished', '2026-11-18').map(task => task.id), [4]);
  assert.deepEqual(filterNativeTasks(tasks, 'all', 'database', '2026-11-18').map(task => task.id), [2]);
});


test('native widget selects the next active class and ignores past or inactive slots', () => {
  const now = new Date(2026, 10, 18, 7, 30);
  const next = findNextNativeClass([
    { day: 3, startMinutes: 420, endMinutes: 480, active: 1, code: 'EARLY', kind: 'Lecture', room: 'A1' },
    { day: 3, startMinutes: 540, endMinutes: 600, active: 0, code: 'CANCELLED', kind: 'Lab', room: 'B2' },
    { day: 3, startMinutes: 480, endMinutes: 540, active: 1, code: 'ITEC 80', kind: 'Lecture', room: 'A2' },
    { day: 4, startMinutes: 420, endMinutes: 480, active: 1, code: 'NSTP', kind: 'Class', room: 'Field' },
  ], now);
  assert.equal(next.title, 'ITEC 80');
  assert.equal(next.details, 'Lecture · A2');
  assert.equal(next.startAt.getTime(), new Date(2026, 10, 18, 8, 0).getTime());
});

test('native widget selects the nearest unfinished deadline', () => {
  const task = findNearestNativeTask([
    { id: 1, title: 'Later', dueDate: '2026-11-25', completed: 0 },
    { id: 2, title: 'Done', dueDate: '2026-11-17', completed: 1 },
    { id: 3, title: 'Overdue', dueDate: '2026-11-16', completed: 0 },
    { id: 4, title: 'No date', dueDate: null, completed: 0 },
  ]);
  assert.equal(task.id, 3);
  assert.equal(findNearestNativeTask([{ title: 'Done', dueDate: '2026-11-18', completed: 1 }]), null);
});


test('dashboard timeline combines classes and personal activities in chronological order', () => {
  const classes = [
    { id: 'class-1', code: 'ITEC 80', startMinutes: 480, endMinutes: 540 },
  ];
  const activities = [
    { id: 'activity-1', title: 'Morning walk', startMinutes: 420, endMinutes: 450 },
    { id: 'activity-2', title: 'Study group', startMinutes: 480, endMinutes: 600 },
  ];

  const timeline = buildDashboardTimeline(classes, activities);

  assert.deepEqual(timeline.map(item => [item.id, item.timelineType]), [
    ['activity-1', 'activity'],
    ['class-1', 'class'],
    ['activity-2', 'activity'],
  ]);
  assert.equal(classes[0].timelineType, undefined, 'the source class record is not mutated');
  assert.equal(activities[0].timelineType, undefined, 'the source activity record is not mutated');
});


test('dashboard timeline keys stay unique when SQLite tables reuse the same numeric id', () => {
  const timeline = buildDashboardTimeline(
    [{ id: 1, code: 'ITEC 80', startMinutes: 480, endMinutes: 540 }],
    [{ id: 1, title: 'Study group', startMinutes: 600, endMinutes: 660 }],
  );

  assert.deepEqual(timeline.map(item => item.timelineKey), ['class:1', 'activity:1']);
  assert.equal(new Set(timeline.map(item => item.timelineKey)).size, 2);
});
