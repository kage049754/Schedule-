# Engineering research and design decisions

This document records outside references reviewed for Schedule. References are used for design ideas and verification only; Schedule's code is implemented independently. Before adopting any source code or assets, verify its license and preserve required attribution.

## Comparable projects reviewed

### 1. Local Study OS
Repository: https://github.com/hijasonxu1/local-study-os  
License shown by repository README: MIT badge (verify the repository's actual LICENSE before copying any code).

Useful patterns:
- Local-only IndexedDB data and no login/backend.
- Academic course and task models rather than a generic todo list.
- Deadline ranking based on urgency and workload.
- JSON backup/restore.
- Dashboard, course, task, planner, analytics, and settings separation.

Schedule adaptation:
- Keep all student and finance records local.
- Make subject IDs the relationship key for timetable, notes, and tasks.
- Add transparent deadline ordering and clear overdue states.
- Keep backup/restore accessible from Settings.

### 2. Semester Desk
Repository: https://github.com/playxgaming/semester-desk-app

Useful patterns:
- The academic core works without a backend.
- The repository has a documented Android APK workflow.
- On-device alarms are used for reminders rather than relying on push services.
- It includes a timetable, course-linked notes, deadlines, and automated offline/mobile flow tests.
- It explicitly distinguishes browser notification limitations from Android alarms.

Schedule adaptation:
- Use Capacitor local notifications for Android class and assignment reminders.
- Verify the installed APK separately from the browser build.
- Add tests for real user journeys and offline persistence.
- Keep reminders optional and configurable.

### 3. Dexie.js documentation
References:
- https://dexie.org/docs/Dexie.js
- https://dexie.org/docs/Tutorial/Best-Practices
- https://dexie.org/docs/dexie-react-hooks/useLiveQuery%28%29

Useful patterns:
- IndexedDB is the local source of truth.
- Live queries update views when relevant records change.
- Use Dexie transactions for related reads/writes.
- Avoid awaiting unrelated asynchronous APIs inside IndexedDB transaction callbacks.

Schedule adaptation:
- Dashboard and feature screens should observe local database changes.
- Multi-record changes such as subject deletion and backup restore must be atomic.
- Keep calculation rules pure and unit-testable outside the database.

### 4. React quality review
Reference skill: installed React best-practices guide.

Applied review points:
- Keep expensive work out of repeated render paths.
- Use parallel reads for independent database queries.
- Give interactive controls accessible labels and touch-visible affordances.
- Avoid hidden hover-only controls on touch screens.
- Keep derived values derived from database records rather than duplicating mutable state.

## Decisions for this project

- Stack remains React + JavaScript + Vite + Tailwind CSS + Capacitor.
- Dexie.js/IndexedDB remains the only application data store for the web shell.
- No backend, login, cloud sync, analytics endpoint, or runtime API calls.
- Capacitor packages the web app into an Android APK; it does not require Jetpack Compose.
- Android local notifications are on-device. Permission and exact-alarm behavior must be tested on real Android versions.
- Currency is PHP and money is stored as integer centavos.
- The language selection remains undecided; do not hard-code a user-facing language setting until that decision is made.

## Review findings fixed in the current iteration

- Schedule grid was described as Monday–Saturday but rendered seven day columns. It now renders the six stated school days.
- Adjacent matching slots were visually merged, but the delete action only removed the first underlying record. Deletion now targets all IDs represented by the merged block.
- Schedule overlap and adjacent-slot merge logic was embedded in the database service. It is now isolated as pure functions and covered by Node tests.
- GitHub Actions now runs those tests before the production build.

## Research and implementation rules for future milestones

For each meaningful milestone:
1. Inspect the current implementation and roadmap.
2. Identify the user-visible outcome and likely failure modes.
3. Search official documentation and comparable open-source repositories when they can inform the decision.
4. Inspect the actual source and license where accessible; do not assume a README feature description proves code quality.
5. Compare alternatives against offline-only, Android packaging, accessibility, performance, and zero-cost constraints.
6. Implement the smallest coherent feature.
7. Add unit, integration, or flow tests appropriate to the behavior.
8. Run CI, wait for the completed result, inspect logs on failure, fix, and rebuild.
9. Verify generated artifacts and distinguish web artifacts from APKs.
10. Update README and IMPLEMENTATION_STATUS with evidence, limitations, and the next independently selected task.

Do not add features merely because another project has them. Prefer changes that solve an identified user need or measurable defect in Schedule.
