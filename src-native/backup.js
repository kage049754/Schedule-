export const LEGACY_BACKUP_FORMAT = 'schedule-local-backup';
export const LEGACY_BACKUP_VERSION = 1;

// Keep this allow-list explicit: imported JSON must never become SQL identifiers.
export const NATIVE_BACKUP_TABLES = {
  profile: ['id', 'displayName', 'program', 'yearSection', 'updatedAt'],
  subjects: ['id', 'code', 'name', 'professor', 'lectureRoom', 'labRoom', 'color', 'createdAt'],
  scheduleSlots: ['id', 'subjectId', 'day', 'startMinutes', 'endMinutes', 'kind', 'room', 'active', 'createdAt'],
  activities: ['id', 'title', 'day', 'startMinutes', 'endMinutes', 'date', 'location', 'notes', 'createdAt'],
  allowances: ['id', 'amount', 'period', 'startDate', 'endDate', 'createdAt'],
  income: ['id', 'amount', 'source', 'date', 'createdAt'],
  expenses: ['id', 'amount', 'description', 'categoryId', 'date', 'createdAt'],
  categories: ['id', 'name', 'type', 'active'],
  savingsGoals: ['id', 'title', 'targetAmount', 'createdAt'],
  savingsEntries: ['id', 'goalId', 'amount', 'type', 'date'],
  categoryBudgets: ['id', 'categoryId', 'amount', 'period', 'startDate', 'endDate'],
  notes: ['id', 'title', 'content', 'subjectId', 'kind', 'updatedAt', 'archived', 'pinned'],
  tasks: ['id', 'title', 'description', 'subjectId', 'dueDate', 'priority', 'completed', 'createdAt', 'updatedAt'],
  taskChecklist: ['id', 'taskId', 'text', 'position', 'completed'],
  settings: ['key', 'value', 'updatedAt'],
};

const REQUIRED_FIELDS = {
  profile: ['id'],
  subjects: ['code', 'name'],
  scheduleSlots: ['subjectId', 'day', 'startMinutes', 'endMinutes', 'kind'],
  activities: ['title', 'day', 'startMinutes', 'endMinutes'],
  allowances: ['amount', 'period', 'startDate', 'endDate'],
  income: ['amount', 'source', 'date'],
  expenses: ['amount', 'description', 'date'],
  categories: ['name', 'type'],
  savingsGoals: ['title', 'targetAmount'],
  savingsEntries: ['goalId', 'amount', 'type', 'date'],
  categoryBudgets: ['categoryId', 'amount', 'period', 'startDate', 'endDate'],
  notes: ['title', 'content'],
  tasks: ['title'],
  taskChecklist: ['taskId', 'text'],
  settings: ['key'],
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export function validateLegacyBackup(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
      || payload.format !== LEGACY_BACKUP_FORMAT || payload.version !== LEGACY_BACKUP_VERSION) {
    throw new Error('Unsupported backup. Select a Schedule local backup (version 1).');
  }
  if (!payload.tables || typeof payload.tables !== 'object' || Array.isArray(payload.tables)) {
    throw new Error('The backup is missing its tables object.');
  }

  let totalRows = 0;
  for (const [tableName, rows] of Object.entries(payload.tables)) {
    if (!hasOwn(NATIVE_BACKUP_TABLES, tableName)) continue;
    if (!Array.isArray(rows)) throw new Error(`Invalid data found in ${tableName}.`);
    totalRows += rows.length;
    const required = REQUIRED_FIELDS[tableName] || [];
    const seenIds = new Set();
    for (const [index, row] of rows.entries()) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`Invalid row ${index + 1} in ${tableName}.`);
      }
      for (const field of required) {
        if (!hasOwn(row, field) || row[field] === null || row[field] === '') {
          throw new Error(`Missing ${field} in ${tableName} row ${index + 1}.`);
        }
      }
      const key = row.id ?? row.key;
      if (key !== undefined) {
        if (seenIds.has(String(key))) throw new Error(`Duplicate record ID in ${tableName}.`);
        seenIds.add(String(key));
      }
    }
  }
  if (totalRows === 0) throw new Error('The backup contains no planner records; nothing was imported.');
  return true;
}

export function normalizeLegacyBackup(payload) {
  validateLegacyBackup(payload);
  const normalized = {};
  for (const [tableName, columns] of Object.entries(NATIVE_BACKUP_TABLES)) {
    const rows = payload.tables[tableName] || [];
    normalized[tableName] = rows.map((source) => {
      const row = {};
      for (const column of columns) {
        if (hasOwn(source, column)) row[column] = source[column];
      }
      if (tableName === 'activities' && row.day === undefined && row.date) {
        row.day = new Date(`${row.date}T00:00:00`).getDay();
      }
      if (tableName === 'profile' && !row.id) row.id = 'local';
      if (tableName === 'scheduleSlots' && row.active === undefined) row.active = 1;
      if (tableName === 'categories' && row.active === undefined) row.active = 1;
      if (tableName === 'notes') {
        if (row.kind === undefined) row.kind = 'personal';
        if (row.archived === undefined) row.archived = 0;
        if (row.pinned === undefined) row.pinned = 0;
      }
      if (tableName === 'tasks') {
        if (row.priority === undefined) row.priority = 'Normal';
        if (row.completed === undefined) row.completed = 0;
      }
      if (tableName === 'taskChecklist') {
        if (row.position === undefined) row.position = 0;
        if (row.completed === undefined) row.completed = 0;
      }
      return row;
    });
  }
  return normalized;
}

export function createLegacyBackup(tables, exportedAt = new Date().toISOString()) {
  return {
    format: LEGACY_BACKUP_FORMAT,
    version: LEGACY_BACKUP_VERSION,
    exportedAt,
    source: 'schedule-react-native',
    tables,
  };
}
