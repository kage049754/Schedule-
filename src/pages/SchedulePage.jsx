import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { CalendarDays, Plus, Trash2, BookOpen, Clock3 } from 'lucide-react'
import { db } from '../database/db'
import { createScheduleSlot, createSubject, deleteScheduleSlots, deleteSubject, DAYS, mergeAdjacentSlots } from '../services/schedule'
import { minutesFromTime } from '../utils/dates'

const START_MINUTES = 7 * 60
const END_MINUTES = 19 * 60
const HOUR_HEIGHT = 48

function displayTime(value) {
  return new Date(2000, 0, 1, Math.floor(value / 60), value % 60)
    .toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

function Field({ label, children }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label>
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100'

export default function SchedulePage() {
  const [subjects, setSubjects] = useState([])
  const [slots, setSlots] = useState([])
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showSlotForm, setShowSlotForm] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '', professor: '', lectureRoom: '', labRoom: '' })
  const [slotForm, setSlotForm] = useState({ subjectId: '', day: '1', start: '07:00', end: '08:00', kind: 'Lecture', room: '' })

  useEffect(() => {
    const subscription = liveQuery(async () => ({
      subjects: await db.subjects.orderBy('code').toArray(),
      slots: await db.scheduleSlots.toArray(),
    })).subscribe({
      next: (data) => { setSubjects(data.subjects); setSlots(data.slots) },
      error: (reason) => setError(reason?.message || 'Unable to load your local timetable.'),
    })
    return () => subscription.unsubscribe()
  }, [])

  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects])
  const mergedSlots = useMemo(() => {
    return DAYS.map((day) => ({
      ...day,
      slots: mergeAdjacentSlots(slots.filter((slot) => slot.day === day.value && slot.active !== false)),
    }))
  }, [slots])

  async function handleCreateSubject(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      const id = await createSubject(subjectForm)
      setSubjectForm({ code: '', name: '', professor: '', lectureRoom: '', labRoom: '' })
      setShowSubjectForm(false)
      setSlotForm((current) => ({ ...current, subjectId: String(id) }))
      setNotice('Subject saved on this device.')
    } catch (reason) {
      setError(reason.message)
    }
  }

  async function handleCreateSlot(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await createScheduleSlot({
        subjectId: slotForm.subjectId,
        day: slotForm.day,
        startMinutes: minutesFromTime(slotForm.start),
        endMinutes: minutesFromTime(slotForm.end),
        kind: slotForm.kind,
        room: slotForm.room,
      })
      setShowSlotForm(false)
      setSlotForm((current) => ({ ...current, room: '' }))
      setNotice('Class added to your weekly timetable.')
    } catch (reason) {
      setError(reason.message)
    }
  }

  async function handleDeleteSlot(ids) {
    if (!window.confirm('Remove this timetable block and all adjacent entries grouped into it?')) return
    await deleteScheduleSlots(ids)
    setNotice('Timetable block removed.')
  }

  async function handleDeleteSubject(subject) {
    if (!window.confirm(`Delete ${subject.code} and all of its timetable entries?`)) return
    await deleteSubject(subject.id)
    setNotice('Subject and its timetable entries removed.')
  }

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-3">
        <div><p className="text-sm text-slate-500">Your weekly classes</p><h2 className="mt-1 text-2xl font-bold text-slate-800">Schedule</h2><p className="mt-1 text-xs text-slate-500">Monday–Saturday · 7:00 AM–7:00 PM</p></div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-100 text-forest-700"><CalendarDays size={22} /></div>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">{notice}</p>}

      <section className="flex flex-wrap gap-2">
        <button onClick={() => { setShowSlotForm((value) => !value); setShowSubjectForm(false); setError('') }} className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} /> Add class</button>
        <button onClick={() => { setShowSubjectForm((value) => !value); setShowSlotForm(false); setError('') }} className="inline-flex items-center gap-2 rounded-xl border border-forest-200 bg-white px-4 py-2.5 text-sm font-semibold text-forest-800"><BookOpen size={16} /> Add subject</button>
      </section>

      {showSubjectForm && <form onSubmit={handleCreateSubject} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <h3 className="font-semibold text-slate-800">New subject</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Subject code"><input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} className={inputClass} placeholder="e.g. ITEC 80" /></Field>
          <Field label="Subject name"><input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} className={inputClass} placeholder="Human Computer Interaction" /></Field>
          <Field label="Professor"><input value={subjectForm.professor} onChange={(e) => setSubjectForm({ ...subjectForm, professor: e.target.value })} className={inputClass} placeholder="Optional" /></Field>
          <Field label="Lecture room"><input value={subjectForm.lectureRoom} onChange={(e) => setSubjectForm({ ...subjectForm, lectureRoom: e.target.value })} className={inputClass} placeholder="Room" /></Field>
          <Field label="Lab room"><input value={subjectForm.labRoom} onChange={(e) => setSubjectForm({ ...subjectForm, labRoom: e.target.value })} className={inputClass} placeholder="Room" /></Field>
        </div>
        <div className="flex gap-2"><button className="rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Save subject</button><button type="button" onClick={() => setShowSubjectForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancel</button></div>
      </form>}

      {showSlotForm && <form onSubmit={handleCreateSlot} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <h3 className="font-semibold text-slate-800">Add timetable entry</h3>
        {subjects.length === 0 ? <p className="text-sm text-slate-500">Create a subject first, then add its timetable entry.</p> : <>
          <Field label="Subject"><select required value={slotForm.subjectId} onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value, room: '' })} className={inputClass}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day"><select value={slotForm.day} onChange={(e) => setSlotForm({ ...slotForm, day: e.target.value })} className={inputClass}>{DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></Field>
            <Field label="Type"><select value={slotForm.kind} onChange={(e) => setSlotForm({ ...slotForm, kind: e.target.value, room: '' })} className={inputClass}><option>Lecture</option><option>Lab</option></select></Field>
            <Field label="Start time"><input type="time" required value={slotForm.start} onChange={(e) => setSlotForm({ ...slotForm, start: e.target.value })} className={inputClass} /></Field>
            <Field label="End time"><input type="time" required value={slotForm.end} onChange={(e) => setSlotForm({ ...slotForm, end: e.target.value })} className={inputClass} /></Field>
          </div>
          <Field label="Room"><input value={slotForm.room} onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })} className={inputClass} placeholder="Uses the subject's default room if blank" /></Field>
          <p className="text-xs text-slate-500">Overlapping entries on the same day are rejected. Existing timetable entries are never overwritten.</p>
          <div className="flex gap-2"><button className="rounded-xl bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Add to schedule</button><button type="button" onClick={() => setShowSlotForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Cancel</button></div>
        </>}
      </form>}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-100 p-4"><h3 className="font-semibold text-slate-800">Weekly timetable</h3><span className="text-xs text-slate-400">{slots.length} entries</span></div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[58px_repeat(6,minmax(90px,1fr))] border-b border-slate-100 bg-slate-50">
              <div className="p-2" />
              {DAYS.map((day) => <div key={day.value} className="border-l border-slate-100 p-2 text-center text-xs font-semibold text-slate-600">{day.short}</div>)}
            </div>
            <div className="grid grid-cols-[58px_repeat(6,minmax(90px,1fr))]">
              <div className="relative" style={{ height: (END_MINUTES - START_MINUTES) / 60 * HOUR_HEIGHT }}>
                {Array.from({ length: 12 }, (_, index) => <div key={index} className="absolute right-2 -translate-y-1/2 text-[10px] text-slate-400" style={{ top: index * HOUR_HEIGHT }}>{displayTime(START_MINUTES + index * 60)}</div>)}
              </div>
              {mergedSlots.map((day) => <div key={day.value} className="relative border-l border-slate-100" style={{ height: (END_MINUTES - START_MINUTES) / 60 * HOUR_HEIGHT }}>
                {Array.from({ length: 12 }, (_, index) => <div key={index} className="absolute inset-x-0 border-t border-slate-100" style={{ top: index * HOUR_HEIGHT }} />)}
                {day.slots.map((slot) => {
                  const subject = subjectById.get(slot.subjectId)
                  const top = (slot.startMinutes - START_MINUTES) / 60 * HOUR_HEIGHT
                  const height = Math.max(28, (slot.endMinutes - slot.startMinutes) / 60 * HOUR_HEIGHT - 3)
                  if (!subject || top < 0 || slot.endMinutes > END_MINUTES) return null
                  return <div key={slot.ids[0]} className="group absolute inset-x-1 overflow-hidden rounded-lg border border-forest-200 bg-forest-50 p-1.5 text-[10px] text-forest-900" style={{ top, height }}>
                    <p className="truncate font-bold">{subject.code}</p>
                    <p className="truncate">{slot.room || 'No room'} · {slot.kind}</p>
                    <p className="truncate opacity-70">{displayTime(slot.startMinutes)}–{displayTime(slot.endMinutes)}</p>
                    <button aria-label={`Remove ${subject.code} entry`} onClick={() => handleDeleteSlot(slot.ids)} className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600"><Trash2 size={11} /></button>
                  </div>
                })}
              </div>)}
            </div>
          </div>
        </div>
        <p className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400">Swipe horizontally to view all days. Time slots outside 7:00 AM–7:00 PM are saved but not shown in this timetable grid.</p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-800">Subjects</h3>
        {subjects.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">No subjects yet. Add your first subject to start building your timetable.</div> : subjects.map((subject) => (
          <div key={subject.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><BookOpen size={18} /></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{subject.code} · {subject.name}</p><p className="truncate text-xs text-slate-500">{subject.professor || 'Professor not set'} · Lec: {subject.lectureRoom || '—'} · Lab: {subject.labRoom || '—'}</p></div>
            <button aria-label={`Delete ${subject.code}`} onClick={() => handleDeleteSubject(subject)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>
      <div className="flex items-center gap-2 text-xs text-slate-400"><Clock3 size={14} /> Timetable is saved locally and works offline.</div>
    </div>
  )
}
