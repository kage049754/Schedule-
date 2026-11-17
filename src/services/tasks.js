import { db } from '../database/db.js'
import { normalizeTask } from './taskRules.js'

export async function saveTask(input, id = null) {
  const task = normalizeTask(input)
  if (task.subjectId && !(await db.subjects.get(task.subjectId))) throw new Error('The selected subject no longer exists.')
  const now = new Date().toISOString()
  if (id) {
    const existing = await db.tasks.get(Number(id))
    if (!existing) throw new Error('This task no longer exists.')
    await db.tasks.update(Number(id), { ...task, updatedAt: now })
    return Number(id)
  }
  return db.tasks.add({ ...task, completed: false, createdAt: now, updatedAt: now })
}

export async function setTaskCompleted(id, completed) {
  return db.tasks.update(Number(id), { completed: Boolean(completed), updatedAt: new Date().toISOString() })
}

export async function deleteTask(id) {
  const taskId = Number(id)
  return db.transaction('rw', db.tasks, db.taskChecklist, async () => {
    await db.taskChecklist.where('taskId').equals(taskId).delete()
    await db.tasks.delete(taskId)
  })
}

export async function addChecklistItem(taskId, text) {
  const id = Number(taskId)
  const label = String(text || '').trim()
  if (!label) throw new Error('Enter a checklist item.')
  if (!(await db.tasks.get(id))) throw new Error('This task no longer exists.')
  const count = await db.taskChecklist.where('taskId').equals(id).count()
  return db.taskChecklist.add({ taskId: id, text: label, position: count, completed: false })
}

export async function setChecklistCompleted(id, completed) {
  return db.taskChecklist.update(Number(id), { completed: Boolean(completed) })
}

export async function deleteChecklistItem(id) {
  return db.taskChecklist.delete(Number(id))
}
