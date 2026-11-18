# Implementation status

## Current milestone: Capacitor-to-React Native migration

**Migration branch:** `react-native-migration`  
**Stable baseline:** `main` remains the last known-good Capacitor APK; do not remove it until React Native feature parity and backup import are verified.  
**New architecture:** React Native 0.88 + Expo SDK 58 + Expo SQLite + Expo Notifications.  
**Backend:** None; fully offline core.

#### CampusOS visual system and Settings parity
- [x] Added persistent Forest, Sunset, and Monochrome appearance themes to the React Native Settings screen.
- [x] Applied the selected theme to the native app shell, cards, form fields, buttons, headings, and navigation surfaces.
- [x] Added local module visibility and ordering preferences with persisted order, Home/Settings pinning, accessible move controls, and a reset action.
- [x] Kept profile, local reminder sound/vibration/lead-time controls, JSON backup import/export, and local-storage privacy information inside the native Settings module.
- [ ] Verify theme and navigation preference persistence after app restart and visual consistency on Android device/emulator; CI compilation is not a substitute for visual QA.
- [x] Fixed the native navigation preference loading path and added pure tests for default ordering, invalid settings recovery, deduplication, and pinned tabs.
- [x] Added Expo Android JavaScript bundle export to CI so Metro/JSX syntax errors are caught before native APK packaging.

