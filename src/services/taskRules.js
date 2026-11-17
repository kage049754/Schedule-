export function normalizeTask(input) {
  const title = String(input.title || '').trim()
  if (!title) throw new Error('Enter an assignment or task title.')
  const priority = ['low', 'normal', 'high'].includes(input.priority) ? input.priority : 'normal'
  const dueDate = String(input.dueDate || '').trim()
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('Choose a valid due date.')
  return { title, description: String(input.description || '').trim(), subjectId: input.subjectId ? Number(input.subjectId) : null, dueDate, priority }
}

export function filterTasks(tasks, view = 'pending', search = '', today = new Date().toISOString().slice(0, 10)) {
  const query = String(search).trim().toLocaleLowerCase()
  return tasks.filter((task) => {
    if (view === 'pending' && task.completed) return false
    if (view === 'completed' && !task.completed) return false
    if (view === 'overdue' && (task.completed || !task.dueDate || task.dueDate >= today)) return false
    return !query || [task.title, task.description].some((value) => String(value || '').toLocaleLowerCase().includes(query))
  }).sort((a, b) => {
    const aDue = a.dueDate || '9999-12-31'
    const bDue = b.dueDate || '9999-12-31'
    const priority = { high: 0, normal: 1, low: 2 }
    return aDue.localeCompare(bDue) || (priority[a.priority] ?? 1) - (priority[b.priority] ?? 1)
  })
}
