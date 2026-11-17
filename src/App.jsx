import { NavLink, Route, Routes, Navigate, Link } from 'react-router-dom'
import { CalendarDays, Wallet, NotebookPen, CheckSquare, LayoutDashboard, Settings, Bell, Plus, GraduationCap, Clock, AlertCircle } from 'lucide-react'
import { useDashboard } from './hooks/useDashboard'
import { formatPeso } from './utils/money'
import SchedulePage from './pages/SchedulePage'
import SettingsPage from './pages/SettingsPage'
import BudgetPage from './pages/BudgetPage'
import NotepadPage from './pages/NotepadPage'
import TasksPage from './pages/TasksPage'

const navigation = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/notepad', label: 'Notes', icon: NotebookPen },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
]

const modules = [
  { title: 'Schedule', detail: 'Your classes and activities will appear here.', icon: CalendarDays },
  { title: 'Budget', detail: 'Track allowance, income, expenses, and savings.', icon: Wallet },
  { title: 'Notepad', detail: 'Keep personal, lecture, and subject notes together.', icon: NotebookPen },
  { title: 'Tasks', detail: 'Organize assignments, deadlines, and checklists.', icon: CheckSquare },
]

function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-700 text-white shadow-soft"><GraduationCap size={23} /></div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-forest-600">Student planner</p>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Schedule</h1>
        </div>
      </div>
      <Link to="/settings" aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-soft"><Settings size={19} /></Link>
    </header>
  )
}

function SummaryCard({ title, value, note, icon: Icon }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
    <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">{title}</span><Icon size={17} className="text-forest-600" /></div>
    <p className="mt-3 text-xl font-bold tracking-tight text-slate-800">{value}</p>
    <p className="mt-1 text-[11px] text-slate-400">{note}</p>
  </div>
}

function formatTime(minutes = 0) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return new Date(2000, 0, 1, hours, mins).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

function Dashboard() {
  const { todaysClasses, pendingTasks, pendingTaskCount, overdueTaskCount, availableBalance, savingsTotal, error } = useDashboard()
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-500">Your day, organized.</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Daily overview</h2>
      </section>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="grid grid-cols-2 gap-3">
        <SummaryCard title="Today's classes" value={String(todaysClasses.length)} note="Scheduled for today" icon={CalendarDays} />
        <SummaryCard title="Tasks to finish" value={String(pendingTaskCount)} note={overdueTaskCount ? `${overdueTaskCount} overdue` : 'Pending assignments'} icon={CheckSquare} />
        <SummaryCard title="Money available" value={formatPeso(availableBalance)} note="Allowance + income − expenses" icon={Wallet} />
        <SummaryCard title="Total savings" value={formatPeso(savingsTotal)} note="Across all savings goals" icon={GraduationCap} />
      </section>
      <section className="rounded-3xl bg-forest-800 p-5 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-forest-100">Your day</p><h3 className="mt-1 text-lg font-semibold">Academic and money overview</h3></div>
          <Plus className="text-forest-100" />
        </div>
        <p className="mt-2 max-w-sm text-sm leading-6 text-forest-100">Dashboard totals update from your on-device records. No account or internet connection is required.</p>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Today's classes</h3><Link to="/schedule" className="text-xs font-semibold text-forest-700">Open schedule</Link></div>
        {todaysClasses.length === 0 ? <EmptyRow text="No classes scheduled for today." /> : todaysClasses.map((slot) => (
          <div key={slot.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><Clock size={18} /></div>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{slot.subject?.code || slot.subject?.name || 'Class'}</p><p className="text-xs text-slate-500">{slot.room || 'Room not set'} · {slot.kind || 'Class'}</p></div>
            <span className="text-right text-xs font-medium text-slate-500">{formatTime(slot.startMinutes)}–{formatTime(slot.endMinutes)}</span>
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Tasks to finish</h3><Link to="/tasks" className="text-xs font-semibold text-forest-700">Open tasks</Link></div>
        {pendingTasks.length === 0 ? <EmptyRow text="No pending tasks. Add an assignment when ready." /> : pendingTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><AlertCircle size={17} /></div>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-800">{task.title}</p><p className="text-xs text-slate-500">{task.dueDate ? `Due ${task.dueDate}` : 'No due date'} · {task.priority || 'Normal'} priority</p></div>
          </div>
        ))}
      </section>
    </div>
  )
}

function EmptyRow({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">{text}</div>
}

function Placeholder({ title, detail, icon: Icon }) {
  return <div className="rounded-3xl border border-dashed border-forest-200 bg-white p-8 text-center">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-forest-50 text-forest-700"><Icon size={25} /></div>
    <h2 className="mt-4 text-xl font-bold text-slate-800">{title}</h2>
    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{detail}</p>
    <p className="mt-5 text-xs font-medium text-forest-700">Planned for the next development phases</p>
  </div>
}

export default function App() {
  return <div className="mx-auto min-h-screen max-w-xl bg-cream px-5 pb-28 pt-5 safe-top">
    <Header />
    <main className="mt-7">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/notepad" element={<NotepadPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
    <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto grid max-w-xl grid-cols-5 border-t border-slate-100 bg-white/95 px-2 pb-[max(.7rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      {navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-medium transition ${isActive ? 'text-forest-700' : 'text-slate-400'}`}>
        {({ isActive }) => <><Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} /><span>{label}</span></>}
      </NavLink>)}
    </nav>
  </div>
}