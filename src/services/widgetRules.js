export function findNextClass({ slots = [], subjects = [], now = new Date(), days = 14 }) {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  let next = null
  for (let offset = 0; offset <= days; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    for (const slot of slots) {
      if (slot.active === false || slot.day !== date.getDay()) continue
      const subject = subjectById.get(slot.subjectId)
      if (!subject) continue
      const startAt = new Date(date)
      startAt.setHours(Math.floor(slot.startMinutes / 60), slot.startMinutes % 60, 0, 0)
      if (startAt <= now) continue
      if (!next || startAt < next.startAt) {
        next = {
          title: subject.code || subject.name || 'Upcoming class',
          details: [slot.kind || 'Class', slot.room].filter(Boolean).join(' · '),
          startAt,
        }
      }
    }
  }
  return next
}

export function findNearestTaskDeadline(tasks = [], now = new Date()) {
  return tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || String(a.title).localeCompare(String(b.title)))[0] || null
}
