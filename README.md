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
| 0 | Foundation | React/Vite/Tailwind/Capacitor setup, scripts, conventions | Complete (CI verified) |
| 1 | Navigation and shell | Responsive app frame, bottom navigation, reusable UI, routes | Initial shell complete; polish pending |
| 2 | Dashboard | Today's classes, tasks to finish, available money, savings, reminders | Implemented; allowance balance uses active date range |
| 3 | Schedule | CampusOS-style weekly timetable, subjects, rooms, lecture/lab slots, activities | Initial timetable and subject CRUD implemented; editing/activities/tests pending |
| 4 | Notifications and reminders | Local notifications for upcoming classes and task deadlines; configurable class lead time and per-feature toggles | Implemented; Android permission and vibration settings added; reboot/sound/snooze testing remains |
| 4A | Alarm and vibration | Alarm-style class/deadline alerts, vibration, snooze/dismiss, and exact-alarm permission handling | Initial notification channel and vibration controls implemented; custom sound/actions remain |
| 4B | Home-screen widget | Native Android home-screen widget showing next class, countdown, today's schedule, and nearest deadline; tap-through navigation and periodic refresh | Planned |
| 5 | Budget | Daily/weekly/monthly allowance, income, expenses, live balance | Implemented; date-scoped allowance and transaction ledger |
| 6 | Spending limits | Category budgets and spent/remaining indicators | Implemented; daily/weekly/monthly limits and over-limit indicators |
| 7 | Savings | Goals, contributions, saved totals, progress | Implemented; goal tracking and withdrawal validation |
| 8 | Notepad | Personal, lecture, and subject-linked notes | Implemented; search, edit, pin, archive, restore, delete |
| 9 | Tasks | Assignments, deadlines, priorities, checklists, completion | Implemented; pending, overdue, completed views and checklist CRUD |
| 10 | Dashboard integration | Combine academic and financial summaries | Planned |
| 11 | Settings | Profile, dashboard customization, modules, appearance, reminders | Planned |
| 12 | Backup and recovery | Local JSON export/import with validation | Planned |
| 13 | QA | Offline, persistence, calculation, conflict, date and accessibility checks | Planned |
| 14 | Android packaging | Capacitor Android project, identity, permissions, icons | CI generation and debug APK build in progress |
| 15 | Release | CI build, APK generation, artifact and install verification | Debug APK pipeline added; awaiting first completed APK artifact |
| 16 | Notification/widget QA | Test notification permission flows, exact-alarm access where required, vibration, Do Not Disturb behavior, reboot rescheduling, battery restrictions, and widget refresh on supported Android versions | Planned |

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

## Engineering research and independent decisions

Research comparable open-source projects and official documentation when they can improve a milestone. Inspect source code and licenses where accessible; use ideas and patterns, not unlicensed code copying. Evaluate each candidate against offline-only operation, Android packaging, accessibility, maintainability, and the no-cost constraint. Record meaningful findings and design decisions in [docs/ENGINEERING_RESEARCH.md](docs/ENGINEERING_RESEARCH.md). The next task should be selected from actual gaps, bugs, and dependencies in this repository—not only from a user prompt.

## Step-by-step execution policy
For each phase: inspect current code → implement a bounded feature → run checks/build → inspect actual CI result and logs → fix failures → rebuild → verify outputs → update this roadmap and IMPLEMENTATION_STATUS.md → continue to the next phase.

Do not mark a phase complete because code was merely written. Build/test evidence is required. Physical-device testing is separate from CI/emulator checks. Before each milestone, inspect the current repo, research relevant documentation/projects, and use available code-review/testing tools or skills where applicable. Keep the project strictly offline: no backend, accounts, cloud sync, or runtime network dependency.

## Current progress
See IMPLEMENTATION_STATUS.md.

## Engineering research

See [Engineering Research](docs/ENGINEERING_RESEARCH.md) for comparable projects reviewed, technical decisions, and the independent development protocol.
