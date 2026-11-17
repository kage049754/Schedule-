import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { AlertCircle, CalendarCheck, Check, CheckSquare, ChevronDown, Plus, Trash2, X } from 'lucide-react'
import { db } from '../database/db'
import { addChecklistItem, deleteChecklistItem, deleteTask, saveTask, setChecklistCompleted, setTaskCompleted } from '../services/tasks'
import { filterTasks } from '../services/taskRules'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100'
const emptyForm = { title: '', description: '', subjectId: '', dueDate: '', priority: 'normal' }
function Field({ label, children }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label> }

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [checklists, setChecklists] = useState([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState('pending')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [checkText, setCheckText] = useState({})
  const [expanded, setExpanded] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [allTasks, allSubjects, allItems] = await Promise.all([db.tasks.toArray(), db.subjects.orderBy('code').toArray(), db.taskChecklist.toArray()])
      return { tasks: allTasks, subjects: allSubjects, checklists: allItems }
    }).subscribe({ next: (data) => { setTasks(data.tasks); setSubjects(data.subjects); setChecklists(data.checklists) }, error: (reason) => setError(reason?.message || 'Unable to load tasks.') })
    return () => sub.unsubscribe()
  }, [])

  const visible = useMemo(() => filterTasks(tasks, view, search, today), [tasks, view, search, today])
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject.code])), [subjects])
  const checklistMap = useMemo(() => {
    const map = new Map()
    for (const item of checklists) map.set(item.taskId, [...(map.get(item.taskId) || []), item])
    for (const items of map.values()) items.sort((a, b) => a.position - b.position)
    return map
  }, [checklists])

  function edit(task) {
    setEditingId(task.id); setForm({ title: task.title, description: task.description || '', subjectId: task.subjectId ? String(task.subjectId) : '', dueDate: task.dueDate || '', priority: task.priority || 'normal' }); setShowForm(true); setError('')
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try { await saveTask(form, editingId); setShowForm(false); setEditingId(null); setForm(emptyForm); setNotice(editingId ? 'Task updated.' : 'Task added.') }
    catch (reason) { setError(reason?.message || 'Unable to save task.') }
    finally { setBusy(false) }
  }

  async function toggleTask(task) {
    try { await setTaskCompleted(task.id, !task.completed); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to update task.') }
  }

  async function remove(task) {
    if (!window.confirm(`Delete "${task.title}" and its checklist?`)) return
    try { await deleteTask(task.id); setNotice('Task deleted.'); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to delete task.') }
  }

  async function addItem(task) {
    try { await addChecklistItem(task.id, checkText[task.id]); setCheckText((v) => ({ ...v, [task.id]: '' })); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to add checklist item.') }
  }

  const counts = { pending: tasks.filter((t) => !t.completed).length, overdue: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length, completed: tasks.filter((t) => t.completed).length }

  return <div className="space-y-5">
    <section className="flex items-start justify-between"><div><p className="text-sm text-slate-500">Assignments, deadlines, and checklists</p><h2 className="mt-1 text-2xl font-bold text-slate-800">Tasks</h2></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-100 text-forest-700"><CheckSquare size={22} /></div></section>
    <section className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Pending</p><p className="mt-1 text-lg font-bold text-slate-800">{counts.pending}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Overdue</p><p className="mt-1 text-lg font-bold text-red-600">{counts.overdue}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Completed</p><p className="mt-1 text-lg font-bold text-forest-700">{counts.completed}</p></div></section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">{notice}</p>}
    <button onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm((v) => !v); setError('') }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white"><Plus size={17} /> Add task</button>
    {showForm && <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">{editingId ? 'Edit task' : 'New task'}</h3><button type="button" onClick={() => setShowForm(false)} aria-label="Close task form"><X size={18} /></button></div>
      <Field label="Task or assignment"><input required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. Finish HCI reviewer" /></Field>
      <Field label="Description"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Instructions or details" /></Field>
      <Field label="Subject (optional)"><select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className={inputClass}><option value="">No subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Deadline"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} /></Field><Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></Field></div>
      <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save task'}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4">Cancel</button></div>
    </form>}
    <section className="space-y-3"><div className="relative"><input aria-label="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} placeholder="Search tasks" /></div>
      <div className="flex flex-wrap gap-2">{[['pending','Pending'],['overdue','Overdue'],['completed','Completed'],['all','All']].map(([v,label]) => <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${view === v ? 'bg-forest-700 text-white' : 'bg-white text-slate-600'}`}>{label}</button>)}</div>
      {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500"><CalendarCheck size={24} className="mx-auto mb-2 text-slate-300" />No tasks in this view.</div> : visible.map((task) => { const items = checklistMap.get(task.id) || []; const done = items.filter((x) => x.completed).length; return <article key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-start gap-3"><button aria-label={task.completed ? 'Mark task pending' : 'Mark task complete'} onClick={() => toggleTask(task)} className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full border ${task.completed ? 'border-forest-600 bg-forest-600 text-white' : 'border-slate-300 text-transparent'}`}><Check size={14} /></button><div className="min-w-0 flex-1"><button onClick={() => edit(task)} className="text-left"><p className={`font-semibold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.dueDate ? `Due ${task.dueDate}` : 'No deadline'}{task.subjectId && subjectMap.get(task.subjectId) ? ` · ${subjectMap.get(task.subjectId)}` : ''} · {task.priority} priority</p></button>{task.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>}</div><button aria-label="Delete task" onClick={() => remove(task)} className="rounded-lg p-2 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div>
      <div className="mt-3 border-t border-slate-100 pt-3"><button onClick={() => setExpanded((v) => ({ ...v, [task.id]: !v[task.id] }))} className="flex w-full items-center justify-between text-xs font-semibold text-slate-600"><span>Checklist · {done}/{items.length}</span><ChevronDown size={15} className={expanded[task.id] ? 'rotate-180' : ''} /></button>{expanded[task.id] && <div className="mt-3 space-y-2">{items.map((item) => <div key={item.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(item.completed)} onChange={(e) => setChecklistCompleted(item.id, e.target.checked)} /><span className={`flex-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span><button aria-label="Delete checklist item" onClick={() => deleteChecklistItem(item.id)} className="text-slate-400"><Trash2 size={13} /></button></div>)}<div className="flex gap-2"><input value={checkText[task.id] || ''} onChange={(e) => setCheckText((v) => ({ ...v, [task.id]: e.target.value }))} className={inputClass} placeholder="Add checklist item" /><button type="button" onClick={() => addItem(task)} className="rounded-xl bg-forest-50 px-3 text-forest-700"><Plus size={16} /></button></div></div>}</div>
    </article> })}
    </section>
    <p className="text-xs text-slate-400">Tasks and checklists are saved locally and work offline.</p>
  </div>
}
