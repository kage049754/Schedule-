import { Capacitor, registerPlugin } from '@capacitor/core'
import { db } from '../database/db'
import { toLocalDateKey } from '../utils/dates'

const NativeScheduleWidget = registerPlugin('ScheduleWidget')

function findNextClass(slots, subjects, now) {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  let next = null
  for (let offset = 0; offset <= 14; offset += 1) {
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

export async function syncHomeWidget(now = new Date()) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return { updated: false, reason: 'native-android-required' }
  }
  const [slots, subjects, tasks] = await Promise.all([
    db.scheduleSlots.toArray(),
    db.subjects.toArray(),
    db.tasks.toArray(),
  ])
  const nextClass = findNextClass(slots, subjects, now)
  const today = toLocalDateKey(now)
  const nextTask = tasks
    .filter((task) => !task.completed && task.dueDate && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || String(a.title).localeCompare(String(b.title)))[0]

  await NativeScheduleWidget.updateSnapshot({
    classTitle: nextClass?.title || 'No upcoming class',
    classDetails: nextClass?.details || 'Your timetable is clear',
    classStartAt: nextClass?.startAt?.getTime() || 0,
    taskTitle: nextTask?.title || 'No pending deadline',
    taskDueDate: nextTask?.dueDate || '',
  })
  return { updated: true }
}
