# Schedule

An offline-first student planner and personal finance Android application.

## Technology
- React + JavaScript, Vite, Tailwind CSS
- Capacitor for Android packaging
- Dexie.js (IndexedDB) for on-device persistence
- React Router, Lucide React, Recharts
- Capacitor Local Notifications

## Offline-only architecture
There is **no backend**: no server, account system, cloud database, remote API, or synchronization. Core features and user data remain on the device. Internet is only needed to obtain the initial APK or install development dependencies.

## Roadmap and module behavior

| Phase | Module | Function / behavior | Status |
|---|---|---|---|
| 0 | Foundation | React/Vite/Tailwind/Capacitor setup, scripts, conventions | In progress |
| 1 | Navigation and shell | Responsive app frame, bottom navigation, reusable UI, routes | Planned |
| 2 | Dashboard | Today's classes, tasks to finish, available money, savings, reminders | Planned |
| 3 | Schedule | CampusOS-style weekly timetable, subjects, rooms, lecture/lab slots, activities | Planned |
| 4 | Class reminders | Local notifications before classes; configurable lead time | Planned |
| 5 | Budget | Daily/weekly/monthly allowance, income, expenses, live balance | Planned |
| 6 | Spending limits | Category budgets and spent/remaining indicators | Planned |
| 7 | Savings | Goals, contributions, saved totals, progress | Planned |
| 8 | Notepad | Personal, lecture, and subject-linked notes | Planned |
| 9 | Tasks | Assignments, deadlines, priorities, checklists, completion | Planned |
| 10 | Dashboard integration | Combine academic and financial summaries | Planned |
| 11 | Settings | Profile, dashboard customization, modules, appearance, reminders | Planned |
| 12 | Backup and recovery | Local JSON export/import with validation | Planned |
| 13 | QA | Offline, persistence, calculation, conflict, date and accessibility checks | Planned |
| 14 | Android packaging | Capacitor Android project, identity, permissions, icons | Planned |
| 15 | Release | CI build, APK generation, artifact and install verification | Planned |

### Detailed expected behavior

**Dashboard**
- Answers immediately: What classes are today? What tasks need finishing? How much money is left? How much is saved?
- Shows upcoming classes, deadlines, reminders, recent spending, and savings progress.
- Figures are derived from local records.

**Schedule**
- Weekly timetable based on days and time slots, following the existing CampusOS schedule behavior.
- Supports subjects, subject codes, professor, room, Lecture/Lab classification, and personal activities.
- A subject can have multiple slots and both Lecture and Lab entries.
- Timetable cells show subject code + room + Lecture/Lab.
- Rejects occupied-cell conflicts and never silently overwrites another class.
- Configurable days and visible time range; default Monday–Saturday, 07:00–19:00.

**Budget**
- Record daily, weekly, or monthly allowance and additional income.
- Record expenses with date, amount, category, and optional note.
- Available balance = opening balance + income - expenses.
- Category limits for food, transportation, school, bills, health, shopping, and custom categories.

**Savings**
- Set goal name and target amount; record contributions.
- Progress = saved amount / target amount, capped visually at 100%.

**Notepad**
- Personal notes and lecture notes.
- Notes can be linked to a subject and grouped automatically.
- Search, edit, pin, archive, and delete.

**Tasks**
- Assignment title, subject, due date, priority, checklist, and completion state.
- Upcoming, completed, and overdue views.
- Dashboard shows incomplete work due soonest.

**Settings**
- Profile, dashboard sections, module visibility/order, schedule preferences, budget categories, reminders, appearance, and app information.
- Users can edit, hide, remove, or replace configurable sections/categories without deleting unrelated records.
- Language decision remains open.

**Backup**
- Export local records to a user-selected file.
- Validate imported data before restoring. Clearing app data or uninstalling can erase local records if no backup exists.

## Step-by-step execution policy
For each phase: inspect current code → implement a bounded feature → run checks/build → inspect actual CI result and logs → fix failures → rebuild → verify outputs → update this roadmap and IMPLEMENTATION_STATUS.md → continue to the next phase.

Do not mark a phase complete because code was merely written. Build/test evidence is required. Physical-device testing is separate from CI/emulator checks.

## Current progress
See IMPLEMENTATION_STATUS.md.