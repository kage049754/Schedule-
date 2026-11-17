# Local database

Schedule uses Dexie.js over IndexedDB. This is the only application data store. No backend, account, remote API, or cloud synchronization is part of the architecture.

Tables:
- profile: local student profile
- subjects: subject code, name, professor, lecture room, lab room, color
- scheduleSlots: recurring day/time slots and Lecture/Lab classification
- activities: one-off or recurring non-class activities
- allowances: daily, weekly, or monthly allowance records
- income and expenses: money movements stored as integer centavos
- categories: editable budget categories and limits
- savingsGoals and savingsEntries: goals and contribution/withdrawal ledger
- notes: personal, lecture, and subject-linked notes
- tasks and taskChecklist: assignments, due dates, priorities, and checklist rows
- settings: local preferences and dashboard/module customization

Money values must be stored as integer centavos to avoid floating-point currency errors. Dates should be stored as ISO date strings for calendar days and timestamps for audit fields. Repositories must validate input before writing and keep calculations derived from ledger records.
