import { useRef, useState } from 'react'
import { Download, Upload, ShieldCheck, Settings2 } from 'lucide-react'
import { exportLocalBackup, restoreLocalBackup } from '../services/backup'

export default function SettingsPage() {
  const fileInput = useRef(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

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
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700"><ShieldCheck size={19} /></div>
          <div><h3 className="font-semibold text-slate-800">Local data and privacy</h3><p className="text-xs text-slate-500">No account, cloud database, or sync is used.</p></div>
        </div>
        <p className="text-sm leading-6 text-slate-600">Your schedule, subjects, notes, tasks, and budget records are stored in this app on this device. Export a backup before changing or clearing app data.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
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
