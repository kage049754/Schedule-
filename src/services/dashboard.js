import { db } from '../database/db'
import { toLocalDateKey } from '../utils/dates'
import { sumActiveAllowances } from './dashboardRules'

export async function getDashboardSnapshot(now = new Date()) {
  const today = toLocalDateKey(now)
  const day = now.getDay()
  const [slots, subjects, tasks, allowances, income, expenses, savingsEntries] = await Promise.all([
    db.scheduleSlots.where('day').equals(day).toArray(),
    db.subjects.toArray(),
    db.tasks.toArray(),
    db.allowances.toArray(),
    db.income.toArray(),
    db.expenses.toArray(),
    db.savingsEntries.toArray(),
  ])

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  const todaysClasses = slots
    .filter((slot) => slot.active !== false)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map((slot) => ({ ...slot, subject: subjectById.get(slot.subjectId) || null }))

  const pendingTasks = tasks
    .filter((task) => !task.completed)
    .sort((a, b) => String(a.dueDate || '9999').localeCompare(String(b.dueDate || '9999')))
  const overdueTasks = pendingTasks.filter((task) => task.dueDate && task.dueDate < today)

  const allowanceTotal = sumActiveAllowances(allowances, today)
  const incomeTotal = income.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const savingsTotal = savingsEntries.reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    return sum + (item.type === 'withdrawal' ? -amount : amount)
  }, 0)

  return {
    today,
    todaysClasses,
    pendingTasks: pendingTasks.slice(0, 5),
    pendingTaskCount: pendingTasks.length,
    overdueTaskCount: overdueTasks.length,
    availableBalance: allowanceTotal + incomeTotal - expenseTotal,
    savingsTotal,
  }
}
