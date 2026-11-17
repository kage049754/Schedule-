# Implementation status

## Current milestone: Phase 5–9 — Budget, Savings, Notepad, and Tasks

**Status:** Budget/Savings, Notepad, and Tasks screens implemented; latest web build and all 16 tests verified in CI  
**Repository:** kage049754/Schedule-  
**Architecture:** React + JavaScript + Vite + Tailwind + Capacitor + Dexie.js  
**Backend:** None. Fully offline core; local-only data.

### Completed and previously verified
- [x] React/Vite app shell, mobile navigation, route structure, Tailwind theme, and Capacitor configuration.
- [x] Dexie.js local schema for profile, subjects, schedule slots, activities, allowance, income, expenses, categories, savings, notes, tasks, checklists, and settings.
- [x] Local PHP peso formatter and date/time helpers.
- [x] Local JSON backup export and validation/restore service.
- [x] Dashboard local queries for today's classes, pending/overdue tasks, balance, and savings.
- [x] Subject creation with duplicate-code protection.
- [x] Weekly schedule editor with Lecture/Lab, room selection, and adjacent matching slot merging.
- [x] Transaction-protected overlap prevention.
- [x] GitHub Actions production web build and artifact upload.
- [x] Earlier verified web build: [Run #20](https://github.com/kage049754/Schedule-/actions/runs/44149371333), successful.
- [x] Added Settings screen with local JSON backup export and validated restore flow; import warns that existing local records will be replaced.\n- [x] Implemented Budget/Savings CRUD for allowance, income, expenses, categories, goals, deposits, and withdrawals.\n- [x] Added daily/weekly/monthly category spending limits with current-period spent, remaining, and over-limit indicators.\n- [x] Added period-aware daily/weekly/monthly allowance ranges and corrected dashboard balance to include only allowances active today.\n- [x] Added Notepad with personal/lecture/subject-linked notes, search, editing, pinning, archive/restore, and deletion.\n- [x] Added Tasks with due dates, priority, subject linking, pending/overdue/completed views, checklists, and completion/deletion flows.

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

### Newly requested roadmap items\n- [x] Implemented local Android class and deadline notifications with configurable class lead time and per-feature toggles.\n- [x] Added Android reminder vibration-channel selection, test alert, notification permission handling, and exact-alarm settings access.\n- [ ] Add custom alarm sound and snooze/dismiss notification actions; test actual sound/vibration delivery on device.\n- [ ] Native Android home-screen widget showing the next class, countdown, room, and nearest deadline; refresh from local data only.\n- [ ] Reschedule reminders after reboot and verify notification/widget behavior under Do Not Disturb, battery restrictions, and notification permission changes.\n\n### Current feature status
- Dashboard: local class/task/finance summaries are wired; allowance totals are period-aware. Date-scoped finance reporting remains.
- Schedule: initial functional weekly timetable and subject management are implemented; activity entries, edit flows, and reminder scheduling remain.
- Budget/Savings: user-facing local allowance, income, expense, category, goal, deposit, and withdrawal flows are implemented; category spending limits and period reports remain.
- Notepad: user-facing editor, search, personal/lecture/subject linking, pin, archive, and delete are implemented.
- Tasks: assignment editor, due dates, priorities, subject links, checklists, completion, and overdue views are implemented.
- Settings: local backup export/restore UI is implemented; profile, module visibility/order, appearance, and reminder controls remain.
- Android: Capacitor config exists, but native Android project/APK generation and install verification remain.

### Next actions selected from current gaps
1. Verify the Settings backup/restore change with a completed GitHub Actions run; fix any build failures from actual logs.
2. Inspect the exact dependency advisories and remediate safely without forcing incompatible major upgrades; pin reproducible dependencies with a lockfile.
3. Implement Budget and Savings ledger with period-aware allowance, category limits, and integer-centavo calculations.
4. Add schedule edit/update operations and personal activities. Then implement local class/deadline notifications, alarm-style vibration/snooze behavior, reboot rescheduling, and the native Android home-screen widget.
5. Implement subject-linked Notepad and Tasks with checklist/deadline flows.
6. Expand Settings with profile and module customization; keep language selection open until the user decides.
7. Add full offline, accessibility, calculation, persistence, and Android flow tests.
8. Generate and verify a real APK, then separately request physical-device testing.

### Important limitations
- No backend, login, cloud database, or sync is part of this project.
- No APK has been generated or physically tested yet.
- A successful Vite build is not evidence of Android packaging or installation.
- Browser local notifications cannot replace Android alarms when the app is closed; use the Capacitor Android notification path and test it on devices.

### Development rule
Inspect → research → plan the smallest useful change → implement → test → wait for completed CI → inspect logs → fix → rebuild → verify artifacts → update progress → select the next task. Do not stop merely because a commit or queued workflow exists. Continue while the conversation and available tools remain active; do not claim background work after the response ends.