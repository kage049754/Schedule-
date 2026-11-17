import Dexie from 'dexie'

export const db = new Dexie('ScheduleLocalDB')

db.version(1).stores({
  profile: 'id, updatedAt',
  subjects: '++id, code, name, createdAt',
  scheduleSlots: '++id, subjectId, day, startMinutes, endMinutes, kind, active',
  activities: '++id, title, day, startMinutes, endMinutes, date',
  allowances: '++id, period, startDate, endDate, createdAt',
  income: '++id, date, source, createdAt',
  expenses: '++id, date, categoryId, amount, createdAt',
  categories: '++id, name, type, active',
  savingsGoals: '++id, title, targetAmount, createdAt',
  savingsEntries: '++id, goalId, date, amount, type',
  notes: '++id, title, subjectId, kind, updatedAt, archived',
  tasks: '++id, title, subjectId, dueDate, priority, completed, createdAt',
  taskChecklist: '++id, taskId, position, completed',
  settings: 'key, updatedAt',
})

export async function initializeDatabase() {
  await db.open()
  return db
}

export async function clearAllLocalData() {
  await db.transaction('rw', Object.values(db.tables), async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}
