export function reminderDefaults() {
  return { classesEnabled: true, activitiesEnabled: true, tasksEnabled: true, leadMinutes: 10, taskLeadDays: 0, taskReminderTime: '08:00', vibrationEnabled: true, soundEnabled: true }
}

export function buildReminderCandidates({ slots = [], activities = [], subjects = [], tasks = [], settings = reminderDefaults(), now = new Date(), days = 30 }) {
  const subjectById = new Map(subjects.map((item) => [item.id, item]))
  const result = []
  const lead = Math.max(0, Math.min(120, Number(settings.leadMinutes) || 0))
  const taskLeadDays = Math.max(0, Math.min(7, Number(settings.taskLeadDays) || 0))
  const taskReminderTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(settings.taskReminderTime || '') ? settings.taskReminderTime : '08:00'
  if (settings.classesEnabled) {
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
      const day = date.getDay()
      for (const slot of slots) {
        if (slot.active === false || slot.day !== day) continue
        const subject = subjectById.get(slot.subjectId)
        if (!subject) continue
        const at = new Date(date)
        at.setHours(Math.floor(slot.startMinutes / 60), slot.startMinutes % 60, 0, 0)
        at.setMinutes(at.getMinutes() - lead)
        if (at <= now) continue
        result.push({ kind: 'class', key: `class-${slot.id}-${date.toISOString().slice(0, 10)}`, at, title: `Upcoming class: ${subject.code || subject.name}`, body: `${slot.kind || 'Class'} starts in ${lead} minutes${slot.room ? ` · ${slot.room}` : ''}` })
      }
    }
  }
  if (settings.activitiesEnabled) {
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
      const day = date.getDay()
      for (const activity of activities) {
        if (activity.day !== day) continue
        const at = new Date(date)
        at.setHours(Math.floor(activity.startMinutes / 60), activity.startMinutes % 60, 0, 0)
        at.setMinutes(at.getMinutes() - lead)
        if (at <= now) continue
        result.push({
          kind: 'activity',
          key: 'activity-' + activity.id + '-' + date.toISOString().slice(0, 10),
          at,
          title: 'Upcoming activity: ' + activity.title,
          body: (activity.location || 'Personal activity') + ' · starts in ' + lead + ' minutes',
        })
      }
    }
  }
  if (settings.tasksEnabled) {
    for (const task of tasks) {
      if (task.completed || !task.dueDate) continue
      const [year, month, day] = task.dueDate.split('-').map(Number)
      const at = new Date(year, month - 1, day - taskLeadDays, Number(taskReminderTime.slice(0, 2)), Number(taskReminderTime.slice(3, 5)), 0, 0)
      if (at <= now || at.getTime() > now.getTime() + days * 86400000) continue
      result.push({ kind: 'task', key: `task-${task.id}-${task.dueDate}-${taskLeadDays}-${taskReminderTime}`, at, title: `Task deadline: ${task.title}`, body: taskLeadDays ? `Due in ${taskLeadDays} day${taskLeadDays === 1 ? '' : 's'}.` : 'This task is due today.' })
    }
  }
  return result
}

export function stableNotificationId(key, base) {
  let hash = 2166136261
  for (const char of key) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619) }
  return base + (hash >>> 0) % 800000
}
