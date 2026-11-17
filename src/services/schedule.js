import { db } from '../database/db'
import { hasTimeConflict } from './scheduleRules'
export { mergeAdjacentSlots } from './scheduleRules'

export const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export async function createSubject(input) {
  const code = String(input.code || '').trim().toUpperCase()
  const name = String(input.name || '').trim()
  if (!code || !name) throw new Error('Subject code and subject name are required.')

  const existing = await db.subjects.where('code').equals(code).first()
  if (existing) throw new Error('A subject with this code already exists.')

  return db.subjects.add({
    code,
    name,
    professor: String(input.professor || '').trim(),
    lectureRoom: String(input.lectureRoom || '').trim(),
    labRoom: String(input.labRoom || '').trim(),
    color: input.color || 'forest',
    createdAt: new Date().toISOString(),
  })
}

export async function createScheduleSlot(input) {
  const day = Number(input.day)
  const startMinutes = Number(input.startMinutes)
  const endMinutes = Number(input.endMinutes)
  const subjectId = Number(input.subjectId)
  const kind = input.kind === 'Lab' ? 'Lab' : 'Lecture'

  if (!Number.isInteger(day) || day < 1 || day > 6) throw new Error('Select a valid day.')
  if (!Number.isInteger(startMinutes) || !Number.isInteger(endMinutes) || startMinutes < 0 || endMinutes > 1440 || endMinutes <= startMinutes) {
    throw new Error('End time must be later than start time.')
  }
  if (!Number.isInteger(subjectId) || subjectId <= 0) throw new Error('Select a subject.')

  return db.transaction('rw', db.subjects, db.scheduleSlots, async () => {
    const subject = await db.subjects.get(subjectId)
    if (!subject) throw new Error('The selected subject no longer exists.')

    const sameDay = await db.scheduleSlots.where('day').equals(day).toArray()
    if (hasTimeConflict(sameDay, { startMinutes, endMinutes })) {
      throw new Error('Schedule conflict: this time overlaps an existing class or activity. The existing entry was not changed.')
    }

    const roomFromSubject = kind === 'Lab' ? subject.labRoom : subject.lectureRoom
    return db.scheduleSlots.add({
      subjectId,
      day,
      startMinutes,
      endMinutes,
      kind,
      room: String(input.room || roomFromSubject || '').trim(),
      active: true,
      createdAt: new Date().toISOString(),
    })
  })
}

export async function deleteScheduleSlot(id) {
  return db.scheduleSlots.delete(Number(id))
}

export async function deleteScheduleSlots(ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Number.isInteger))]
  return db.scheduleSlots.bulkDelete(uniqueIds)
}

export async function deleteSubject(id) {
  const subjectId = Number(id)
  return db.transaction('rw', db.subjects, db.scheduleSlots, async () => {
    await db.scheduleSlots.where('subjectId').equals(subjectId).delete()
    await db.subjects.delete(subjectId)
  })
}

