import { db } from '../database/db.js'

export const MODULE_ORDER = ['dashboard', 'schedule', 'budget', 'notepad', 'tasks']
export const MODULE_LABELS = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  budget: 'Budget',
  notepad: 'Notepad',
  tasks: 'Tasks',
}

export function normalizeModulePreferences(input = {}) {
  const supplied = Array.isArray(input.order) ? input.order : []
  const order = [...new Set([...supplied.filter((id) => MODULE_ORDER.includes(id)), ...MODULE_ORDER])]
  const hidden = [...new Set((Array.isArray(input.hidden) ? input.hidden : []).filter((id) => MODULE_ORDER.includes(id) && id !== 'dashboard'))]
  return { order, hidden }
}

export async function getModulePreferences() {
  const row = await db.settings.get('modules')
  return normalizeModulePreferences(row?.value)
}

export async function saveModulePreferences(input) {
  const value = normalizeModulePreferences(input)
  await db.settings.put({ key: 'modules', value, updatedAt: new Date().toISOString() })
  return value
}
