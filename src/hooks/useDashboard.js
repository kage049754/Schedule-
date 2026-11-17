import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { getDashboardSnapshot } from '../services/dashboard'

const emptySnapshot = {
  todaysClasses: [],
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
    return () => subscription.unsubscribe()
  }, [])

  return { ...snapshot, error }
}
