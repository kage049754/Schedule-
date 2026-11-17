# Implementation status

## Current milestone: Phase 5–9 — Budget, Savings, Notepad, and Tasks

**Status:** Budget/Savings, Notepad, and Tasks screens implemented; latest web build and all 25 tests verified in CI  
**Repository:** kage049754/Schedule-  
**Architecture:** React + JavaScript + Vite + Tailwind + Capacitor + Dexie.js  
**Backend:** None. Fully offline core; local-only data.

### Completed and previously verified
- [x] React/Vite app shell, mobile navigation, route structure, Tailwind theme, and Capacitor configuration.
- [x] Dexie.js local schema for profile, subjects, schedule slots, activities, allowance, income, expenses, categories, savings, notes, tasks, checklists, and settings.
- [x] Local PHP peso formatter and date/time helpers.
- [x] Local JSON backup export and validation/restore service.
- [x] Dashboard local live queries for today's classes, pending/overdue tasks, balance, savings, and recent income/expense activity.
- [x] Added cross-module Dexie live-query synchronization: Budget changes recalculate Dashboard totals/activity and category limits; schedule/task/subject changes refresh dependent views and local reminders.
- [x] Documented local data ownership, module dependencies, reminder timing, and the planned widget contract in docs/DATA_SYNC.md.
- [x] Subject creation with duplicate-code protection.
- [x] Weekly schedule editor with Lecture/Lab, room selection, and adjacent matching slot merging.
- [x] Transaction-protected overlap prevention.
- [x] GitHub Actions production web build and artifact upload.
- [x] Earlier verified web build: [Run #20](https://github.com/kage049754/Schedule-/actions/runs/44149371333), successful.
- [x] Added Settings screen with local JSON backup export and validated restore flow; import warns that existing local records will be replaced.
- [x] Implemented Budget/Savings CRUD for allowance, income, expenses, categories, goals, deposits, and withdrawals.
- [x] Added daily/weekly/monthly category spending limits with current-period spent, remaining, and over-limit indicators.
- [x] Added period-aware daily/weekly/monthly allowance ranges and corrected dashboard balance to include only allowances active today.
- [x] Added Notepad with personal/lecture/subject-linked notes, search, editing, pinning, archive/restore, and deletion.
- [x] Added Tasks with due dates, priority, subject linking, pending/overdue/completed views, checklists, and completion/deletion flows.

### Research and engineering improvements in this iteration
- [x] Reviewed Local Study OS for offline academic planning, task prioritization, and JSON backup patterns.
- [x] Reviewed Semester Desk for Android APK automation, local reminders, and offline flow testing.
- [x] Reviewed official Dexie guidance for live queries, transaction safety, and IndexedDB patterns.
- [x] Added docs/ENGINEERING_RESEARCH.md with references, decisions, and the research-to-implementation workflow.
- [x] Updated README with an independent engineering and research policy.
- [x] Corrected schedule day columns to Monday–Saturday.
- [x] Corrected deletion of visually merged adjacent timetable entries so all represented records are deleted together.
- [x] Extracted pure overlap and slot-merging rules into src/services/scheduleRules.js.
- [x] Added Node tests for adjacency, overlap, inactive entries, and merging.
- [x] Added npm test to GitHub Actions before production build.

### Current verification
- [x] [Run #27](https://github.com/kage049754/Schedule-/actions/runs/44149678881) completed successfully.
- [x] [Run #31](https://github.com/kage049754/Schedule-/actions/runs/44149872028) completed successfully after the dependency-audit workflow was added; all four tests, production build, output verification, and both artifact uploads passed.
- [x] Inspected Run #31 logs and confirmed the audit report lists 13 findings (2 moderate, 11 high); no dependency remediation is claimed yet.
- [x] Four schedule rule tests passed: adjacency, overlap rejection, inactive-slot handling, and merge criteria.
- [x] Vite production build succeeded; `dist/index.html` was verified.
- [x] `schedule-web-build` artifact uploaded (100,099 bytes; SHA-256 `5cea600dc3db2ea9d958d2828fb3229c3598ce843d2f78f1adf67ccfe30eed99`).
- [x] Job logs inspected; npm reported 13 dependency vulnerabilities (2 moderate, 11 high), which are now a tracked security task.
- [x] This is a web build artifact, not an APK.

### Newly requested roadmap items
- [x] Implemented local Android class and deadline notifications with configurable class lead time and per-feature toggles.
- [x] Added Android reminder vibration-channel selection, test alert, notification permission handling, and exact-alarm settings access.
- [x] Added configurable task deadline reminder timing (on due date or 1/2/3/7 days before, with a selected local time).
- [x] Ensure stale managed notifications are cancelled when records/settings change, even if notification permission is later revoked.
- [ ] Add custom alarm sound and snooze/dismiss notification actions; test actual sound/vibration delivery on device.
- [ ] Native Android home-screen widget source and Capacitor bridge added; verify Android compilation, launcher placement, refresh behavior, and physical-device display.
- [ ] Reschedule reminders after reboot and verify notification/widget behavior under Do Not Disturb, battery restrictions, and notification permission changes.

### Current feature status
- Dashboard: reactive class/task/finance summaries, recent income/expense activity, and period-aware allowance totals are wired. Date-scoped finance reporting remains.
- Schedule: initial functional weekly timetable and subject management are implemented; activity entries, edit flows, and reminder scheduling remain.
- Budget/Savings: user-facing local allowance, income, expense, category, goal, deposit, and withdrawal flows are implemented; category spending limits are date-scoped and Dashboard consumes the same live ledger.
- Notepad: user-facing editor, search, personal/lecture/subject linking, pin, archive, and delete are implemented.
- Tasks: assignment editor, due dates, priorities, subject links, checklists, completion, and overdue views are implemented.
- Settings: local backup export/restore and class/task reminder controls are implemented; profile, module visibility/order, appearance, and richer alarm controls remain.
- Android: CI generates the Capacitor project and successfully builds a debug APK; native widget source is now injected into the generated project and awaits its first verified build. Physical-device install/display QA remains.

### Next actions selected from current gaps
1. Finish the current CI cycle, inspect unit-test and Android Gradle logs, download the newest APK artifact, and verify its contents/checksum.
2. Implement the native Android home-screen widget with next class, countdown, room, and nearest task deadline; keep its data local and refresh on database changes/time boundaries.
3. Complete alarm behavior: custom sound options, snooze/dismiss actions, reboot rescheduling, and Android permission/battery/Do Not Disturb fallbacks.
4. Add schedule edit/update operations and personal activities, then connect activities to the Dashboard and reminders where appropriate.
5. Complete date-scoped finance reports, Settings profile/module customization, and full offline/accessibility/persistence tests.
6. Review and safely remediate remaining dependency audit findings without incompatible major upgrades; add a reproducible lockfile.
7. Verify the release APK and request separate physical-device QA before production signing/release.
  
### Important limitations
- No backend, login, cloud database, or sync is part of this project.
- A debug APK has been generated by CI; the newest app version still needs artifact verification and physical-device testing.
- A successful Vite build is not evidence of Android packaging or installation.
- Browser local notifications cannot replace Android alarms when the app is closed; use the Capacitor Android notification path and test it on devices.

### Development rule
Inspect → research → plan the smallest useful change → implement → test → wait for completed CI → inspect logs → fix → rebuild → verify artifacts → update progress → select the next task. Do not stop merely because a commit or queued workflow exists. Continue while the conversation and available tools remain active; do not claim background work after the response ends.