# Implementation status

## Current milestone: Phase 3 — Schedule reliability and research-driven QA

**Status:** Schedule feature implementation builds successfully; new automated rule tests are added and awaiting CI verification  
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
- [ ] Latest CI run after test integration must complete successfully before marking these fixes verified.
- [ ] Check the uploaded artifact after the run completes.
- [ ] The previous run #20 was a web build only; it was not an APK build.

### Current feature status
- Dashboard: initial local summaries are wired; finance calculations still need period-aware allowance and expense handling.
- Schedule: initial functional weekly timetable and subject management are implemented; activity entries, edit flows, and reminder scheduling remain.
- Budget/Savings: data schema and formatting foundations exist; user-facing CRUD and accurate period ledger calculations remain.
- Notepad: schema exists; user-facing editor/search/subject linking remain.
- Tasks: schema exists; user-facing assignment/checklist/deadline flows remain.
- Settings: route is a placeholder; user-facing customization and backup controls remain.
- Android: Capacitor config exists, but native Android project/APK generation and install verification remain.

### Next actions selected from current gaps
1. Verify the latest test + build workflow; fix from actual logs if it fails.
2. Add edit/update operations and activity entries to Schedule; add reminder configuration and Android notification handling.
3. Implement Budget and Savings ledger with period-aware allowance and integer-centavo calculations.
4. Implement subject-linked Notepad and Tasks.
5. Implement Settings, module customization, backup UI, and language selection only after a language decision.
6. Add full offline, accessibility, calculation, persistence, and Android flow tests.
7. Generate and verify a real APK, then separately request physical-device testing.

### Important limitations
- No backend, login, cloud database, or sync is part of this project.
- No APK has been generated or physically tested yet.
- A successful Vite build is not evidence of Android packaging or installation.
- Browser local notifications cannot replace Android alarms when the app is closed; use the Capacitor Android notification path and test it on devices.

### Development rule
Inspect → research → plan the smallest useful change → implement → test → wait for completed CI → inspect logs → fix → rebuild → verify artifacts → update progress → select the next task. Do not stop merely because a commit or queued workflow exists. Continue while the conversation and available tools remain active; do not claim background work after the response ends.