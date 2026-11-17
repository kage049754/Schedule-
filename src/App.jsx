import { NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { CalendarDays, Wallet, NotebookPen, CheckSquare, LayoutDashboard, Settings, Bell, Plus, GraduationCap } from 'lucide-react'

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
      <button aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-600 shadow-soft"><Bell size={19} /></button>
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

function Dashboard() {
  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-slate-500">Your day, organized.</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Daily overview</h2>
      </section>
      <section className="grid grid-cols-2 gap-3">
        <SummaryCard title="Today's classes" value="0" note="No classes added yet" icon={CalendarDays} />
        <SummaryCard title="Tasks to finish" value="0" note="Nothing pending yet" icon={CheckSquare} />
        <SummaryCard title="Money available" value="₱0.00" note="Add your allowance" icon={Wallet} />
        <SummaryCard title="Total savings" value="₱0.00" note="Start a savings goal" icon={GraduationCap} />
      </section>
      <section className="rounded-3xl bg-forest-800 p-5 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div><p className="text-sm text-forest-100">Get started</p><h3 className="mt-1 text-lg font-semibold">Set up your student life</h3></div>
          <Plus className="text-forest-100" />
        </div>
        <p className="mt-2 max-w-sm text-sm leading-6 text-forest-100">Add your classes, record your allowance, and create your first task. Your information stays on this device.</p>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Your modules</h3><span className="text-xs text-slate-400">Getting started</span></div>
        <div className="grid grid-cols-1 gap-3">
          {modules.map(({ title, detail, icon: Icon }) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><Icon size={19} /></div>
              <div><p className="font-semibold text-slate-800">{title}</p><p className="text-xs text-slate-500">{detail}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
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
        <Route path="/schedule" element={<Placeholder title="Schedule" detail="Your weekly class timetable, subjects, rooms, lecture and lab periods, and activities." icon={CalendarDays} />} />
        <Route path="/budget" element={<Placeholder title="Budget" detail="Record allowance, income, expenses, category limits, and savings goals." icon={Wallet} />} />
        <Route path="/notepad" element={<Placeholder title="Notepad" detail="Organize personal, lecture, and subject-linked notes." icon={NotebookPen} />} />
        <Route path="/tasks" element={<Placeholder title="Tasks" detail="Track assignments, deadlines, priorities, and checklists." icon={CheckSquare} />} />
        <Route path="/settings" element={<Placeholder title="Settings" detail="Manage your profile, modules, appearance, reminders, and local backups." icon={Settings} />} />
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