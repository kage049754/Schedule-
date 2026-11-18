# Implementation status

## Current milestone: Live synchronization, reminders, native widget, and APK verification

**Status:** Core modules and cross-module live synchronization implemented; latest Android debug APK with reminder actions built and extracted; all 36 tests pass in [Run #190](https://github.com/kage049754/Schedule-/actions/runs/44164049786); latest Android APK extracted and checked  
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
- [x] [Run #190](https://github.com/kage049754/Schedule-/actions/runs/44164049786) completed successfully; all 36 tests, Vite production build, Android Gradle build, and artifact uploads passed.
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
- [x] Added notification actions for Snooze 10 min and Dismiss; CI compiled them into the Android app.
- [x] Added a generated, bundled three-note Schedule chime to Android `res/raw`; notification channels select sound and vibration independently, with versioned channel IDs so Android applies the changed channel configuration.
- [ ] Verify actual sound/vibration delivery and user channel overrides on a physical Android device.
- [x] Added a native Android home-screen widget provider, Capacitor bridge, and local SharedPreferences snapshot; compiled and manifest/plugin registration checks passed in [Run #169](https://github.com/kage049754/Schedule-/actions/runs/44162564899).
- [x] Verified widget layout/resources and provider/plugin classes are packaged in the Run #144 APK; physical launcher placement and refresh behavior still need device testing.
- [x] Verified the installed Capacitor Local Notifications plugin manifest includes `LocalNotificationRestoreReceiver` for BOOT_COMPLETED, LOCKED_BOOT_COMPLETED, and QUICKBOOT_POWERON; CI now checks the merged APK manifest and RECEIVE_BOOT_COMPLETED permission.
- [ ] Verify restored reminders and widget refresh after reboot, including Do Not Disturb, battery restrictions, and notification permission changes.

### Current feature status
- Dashboard: reactive class, activity, task, and finance summaries; recent income/expense activity; and period-aware allowance totals are wired. Date-scoped finance reporting remains.
- Schedule: weekly timetable, subject/class edits, personal activity CRUD, cross-conflict checks, and cascade-safe subject unlinking are implemented.
- Budget/Savings: user-facing local allowance, income, expense, category, goal, deposit, and withdrawal flows are implemented; category spending limits and live today/week/month/all-time reports are date-scoped; Dashboard consumes the same live ledger.
- Notepad: user-facing editor, search, personal/lecture/subject linking, pin, archive, and delete are implemented.
- Tasks: assignment editor, due dates, priorities, subject links, checklists, completion, and overdue views are implemented.
- Settings: local profile, bottom-navigation module visibility/order, backup export/restore, and class/activity/task reminder controls are implemented; notification actions include Snooze 10 min and Dismiss. Appearance and appearance customization remains; physical chime delivery still requires device QA.
- Android: CI generates the Capacitor project and successfully builds a debug APK. Run #160 APK extracted at 4,223,730 bytes; SHA-256 `80459e5165ff1b74d452c157f9d62936dfe56f4c3bcf00f2e0dd94ae29bb7327`. Widget resources/provider/plugin and reminder action strings are packaged. Physical-device install/display/action QA remains.

### Next actions selected from current gaps
1. Verify bundled chime playback and boot restoration on a physical Android device; investigate any OEM-specific delivery failures.
2. Add notification/widget physical-device QA instructions and test installation, permission flows, vibration, snooze/dismiss actions, widget placement, and refresh on the Infinix phone.
3. Complete date-scoped finance reports, Settings profile/module customization, and accessibility/persistence checks.
4. Review and safely remediate remaining dependency audit findings without incompatible major upgrades; add a reproducible lockfile.
5. Prepare a signed release APK after debug APK behavior is confirmed on-device.
  
### Important limitations
- No backend, login, cloud database, or sync is part of this project.
- A debug APK has been generated, extracted, and package contents checked from Run #144; installation and physical-device behavior remain unverified.
- A successful Vite build is not evidence of Android packaging or installation.
- Browser local notifications cannot replace Android alarms when the app is closed; use the Capacitor Android notification path and test it on devices.

### Development rule
Inspect → research → plan the smallest useful change → implement → test → wait for completed CI → inspect logs → fix → rebuild → verify artifacts → update progress → select the next task. Do not stop merely because a commit or queued workflow exists. Continue while the conversation and available tools remain active; do not claim background work after the response ends.