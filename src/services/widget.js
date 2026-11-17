import { Capacitor, registerPlugin } from '@capacitor/core'
import { db } from '../database/db'
import { findNearestTaskDeadline, findNextClass } from './widgetRules.js'
import { toLocalDateKey } from '../utils/dates'

const NativeScheduleWidget = registerPlugin('ScheduleWidget')

export async function syncHomeWidget(now = new Date()) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return { updated: false, reason: 'native-android-required' }
  }
  const [slots, subjects, tasks] = await Promise.all([
    db.scheduleSlots.toArray(),
    db.subjects.toArray(),
    db.tasks.toArray(),
  ])
  const nextClass = findNextClass({ slots, subjects, now })
  const nextTask = findNearestTaskDeadline(tasks, now)
  const taskDueDate = nextTask ? (() => {
    const [year, month, day] = nextTask.dueDate.split('-').map(Number)
    const formatted = new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    return nextTask.dueDate < toLocalDateKey(now) ? `OVERDUE · ${formatted}` : `Due ${formatted}`
  })() : ''

  await NativeScheduleWidget.updateSnapshot({
    classTitle: nextClass?.title || 'No upcoming class',
    classDetails: nextClass?.details || 'Your timetable is clear',
    classStartAt: nextClass?.startAt?.getTime() || 0,
    taskTitle: nextTask?.title || 'No pending deadline',
    taskDueDate,
  })
  return { updated: true }
}
