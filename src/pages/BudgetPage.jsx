import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { Wallet, Plus, TrendingUp, TrendingDown, PiggyBank, Trash2, Target, Coins } from 'lucide-react'
import { db } from '../database/db'
import { formatPeso, toCentavos } from '../utils/money'
import { toLocalDateKey } from '../utils/dates'
import { addAllowance, addIncome, addExpense, addExpenseCategory, addSavingsGoal, addSavingsEntry, deleteMoneyRecord } from '../services/budget'
import CategoryLimits from './CategoryLimits'
import { calculateFinanceSummary } from '../services/dashboardRules'

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100'
const today = toLocalDateKey()

function Field({ label, children }) {
  return <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">{label}</span>{children}</label>
}

function MoneyCard({ label, amount, icon: Icon, note }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{label}</span><Icon size={17} className="text-forest-600" /></div><p className="mt-3 text-lg font-bold text-slate-800">{formatPeso(amount)}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div>
}

export default function BudgetPage() {
  const [data, setData] = useState({ allowances: [], income: [], expenses: [], categories: [], goals: [], entries: [] })
  const [form, setForm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [allowance, setAllowance] = useState({ amount: '', period: 'weekly' })
  const [income, setIncome] = useState({ amount: '', source: '', date: today })
  const [expense, setExpense] = useState({ amount: '', description: '', categoryId: '', date: today, newCategory: '' })
  const [goal, setGoal] = useState({ title: '', targetAmount: '' })
  const [saving, setSaving] = useState({ goalId: '', amount: '', type: 'deposit' })

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [allowances, incomes, expenses, categories, goals, entries] = await Promise.all([
        db.allowances.toArray(), db.income.toArray(), db.expenses.toArray(), db.categories.toArray(), db.savingsGoals.toArray(), db.savingsEntries.toArray(),
      ])
      return { allowances, income: incomes, expenses, categories: categories.filter((item) => item.type === 'expense' && item.active !== false), goals, entries }
    }).subscribe({ next: setData, error: (reason) => setError(reason?.message || 'Unable to load budget records.') })
    return () => sub.unsubscribe()
  }, [])

  const totals = useMemo(() => {
    const summary = calculateFinanceSummary({ allowances: data.allowances, income: data.income, expenses: data.expenses, savingsEntries: data.entries }, today)
    return { allowance: summary.allowanceTotal, income: summary.incomeTotal, expenses: summary.expenseTotal, balance: summary.availableBalance, saved: summary.savingsTotal }
  }, [data, today])

  const goalBalances = useMemo(() => new Map(data.goals.map((item) => [item.id, data.entries.filter((entry) => entry.goalId === item.id).reduce((sum, entry) => sum + (entry.type === 'withdrawal' ? -entry.amount : entry.amount), 0)])), [data])

  async function runAction(action, success) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(success); setForm('') }
    catch (reason) { setError(reason?.message || 'Unable to save this record.') }
    finally { setBusy(false) }
  }

  async function submitAllowance(event) {
    event.preventDefault()
    await runAction(() => addAllowance({ amount: toCentavos(allowance.amount), period: allowance.period }), 'Allowance saved for its selected period.')
    setAllowance((v) => ({ ...v, amount: '' }))
  }
  async function submitIncome(event) {
    event.preventDefault()
    await runAction(() => addIncome({ ...income, amount: toCentavos(income.amount) }), 'Income record added.')
    setIncome((v) => ({ ...v, amount: '', source: '' }))
  }
  async function submitExpense(event) {
    event.preventDefault()
    await runAction(async () => {
      let categoryId = expense.categoryId
      if (expense.newCategory.trim()) categoryId = await addExpenseCategory(expense.newCategory)
      await addExpense({ ...expense, amount: toCentavos(expense.amount), categoryId })
    }, 'Expense recorded.')
    setExpense((v) => ({ ...v, amount: '', description: '', newCategory: '' }))
  }
  async function submitGoal(event) {
    event.preventDefault()
    await runAction(() => addSavingsGoal({ ...goal, targetAmount: toCentavos(goal.targetAmount) }), 'Savings goal created.')
    setGoal({ title: '', targetAmount: '' })
  }
  async function submitSaving(event) {
    event.preventDefault()
    await runAction(() => addSavingsEntry({ ...saving, amount: toCentavos(saving.amount) }), saving.type === 'withdrawal' ? 'Savings withdrawal recorded.' : 'Savings contribution recorded.')
    setSaving((v) => ({ ...v, amount: '' }))
  }

  async function remove(table, id, label) {
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return
    await runAction(() => deleteMoneyRecord(table, id), `${label} deleted.`)
  }

  return <div className="space-y-5">
    <section className="flex items-start justify-between"><div><p className="text-sm text-slate-500">Allowance, spending, and goals</p><h2 className="mt-1 text-2xl font-bold text-slate-800">Budget</h2></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-100 text-forest-700"><Wallet size={22} /></div></section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">{notice}</p>}
    <section className="grid grid-cols-2 gap-3">
      <MoneyCard label="Available balance" amount={totals.balance} icon={Wallet} note="Active allowance + income − expenses" />
      <MoneyCard label="Allowance today" amount={totals.allowance} icon={Coins} note="Daily, weekly, or monthly plan" />
      <MoneyCard label="Total income" amount={totals.income} icon={TrendingUp} note="All recorded income" />
      <MoneyCard label="Total expenses" amount={totals.expenses} icon={TrendingDown} note="All recorded expenses" />
    </section>

    <CategoryLimits />
    <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800"><Plus size={17} /> Add a record</h3>
      <div className="grid grid-cols-2 gap-2">
        {['allowance','income','expense','goal','saving'].map((item) => <button key={item} type="button" onClick={() => { setForm(form === item ? '' : item); setError('') }} className={`rounded-xl px-3 py-2.5 text-sm font-semibold capitalize ${form === item ? 'bg-forest-700 text-white' : 'bg-forest-50 text-forest-800'}`}>{item === 'saving' ? 'Savings activity' : item === 'goal' ? 'Savings goal' : item}</button>)}
      </div>
      {form === 'allowance' && <form onSubmit={submitAllowance} className="mt-4 space-y-3"><Field label="Amount (PHP)"><input required min="0.01" step="0.01" type="number" value={allowance.amount} onChange={(e) => setAllowance({ ...allowance, amount: e.target.value })} className={inputClass} placeholder="e.g. 500" /></Field><Field label="Allowance period"><select className={inputClass} value={allowance.period} onChange={(e) => setAllowance({ ...allowance, period: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly (Monday–Sunday)</option><option value="monthly">Monthly</option></select></Field><button disabled={busy} className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white disabled:opacity-50">Save allowance</button></form>}
      {form === 'income' && <form onSubmit={submitIncome} className="mt-4 space-y-3"><Field label="Amount (PHP)"><input required min="0.01" step="0.01" type="number" value={income.amount} onChange={(e) => setIncome({ ...income, amount: e.target.value })} className={inputClass} /></Field><Field label="Source"><input required value={income.source} onChange={(e) => setIncome({ ...income, source: e.target.value })} className={inputClass} placeholder="Allowance, part-time work…" /></Field><Field label="Date"><input required type="date" value={income.date} onChange={(e) => setIncome({ ...income, date: e.target.value })} className={inputClass} /></Field><button disabled={busy} className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white">Add income</button></form>}
      {form === 'expense' && <form onSubmit={submitExpense} className="mt-4 space-y-3"><Field label="Amount (PHP)"><input required min="0.01" step="0.01" type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} className={inputClass} /></Field><Field label="What did you spend on?"><input required value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} className={inputClass} placeholder="Lunch, fare, school supplies…" /></Field><Field label="Category"><select className={inputClass} value={expense.categoryId} onChange={(e) => setExpense({ ...expense, categoryId: e.target.value, newCategory: '' })}><option value="">Uncategorized</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Or create category"><input value={expense.newCategory} onChange={(e) => setExpense({ ...expense, newCategory: e.target.value, categoryId: '' })} className={inputClass} placeholder="Transport, Food, School…" /></Field><Field label="Date"><input required type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} className={inputClass} /></Field><button disabled={busy} className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white">Save expense</button></form>}
      {form === 'goal' && <form onSubmit={submitGoal} className="mt-4 space-y-3"><Field label="Goal name"><input required value={goal.title} onChange={(e) => setGoal({ ...goal, title: e.target.value })} className={inputClass} placeholder="New laptop, emergency fund…" /></Field><Field label="Target amount (PHP)"><input required min="0.01" step="0.01" type="number" value={goal.targetAmount} onChange={(e) => setGoal({ ...goal, targetAmount: e.target.value })} className={inputClass} /></Field><button disabled={busy} className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white">Create goal</button></form>}
      {form === 'saving' && <form onSubmit={submitSaving} className="mt-4 space-y-3"><Field label="Savings goal"><select required value={saving.goalId} onChange={(e) => setSaving({ ...saving, goalId: e.target.value })} className={inputClass}><option value="">Choose a goal</option>{data.goals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="Action"><select value={saving.type} onChange={(e) => setSaving({ ...saving, type: e.target.value })} className={inputClass}><option value="deposit">Add savings</option><option value="withdrawal">Withdraw savings</option></select></Field><Field label="Amount (PHP)"><input required min="0.01" step="0.01" type="number" value={saving.amount} onChange={(e) => setSaving({ ...saving, amount: e.target.value })} className={inputClass} /></Field><button disabled={busy} className="w-full rounded-xl bg-forest-700 py-3 text-sm font-semibold text-white">Save activity</button></form>}
    </section>

    <section className="space-y-3"><h3 className="flex items-center gap-2 font-semibold text-slate-800"><Target size={18} /> Savings goals</h3>
      {data.goals.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">Create a goal to track progress toward something important.</p> : data.goals.map((item) => { const saved = goalBalances.get(item.id) || 0; const percent = Math.min(100, Math.round(saved / item.targetAmount * 100)); return <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-slate-800">{item.title}</p><p className="text-xs text-slate-500">{formatPeso(saved)} of {formatPeso(item.targetAmount)}</p></div><button aria-label={`Delete ${item.title}`} onClick={() => remove('savingsGoals', item.id, 'savings goal')} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-forest-600" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-right text-[11px] text-slate-500">{percent}% saved</p></div> })}
    </section>

    <section className="space-y-3"><h3 className="font-semibold text-slate-800">Recent transactions</h3>
      {[...data.expenses.map((item) => ({ ...item, kind: 'Expense', label: item.description || 'Expense', sign: -1, table: 'expenses' })), ...data.income.map((item) => ({ ...item, kind: 'Income', label: item.source, sign: 1, table: 'income' }))].sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,12).map((item) => <div key={`${item.table}-${item.id}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${item.sign > 0 ? 'bg-forest-50 text-forest-700' : 'bg-amber-50 text-amber-700'}`}>{item.sign > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.label}</p><p className="text-xs text-slate-400">{item.kind} · {item.date}</p></div><p className={`text-sm font-semibold ${item.sign > 0 ? 'text-forest-700' : 'text-slate-700'}`}>{item.sign > 0 ? '+' : '−'}{formatPeso(item.amount)}</p><button aria-label={`Delete ${item.label}`} onClick={() => remove(item.table, item.id, 'transaction')} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button></div>)}
      {data.expenses.length + data.income.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Income and expenses will appear here.</p>}
    </section>
    <p className="flex items-center gap-2 text-xs text-slate-400"><PiggyBank size={14} /> Amounts are stored as integer centavos on this device.</p>
  </div>
}
