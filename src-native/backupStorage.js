import { getDatabase } from './database.js';
import {
  NATIVE_BACKUP_TABLES,
  createLegacyBackup,
  normalizeLegacyBackup,
} from './backup.js';

const IMPORT_ORDER = [
  'profile', 'categories', 'subjects', 'scheduleSlots', 'activities',
  'allowances', 'income', 'expenses', 'savingsGoals', 'savingsEntries',
  'categoryBudgets', 'notes', 'tasks', 'taskChecklist', 'settings',
];

export async function exportNativeBackup() {
  const database = await getDatabase();
  const tables = {};
  for (const tableName of IMPORT_ORDER) {
    tables[tableName] = await database.getAllAsync(`SELECT * FROM "${tableName}"`);
  }
  return createLegacyBackup(tables);
}

export async function restoreNativeBackup(payload) {
  const normalized = normalizeLegacyBackup(payload);
  const database = await getDatabase();

  await database.withTransactionAsync(async () => {
    for (const tableName of IMPORT_ORDER) {
      await database.runAsync(`DELETE FROM "${tableName}"`);
    }

    for (const tableName of IMPORT_ORDER) {
      const columnsAllowed = NATIVE_BACKUP_TABLES[tableName];
      for (const row of normalized[tableName]) {
        const columns = columnsAllowed.filter((column) => Object.prototype.hasOwnProperty.call(row, column));
        if (!columns.length) continue;
        const quotedColumns = columns.map((column) => `"${column}"`).join(', ');
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map((column) => row[column] ?? null);
        await database.runAsync(
          `INSERT INTO "${tableName}" (${quotedColumns}) VALUES (${placeholders})`,
          ...values,
        );
      }
    }

    if (!normalized.profile.length) {
      await database.runAsync(
        'INSERT INTO profile (id, displayName, program, yearSection, updatedAt) VALUES (?, ?, ?, ?, ?)',
        'local', '', '', '', new Date().toISOString(),
      );
    }
  });

  return Object.values(normalized).reduce((sum, rows) => sum + rows.length, 0);
}
