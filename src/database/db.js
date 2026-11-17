import Dexie from 'dexie'

export const db = new Dexie('ScheduleLocalDB')

const stores = {
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
}

db.version(1).stores(stores)

// Every version must declare the complete schema. Omitting unchanged stores
// from a later version would remove them from the active Dexie schema.
db.version(2).stores({
  ...stores,
  categoryBudgets: '++id, categoryId, period, startDate, endDate',
})

export async function initializeDatabase() {
  await db.open()
  return db
}

export async function clearAllLocalData() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}
