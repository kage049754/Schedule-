import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { Archive, BookOpen, FileText, Pin, Plus, Search, Trash2, X } from 'lucide-react'
import { db } from '../database/db'
import { deleteNote, filterNotes, saveNote, setNoteArchived, setNotePinned } from '../services/notes'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100'
function Field({ label, children }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label> }

const emptyForm = { title: '', content: '', kind: 'personal', subjectId: '', pinned: false }

export default function NotepadPage() {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('all')
  const [archived, setArchived] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [allNotes, allSubjects] = await Promise.all([db.notes.toArray(), db.subjects.orderBy('code').toArray()])
      return { notes: allNotes, subjects: allSubjects }
    }).subscribe({ next: (data) => { setNotes(data.notes); setSubjects(data.subjects) }, error: (reason) => setError(reason?.message || 'Unable to load notes.') })
    return () => sub.unsubscribe()
  }, [])

  const visibleNotes = useMemo(() => filterNotes(notes, search, kind, archived), [notes, search, kind, archived])
  const subjectNames = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject.code])), [subjects])

  function startNew() { setEditingId(null); setForm(emptyForm); setShowForm(true); setError(''); setNotice('') }
  function startEdit(note) {
    setEditingId(note.id)
    setForm({ title: note.title, content: note.content, kind: note.kind || 'personal', subjectId: note.subjectId ? String(note.subjectId) : '', pinned: Boolean(note.pinned) })
    setShowForm(true); setError(''); setNotice('')
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await saveNote({ ...form, subjectId: form.kind === 'subject' ? form.subjectId : '' }, editingId)
      setShowForm(false); setEditingId(null); setForm(emptyForm); setNotice(editingId ? 'Note updated.' : 'Note saved on this device.')
    } catch (reason) { setError(reason?.message || 'Unable to save note.') }
    finally { setBusy(false) }
  }

  async function remove(note) {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return
    try { await deleteNote(note.id); setNotice('Note deleted.'); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to delete note.') }
  }

  async function archiveNote(note) {
    try { await setNoteArchived(note.id, !note.archived); setNotice(note.archived ? 'Note restored.' : 'Note archived.'); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to update note.') }
  }

  async function pinNote(note) {
    try { await setNotePinned(note.id, !note.pinned); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to pin note.') }
  }

  return <div className="space-y-5">
    <section className="flex items-start justify-between"><div><p className="text-sm text-slate-500">Personal, lecture, and subject notes</p><h2 className="mt-1 text-2xl font-bold text-slate-800">Notepad</h2></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-100 text-forest-700"><FileText size={22} /></div></section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">{notice}</p>}
    <button onClick={startNew} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white"><Plus size={17} /> New note</button>

    {showForm && <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">{editingId ? 'Edit note' : 'New note'}</h3><button type="button" aria-label="Close note editor" onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-400"><X size={18} /></button></div>
      <Field label="Title"><input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Note title" /></Field>
      <Field label="Type"><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value, subjectId: '' })} className={inputClass}><option value="personal">Personal</option><option value="lecture">Lecture</option><option value="subject">Subject-linked</option></select></Field>
      {form.kind === 'subject' && <Field label="Subject"><select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className={inputClass}><option value="">Choose a subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} — {subject.name}</option>)}</select></Field>}
      <Field label="Note"><textarea required rows={7} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className={inputClass} placeholder="Write your notes here…" /></Field>
      <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin this note</label>
      <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save note'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">Cancel</button></div>
    </form>}

    <section className="space-y-3">
      <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass + ' pl-9'} placeholder="Search titles and note text" /></div>
      <div className="flex flex-wrap gap-2">{[['all','All'],['personal','Personal'],['lecture','Lecture'],['subject','Subject']].map(([value,label]) => <button key={value} onClick={() => setKind(value)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${kind === value ? 'bg-forest-700 text-white' : 'bg-white text-slate-600'}`}>{label}</button>)}<button onClick={() => setArchived((value) => !value)} className={`ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${archived ? 'bg-forest-700 text-white' : 'bg-white text-slate-600'}`}><Archive size={13} /> {archived ? 'Archived' : 'Archive'}</button></div>
      {visibleNotes.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center"><BookOpen size={24} className="mx-auto text-slate-300" /><p className="mt-2 text-sm text-slate-500">{archived ? 'No archived notes.' : search ? 'No notes match your search.' : 'Your notes will appear here.'}</p></div> : visibleNotes.map((note) => <article key={note.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-start gap-2"><button onClick={() => startEdit(note)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-800">{note.title}</h3>{note.pinned && <Pin size={13} className="text-forest-700" />}</div><p className="mt-1 text-[11px] uppercase tracking-wide text-forest-700">{note.kind || 'personal'}{note.subjectId && subjectNames.get(note.subjectId) ? ' · ' + subjectNames.get(note.subjectId) : ''}</p></button><button aria-label={note.pinned ? 'Unpin note' : 'Pin note'} onClick={() => pinNote(note)} className="rounded-lg p-2 text-slate-400"><Pin size={15} /></button><button aria-label={note.archived ? 'Restore note' : 'Archive note'} onClick={() => archiveNote(note)} className="rounded-lg p-2 text-slate-400"><Archive size={15} /></button><button aria-label="Delete note" onClick={() => remove(note)} className="rounded-lg p-2 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div><button onClick={() => startEdit(note)} className="mt-3 block w-full whitespace-pre-wrap break-words text-left text-sm leading-6 text-slate-600">{note.content}</button><p className="mt-3 text-[10px] text-slate-400">Updated {note.updatedAt ? new Date(note.updatedAt).toLocaleString() : 'recently'}</p></article>)}
    </section>
    <p className="text-xs text-slate-400">Notes are stored locally on this device and remain available offline.</p>
  </div>
}
