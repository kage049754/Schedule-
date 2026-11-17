import { db } from '../database/db'

const BACKUP_FORMAT = 'schedule-local-backup'
const BACKUP_VERSION = 1

export async function exportLocalBackup() {
  const tables = {}
  for (const table of db.tables) tables[table.name] = await table.toArray()
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  }
}

export function validateBackup(payload) {
  if (!payload || payload.format !== BACKUP_FORMAT || payload.version !== BACKUP_VERSION) {
    throw new Error('This backup file is not supported by this version of Schedule.')
  }
  if (!payload.tables || typeof payload.tables !== 'object') {
    throw new Error('The backup file is missing its local data tables.')
  }
  for (const table of db.tables) {
    if (payload.tables[table.name] !== undefined && !Array.isArray(payload.tables[table.name])) {
      throw new Error(`Invalid data found in ${table.name}.`)
    }
  }
  return true
}

export async function restoreLocalBackup(payload) {
  validateBackup(payload)
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      const rows = payload.tables[table.name] || []
      await table.clear()
      if (rows.length) await table.bulkAdd(rows)
    }
  })
}