## React Native work started
- [x] Created an isolated migration branch from the latest verified main commit.
- [x] Replaced the branch package scripts/dependencies with Expo + React Native runtime packages; removed Capacitor, Vite, Tailwind, React DOM, and Dexie from the native runtime dependency list.
- [x] Added Expo app configuration, Android package identity, and native entry point.
- [x] Added SQLite schema for profile, subjects, schedule, activities, allowances, income, expenses, categories, savings, category budgets, notes, tasks, checklists, and settings.
- [x] Added a native React Native screen shell for Dashboard, Schedule, Budget, Notes, Tasks, and Settings, with initial SQLite-backed create/delete flows.
- [x] Added native domain helpers and tests for centavo precision, time validation, overlap prevention, allowance ranges, and balance calculation.
- [x] Added reproducible bundled reminder chime generation and Expo Notifications configuration.
- [x] Replaced the Capacitor GitHub Actions workflow with an Expo Prebuild + Gradle Android APK workflow on the migration branch.
- [x] Implemented version-1 legacy JSON backup format validation and normalization, including required-field checks, duplicate-ID rejection, unknown-column filtering, legacy activity date normalization, and preservation of record/relationship IDs.
- [x] Implemented transaction-protected SQLite backup restore and native JSON export. Invalid backups are rejected before writes; failed inserts roll back rather than partially restoring.
- [x] Added Settings controls to export/share JSON and import via Android document picker with destructive replacement confirmation.
- [x] Added SQLite `activities.date` migration so legacy calendar dates are retained alongside weekday values.
- [x] Run all native domain and backup tests in CI, validate Expo module compatibility, build the arm64 APK, and inspect the workflow APK-verification step in [Run #232](https://github.com/kage049754/Schedule-/actions/runs/44252235863). Artifact download and independent package inspection remain pending.
- [ ] Verify a real export from the Capacitor app can be imported on the target Android phone and round-tripped back to JSON before replacing `main`.
- [x] Ported native Budget parity: date-specific income/expense entries, editable category creation by expense entry, daily/weekly/monthly category limits, savings goals, deposits/withdrawals with transaction-protected balance checks, and today/week/month/all-time money reports with transaction deletion.
- [ ] Complete remaining native parity: native widget port and verification.
- [x] Added a native Appearance section with persistent Forest (default), Sunset, and Monochrome light themes; palette is applied to app surfaces, cards, fields, buttons, balance/stat accents, and bottom navigation.
- [ ] Verify appearance and Budget preference/data persistence after app restart and visual consistency on the target phone.
- [ ] Device QA on Android; physical behavior is not yet verified.

## Previous Capacitor baseline (preserved on main)

**Status:** Core modules and cross-module live synchronization implemented; latest Android debug APK with reminder actions built and extracted; all 36 tests pass in [Run #190](https://github.com/kage049754/Schedule-/actions/runs/44164049786); latest Android APK extracted and checked  
**Repository:** kage049754/Schedule-  
**Previous architecture on main:** React + JavaScript + Vite + Tailwind + Capacitor + Dexie.js  
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

### React Native backup migration implementation (CI verification pending)

The migration branch now contains the portable backup service (`src-native/backup.js`), SQLite transaction adapter (`src-native/backupStorage.js`), Settings UI controls, Expo Document Picker/FileSystem/Sharing dependencies, and `tests/native-backup.test.js`. The GitHub workflow is being expanded to run all `tests/*.test.js`, including legacy backup tests. The current implementation has not yet passed a completed CI run or a physical-device round-trip; do not treat the migration as production-safe until both are verified.

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
- Settings: local profile, bottom-navigation module visibility/order, backup export/restore, and class/activity/task reminder controls are implemented; notification actions include Snooze 10 min and Dismiss. Appearance now has native Forest, Sunset, and Monochrome presets with local persistence; navigation customization parity remains. Physical chime delivery still requires device QA.
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
### Native Budget parity implementation
- [x] Added date-specific income and expense entry with calendar-date validation.
- [x] Added savings goal creation, deposits, withdrawals, and transactional protection against withdrawing more than the goal balance.
- [x] Added active-period category spending limits with current spending, remaining amount, over-limit status, and deletion.
- [x] Added date-scoped money reports for today, Monday–Sunday week, calendar month, and all-time, including transaction deletion.
- [x] Expanded native SQLite refresh data for savings entries and category limits; dashboard balance, totals, and savings use the same local records.
- [ ] Verify budget changes update Dashboard and survive app restart on a physical Android device.

- [x] Investigated Run #250 test logs (25/27 passing), corrected the escaped date-key validator and fixed the monthly-report fixture to place its exclusion record in the previous month.
- [x] Re-ran the full CI suite after the Budget fixes in [Run #251](https://github.com/kage049754/Schedule-/actions/runs/44352296932): 27 tests passed; Gradle APK build and package/manifest/embedded-bundle verification passed; artifact uploaded and independently extracted (54,257,905 bytes; SHA-256 `27677e253b9889b46f3a76dd603f0428a8a9d5a401bff0c46db16db7a4f95486`).

### Native Notepad parity implementation
- [x] Added note editing and subject linking with validation against locally stored subjects.
- [x] Added title/body search, personal/lecture/subject filters, pinned-first ordering, and archived/active views.
- [x] Added pin/unpin and archive/restore actions; note content remains local and offline.
- [ ] Verify note editing, archive state, and search persistence after app restart on the target Android device.

- [x] [Run #252](https://github.com/kage049754/Schedule-/actions/runs/44354125819) verified native Notepad parity: 29/29 tests passed, Gradle APK build succeeded, package/manifest/embedded bundle checks passed, and the APK was independently extracted and inspected (54,265,853 bytes; SHA-256 `ec17f9d0d9f6fd368a58ba63a90d4fc08a22358c95ca807aca3cf0649f0bd924`).
### Native Tasks and checklist parity implementation
- [x] Added task create/edit with title, description, optional subject link, validated due date, and Low/Normal/High priority.
- [x] Added searchable pending, overdue, completed, and all-task views with due-date and priority sorting.
- [x] Added per-task checklist creation, completion toggles, deletion, and transactional cascade deletion when deleting a task.
- [ ] Verify task/checklist persistence and due-date behavior after app restart on the target Android device.

### Native Android home-screen widget port
- [x] Added Expo config-plugin wiring for a native Android AppWidgetProvider and React Native bridge.
- [x] Added SQLite-derived next-class and nearest-unfinished-task widget selection helpers with tests.
- [ ] Verify widget registration, resource packaging, launcher placement, tap-to-open, and refresh on a physical Android device.

### CampusOS-style color combination selector
- [x] Expanded the appearance presets to six coordinated light palettes: Forest, Ocean, Sunset, Lavender, Rose, and Monochrome.
- [x] Added five-color swatch previews and a clearly marked selected palette in Settings; changing a palette updates the app immediately and persists locally.
- [x] Replaced module-level mutable active-theme state with React context so reusable UI components read the selected palette through React's render tree.
- [x] Kept Forest as the default palette and retained a one-tap reset to Forest.

### CampusOS-inspired full UI and Dashboard redesign
- [x] Rebuilt Dashboard around a forest-green greeting/next-class hero, four live overview tiles, quick actions, class timeline, task progress/deadline alerts, budget snapshot, recent expenses, and savings-goal progress.
- [x] Added direct navigation from dashboard cards and quick actions to the relevant modules.
- [x] Applied a consistent compact card system, spacing, rounded surfaces, icon treatments, section headings, and timeline layout using the selected appearance palette.
- [ ] Verify responsive layout, dynamic data updates, and visual consistency across all six palettes on a physical Android device.

### Shared component visual polish
- [x] Refined app header, page spacing, reusable cards, field controls, buttons, list rows, and bottom navigation.
- [x] Kept component surfaces neutral and tied to the active appearance palette for consistent presentation across modules.
- [ ] Verify touch targets and visual scaling on the target Android device.
