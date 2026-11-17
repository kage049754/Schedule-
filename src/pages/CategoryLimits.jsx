import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { AlertTriangle, Gauge, Plus, Trash2 } from 'lucide-react'
import { db } from '../database/db'
import { deleteCategoryLimit, saveCategoryLimit } from '../services/budget'
import { calculateCategoryUsage } from '../services/budgetRules'
import { toCentavos, formatPeso } from '../utils/money'
import { toLocalDateKey } from '../utils/dates'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100'
const today = toLocalDateKey()
function Field({ label, children }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label> }

export default function CategoryLimits() {
  const [rows, setRows] = useState({ categories: [], limits: [], expenses: [] })
  const [form, setForm] = useState({ categoryId: '', amount: '', period: 'weekly' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [categories, limits, expenses] = await Promise.all([db.categories.toArray(), db.categoryBudgets.toArray(), db.expenses.toArray()])
      return { categories: categories.filter((x) => x.type === 'expense' && x.active !== false), limits, expenses }
    }).subscribe({ next: setRows, error: (reason) => setError(reason?.message || 'Unable to load category limits.') })
    return () => sub.unsubscribe()
  }, [])

  const active = useMemo(() => rows.limits.filter((limit) => limit.startDate <= today && limit.endDate >= today).map((limit) => {
    const expenses = rows.expenses.filter((item) => item.categoryId === limit.categoryId && item.date >= limit.startDate && item.date <= limit.endDate)
    const usage = calculateCategoryUsage(limit.amount, expenses)
    return { ...limit, ...usage, category: rows.categories.find((item) => item.id === limit.categoryId) }
  }).filter((item) => item.category), [rows])

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      await saveCategoryLimit({ ...form, amount: toCentavos(form.amount) })
      setForm((v) => ({ ...v, amount: '' })); setNotice('Category limit saved for the selected period.')
    } catch (reason) { setError(reason?.message || 'Unable to save category limit.') }
    finally { setBusy(false) }
  }

  async function remove(id) {
    if (!window.confirm('Delete this category limit?')) return
    try { await deleteCategoryLimit(id); setNotice('Category limit deleted.'); setError('') }
    catch (reason) { setError(reason?.message || 'Unable to delete category limit.') }
  }

  return <section className="space-y-3">
    <div className="flex items-center gap-2"><Gauge size={18} className="text-forest-700" /><h3 className="font-semibold text-slate-800">Category spending limits</h3></div>
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Expense category"><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}><option value="">Choose category</option>{rows.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Limit (PHP)"><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="e.g. 1000" /></Field><Field label="Period"><select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={inputClass}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field></div>
        <button disabled={busy || rows.categories.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus size={16} /> Save spending limit</button>
        {rows.categories.length === 0 && <p className="text-xs text-slate-500">Create an expense category when recording an expense first.</p>}
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-forest-700">{notice}</p>}
    </div>
    {active.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">No active category limits. Set a limit to monitor spending.</p> : active.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-800">{item.category.name} · {item.period}</p><p className="mt-1 text-xs text-slate-500">{formatPeso(item.spent)} spent of {formatPeso(item.amount)}</p></div><button aria-label={`Delete ${item.category.name} limit`} onClick={() => remove(item.id)} className="rounded-lg p-2 text-slate-400 hover:text-red-600"><Trash2 size={15} /></button></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.exceeded ? 'bg-red-500' : 'bg-forest-600'}`} style={{ width: `${item.percent}%` }} /></div><p className={`mt-2 flex items-center gap-1 text-xs ${item.exceeded ? 'text-red-600' : 'text-slate-500'}`}>{item.exceeded && <AlertTriangle size={13} />}{item.exceeded ? `Over by ${formatPeso(-item.remaining)}` : `${formatPeso(item.remaining)} remaining`}</p></div>)}
  </section>
}
