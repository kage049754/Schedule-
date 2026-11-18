import { useEffect, useRef, useState } from 'react'
import { Download, Upload, ShieldCheck, Settings2 } from 'lucide-react'
import { exportLocalBackup, restoreLocalBackup } from '../services/backup'
import { checkExactAlarmAccess, getReminderSettings, openExactAlarmSettings, requestReminderPermission, saveReminderSettings, sendTestReminder } from '../services/reminders'
import { getLocalProfile, saveLocalProfile } from '../services/profile'
import { getModulePreferences, saveModulePreferences, MODULE_LABELS } from '../services/modulePreferences'

export default function SettingsPage() {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [reminders, setReminders] = useState({ classesEnabled: true, activitiesEnabled: true, tasksEnabled: true, leadMinutes: 10, taskLeadDays: 0, taskReminderTime: '08:00', vibrationEnabled: true, soundEnabled: true })
  const [exactAlarm, setExactAlarm] = useState('unknown')
  const [reminderBusy, setReminderBusy] = useState(false)
  const [profile, setProfile] = useState({ displayName: '', program: '', yearSection: '' })
  const [profileBusy, setProfileBusy] = useState(false)
  const [modulePreferences, setModulePreferences] = useState({ order: ['dashboard', 'schedule', 'budget', 'notepad', 'tasks'], hidden: [] })
  const [moduleBusy, setModuleBusy] = useState(false)

  useEffect(() => {
    getLocalProfile().then(setProfile).catch((reason) => setError(reason?.message || 'Unable to load your profile.'))
    getModulePreferences().then(setModulePreferences).catch((reason) => setError(reason?.message || 'Unable to load module preferences.'))
    getReminderSettings().then(setReminders).catch((reason) => setError(reason?.message || 'Unable to load reminder settings.'))
    checkExactAlarmAccess().then((value) => setExactAlarm(value.exact_alarm || 'unsupported')).catch(() => setExactAlarm('unknown'))
  }, [])


  async function handleSaveProfile(event) {
    event.preventDefault(); setProfileBusy(true); setError(''); setNotice('')
    try {
      const saved = await saveLocalProfile(profile)
      setProfile(saved)
      setNotice('Profile saved on this device. Dashboard greeting updated.')
    } catch (reason) { setError(reason?.message || 'Unable to save your profile.') }
    finally { setProfileBusy(false) }
  }


  function moveModule(id, direction) {
    setModulePreferences((current) => {
      const order = [...current.order]
      const index = order.indexOf(id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current
      ;[order[index], order[nextIndex]] = [order[nextIndex], order[index]]
      return { ...current, order }
    })
  }

  function toggleModule(id, visible) {
    if (id === 'dashboard') return
    setModulePreferences((current) => ({
      ...current,
      hidden: visible ? current.hidden.filter((item) => item !== id) : [...new Set([...current.hidden, id])],
    }))
  }

  async function handleSaveModules() {
    setModuleBusy(true); setError(''); setNotice('')
    try {
      const saved = await saveModulePreferences(modulePreferences)
      setModulePreferences(saved)
      setNotice('Bottom navigation preferences saved.')
    } catch (reason) { setError(reason?.message || 'Unable to save module preferences.') }
    finally { setModuleBusy(false) }
  }

  async function handleSaveReminders() {
    setReminderBusy(true); setError(''); setNotice('')
    try {
      let permissionNotice = ''
      if (reminders.classesEnabled || reminders.activitiesEnabled || reminders.tasksEnabled) {
        const permission = await requestReminderPermission()
        if (permission.display !== 'granted' && permission.display !== 'unsupported') permissionNotice = 'Preferences saved, but Android notification permission is disabled. Enable it in app settings to receive alerts.'
      }
      await saveReminderSettings(reminders)
      setNotice(permissionNotice || 'Reminder settings saved. Pending class, activity, and deadline alerts were refreshed.')
      const exact = await checkExactAlarmAccess()
      setExactAlarm(exact.exact_alarm || 'unsupported')
    } catch (reason) { setError(reason?.message || 'Unable to save reminder settings.') }
    finally { setReminderBusy(false) }
  }

  async function handleTestReminder() {
    setReminderBusy(true); setError(''); setNotice('')
    try { await sendTestReminder(reminders.vibrationEnabled, reminders.soundEnabled !== false); setNotice('Test alert scheduled for five seconds from now.') }
    catch (reason) { setError(reason?.message || 'Unable to schedule a test alert.') }
    finally { setReminderBusy(false) }
  }

  async function handleExactAlarm() {
    try { await openExactAlarmSettings(); const exact = await checkExactAlarmAccess(); setExactAlarm(exact.exact_alarm || 'unsupported') }
    catch (reason) { setError(reason?.message || 'Unable to open exact alarm settings.') }
  }

  async function handleExport() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const backup = await exportLocalBackup()
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `schedule-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Backup prepared. Keep the JSON file somewhere safe.')
    } catch (reason) {
      setError(reason?.message || 'Unable to create a backup.')
    } finally {
      setBusy(false)
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setNotice('')
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Choose a Schedule JSON backup file.')
      event.target.value = ''
      return
    }
    if (!window.confirm('Restore this backup? All current Schedule data on this device will be replaced.')) {
      event.target.value = ''
      return
    }

    setBusy(true)
    try {
      const payload = JSON.parse(await file.text())
      await restoreLocalBackup(payload)
      setNotice('Backup restored successfully. Reloading your local data…')
      window.location.reload()
    } catch (reason) {
      setError(reason instanceof SyntaxError ? 'The selected file is not valid JSON.' : reason?.message || 'Unable to restore this backup.')
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm text-slate-500">Your data stays on this device</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Settings</h2>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-forest-50 p-3 text-sm text-forest-800">{notice}</p>}

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div><h3 className="font-semibold text-slate-800">Local profile</h3><p className="mt-1 text-xs text-slate-500">Optional details stored only on this device. No account or sign-in is created.</p></div>
        <form onSubmit={handleSaveProfile} className="space-y-3">
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Display name</span><input maxLength={60} value={profile.displayName || ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="Name shown on the Dashboard" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Program</span><input maxLength={80} value={profile.program || ''} onChange={(e) => setProfile({ ...profile, program: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="e.g. BS Information Technology" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Year and section</span><input maxLength={60} value={profile.yearSection || ''} onChange={(e) => setProfile({ ...profile, yearSection: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="e.g. 2nd Year · Section 2-6" /></label>
          <button disabled={profileBusy} className="w-full rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{profileBusy ? 'Saving…' : 'Save profile'}</button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div><h3 className="font-semibold text-slate-800">Bottom navigation</h3><p className="mt-1 text-xs text-slate-500">Choose which modules appear and change their order. Dashboard stays available. Hidden modules remain accessible from saved routes and Dashboard links.</p></div>
        <div className="space-y-2">
          {modulePreferences.order.map((id, index) => <div key={id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-700">{MODULE_LABELS[id]}</p><label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={!modulePreferences.hidden.includes(id)} disabled={id === 'dashboard'} onChange={(e) => toggleModule(id, e.target.checked)} /> Show in navigation</label></div>
            <button type="button" disabled={index === 0} onClick={() => moveModule(id, -1)} aria-label={`Move ${MODULE_LABELS[id]} up`} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:opacity-30">Up</button>
            <button type="button" disabled={index === modulePreferences.order.length - 1} onClick={() => moveModule(id, 1)} aria-label={`Move ${MODULE_LABELS[id]} down`} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs disabled:opacity-30">Down</button>
          </div>)}
        </div>
        <button type="button" disabled={moduleBusy} onClick={handleSaveModules} className="w-full rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{moduleBusy ? 'Saving…' : 'Save navigation'}</button>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><ShieldCheck size={19} /></div>
          <div><h3 className="font-semibold text-slate-800">Local data and privacy</h3><p className="text-xs text-slate-500">No account, cloud database, or sync is used.</p></div>
        </div>
        <p className="text-sm leading-6 text-slate-600">Your schedule, subjects, notes, tasks, and budget records are stored in this app on this device. Export a backup before changing or clearing app data.</p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div><h3 className="font-semibold text-slate-800">Notifications and reminders</h3><p className="mt-1 text-xs leading-5 text-slate-500">Local alerts are scheduled on this device. Android notification permission and battery settings can affect delivery.</p></div>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700"><span><strong className="block">Upcoming classes</strong><span className="text-xs text-slate-400">Alert before each class</span></span><input type="checkbox" checked={reminders.classesEnabled} onChange={(e) => setReminders({ ...reminders, classesEnabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700"><span><strong className="block">Personal activities</strong><span className="text-xs text-slate-400">Alert before weekly activities too</span></span><input type="checkbox" checked={reminders.activitiesEnabled !== false} onChange={(e) => setReminders({ ...reminders, activitiesEnabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700"><span><strong className="block">Task deadlines</strong><span className="text-xs text-slate-400">Alert before or on the due date</span></span><input type="checkbox" checked={reminders.tasksEnabled} onChange={(e) => setReminders({ ...reminders, tasksEnabled: e.target.checked })} /></label>
        <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Class reminder lead time</span><select value={reminders.leadMinutes} onChange={(e) => setReminders({ ...reminders, leadMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value={0}>At class start</option><option value={5}>5 minutes before</option><option value={10}>10 minutes before</option><option value={15}>15 minutes before</option><option value={30}>30 minutes before</option><option value={60}>1 hour before</option></select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Deadline alert timing</span><select value={reminders.taskLeadDays ?? 0} onChange={(e) => setReminders({ ...reminders, taskLeadDays: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value={0}>On due date</option><option value={1}>1 day before</option><option value={2}>2 days before</option><option value={3}>3 days before</option><option value={7}>7 days before</option></select></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-slate-600">Deadline alert time</span><input type="time" value={reminders.taskReminderTime || '08:00'} onChange={(e) => setReminders({ ...reminders, taskReminderTime: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" /></label>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700"><span><strong className="block">Notification sound</strong><span className="text-xs text-slate-400">Play the bundled Schedule chime</span></span><input type="checkbox" checked={reminders.soundEnabled !== false} onChange={(e) => setReminders({ ...reminders, soundEnabled: e.target.checked })} /></label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-700"><span><strong className="block">Vibration</strong><span className="text-xs text-slate-400">Use Android reminder-channel vibration</span></span><input type="checkbox" checked={reminders.vibrationEnabled} onChange={(e) => setReminders({ ...reminders, vibrationEnabled: e.target.checked })} /></label>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Exact alarm access: <strong className="capitalize text-slate-700">{exactAlarm.replaceAll('-', ' ')}</strong>. Android may deliver inexact reminders if exact-alarm access is unavailable. Do Not Disturb and manufacturer battery controls can also suppress alerts.</div>
        <button type="button" disabled={reminderBusy} onClick={handleSaveReminders} className="w-full rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{reminderBusy ? 'Saving…' : 'Save reminder settings'}</button>
        <div className="grid grid-cols-2 gap-2"><button type="button" disabled={reminderBusy} onClick={handleTestReminder} className="rounded-xl border border-forest-200 px-3 py-2.5 text-xs font-semibold text-forest-800">Test notification</button><button type="button" onClick={handleExactAlarm} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700">Exact alarm access</button></div>
      </section>

        <div className="flex items-center gap-3"><Settings2 size={19} className="text-forest-700" /><h3 className="font-semibold text-slate-800">Backup and restore</h3></div>
        <p className="text-sm text-slate-500">Export all local tables into one JSON file. Restore replaces the current local records with the contents of the selected backup.</p>
        <button type="button" disabled={busy} onClick={handleExport} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Download size={17} /> Export local backup</button>
        <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest-200 bg-white px-4 py-3 text-sm font-semibold text-forest-800 disabled:opacity-50"><Upload size={17} /> Restore from backup</button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
        {busy && <p role="status" className="text-center text-xs text-slate-500">Processing local data…</p>}
      </section>
    </div>
  )
}
