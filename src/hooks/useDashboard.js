import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { getDashboardSnapshot } from '../services/dashboard'

const emptySnapshot = {
  todaysClasses: [],
  todaysActivities: [],
  pendingTasks: [],
  pendingTaskCount: 0,
  overdueTaskCount: 0,
  availableBalance: 0,
  savingsTotal: 0,
}

export function useDashboard() {
  const [snapshot, setSnapshot] = useState(emptySnapshot)
  const [error, setError] = useState('')

  useEffect(() => {
    const subscription = liveQuery(() => getDashboardSnapshot()).subscribe({
      next: (value) => {
        setSnapshot(value)
        setError('')
      },
      error: (reason) => setError(reason?.message || 'Unable to read local dashboard data.'),
    })
    const refreshClockDependentData = () => {
      getDashboardSnapshot().then((value) => { setSnapshot(value); setError('') }).catch((reason) => setError(reason?.message || 'Unable to refresh local dashboard data.'))
    }
    const interval = setInterval(refreshClockDependentData, 60_000)
    return () => { subscription.unsubscribe(); clearInterval(interval) }
  }, [])

  return { ...snapshot, error }
}
