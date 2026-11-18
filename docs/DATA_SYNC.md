# Local data synchronization contract

Schedule is a single-device, offline-first planner. On the React Native migration branch, Expo SQLite (`schedule-local.db`) is the source of truth for native screens. The preserved `main` branch still uses Dexie.js/IndexedDB. This is **on-device cross-module synchronization**, not cloud synchronization: no records are sent to a server, and a second device does not receive changes automatically.

The React Native shell currently refreshes its shared screen data after successful writes and when the active tab is opened. It does not yet have the old app's full reactive query layer; automatic dependency-wide refresh, backup migration, and widget integration remain migration work.

## Update flow

1. A user creates, edits, completes, or deletes a record in its owning module.
2. The module writes the change to its Dexie table. Related multi-table changes use a Dexie transaction.
3. Any screen whose `liveQuery` reads that table receives a fresh result and rerenders. No manual refresh is required.
4. Derived totals and lists are recalculated from the latest records; screens do not keep separate copies of financial or planner truth.
5. The app-level reminder observer watches schedule slots, personal activities, subjects, and tasks. When one changes, it asks Android's local notification scheduler to cancel and rebuild the managed reminders.

## Cross-module dependency map

| Source change | Live consumers / expected updates |
| --- | --- |
| Profile add/edit | Settings profile fields and Dashboard greeting |
| Module preference save | Bottom navigation visibility and order across app screens |
| Allowance add/edit/delete | Budget totals and Dashboard available balance |
| Income add/edit/delete | Budget totals, recent transactions, Dashboard available balance |
| Expense add/edit/delete | Budget totals, category limit usage, recent transactions, Dashboard available balance |
| Savings goal or entry change | Budget goal progress and Dashboard total savings |
| Subject add/edit/delete | Schedule subject choices, subject-linked Notepad/Tasks choices, class reminder labels; deleting a subject unlinks but preserves its notes and tasks |
| Schedule slot add/edit/delete | Weekly timetable, Dashboard today's classes, next-class calculations, local class reminders and widget snapshot |
| Personal activity add/edit/delete | Weekly timetable, Dashboard today's activities, local activity reminders |
| Task add/edit/complete/delete | Task list, Dashboard pending/overdue counts and previews, local deadline reminders |
| Note add/edit/archive/delete | Notepad list and search results |
| Reminder preference change | Local Android class/activity/task reminder queue; does not change the underlying planner records |

## Finance rules

- Money is stored as integer centavos. UI input in pesos is converted before writing.
- The Budget and Dashboard available balance use the same calculation: active allowance for the current date plus income and expenses dated today or earlier. Future-dated transactions remain visible in totals/history but do not change today's available balance.
- Dashboard recent money activity is derived from the same income and expense rows as Budget.
- Budget reports derive today/week/month/all-time income, expenses, net, and transaction lists from the same live local records; changing a date range never creates or copies transaction data.
- Category limit usage is recalculated from expenses whose dates fall inside the limit's saved period.
- Savings progress is derived from deposits and withdrawals; savings are not automatically treated as expenses.

## Notification behavior and timing

- Class alerts are generated for the selected lead time before each matching weekly class. Android notification channels support a bundled Schedule chime and independently selectable vibration; channel IDs are versioned because Android does not let apps replace sound settings on an existing channel. Notifications expose **Snooze 10 min** and **Dismiss** actions; snooze creates a one-time local alert and does not change the original class/task record. The default is 10 minutes; supported choices are at class start, 5, 10, 15, 30, or 60 minutes before.
- Personal activity alerts use the same class lead-time preference and repeat on the activity's selected weekday.
- Task alerts default to 8:00 AM on the due date; Settings can move the alert to 1, 2, 3, or 7 days before the deadline and choose a local alert time.
- Completed tasks, deleted tasks, and removed/changed timetable entries must not retain stale managed reminders after the observer refreshes the queue, even if notification permission has been revoked.
- The native scheduler maintains a rolling 30-day window. The observer also runs on app startup and after watched records change. Changes to an activity cancel and rebuild its matching local alert.
- Android notification permission is required for visible alerts. A notification's snooze action schedules a separate one-time reminder 10 minutes later; dismiss removes that delivered alert only. Exact-alarm access, battery restrictions, Do Not Disturb, manufacturer background limits, and reboot behavior can affect delivery. The app must communicate these limitations instead of claiming guaranteed delivery.
- Reminder settings are local to this installation. Backup/restore is the supported way to move records/preferences to another device; each device schedules its own Android alerts.

## Widget contract

The Android home-screen widget reads a compact snapshot from local Android SharedPreferences, written by the Capacitor bridge from Dexie data. It displays the next upcoming class (subject, start time, room, countdown) and nearest incomplete task deadline, including overdue tasks marked as overdue. The app pushes updates after schedule/activity/subject/task changes and every minute while open; Android's widget update period refreshes it every 30 minutes while the app is closed. Tapping opens the Schedule app. It does not depend on a network service.

## Verification requirements

- Unit-test finance calculations and recent transaction ordering.
- Verify a new expense immediately changes Budget totals, category usage, Dashboard balance, and Dashboard recent activity.
- Verify edits and deletions reverse those effects.
- Verify schedule/task changes refresh pending reminders and do not leave duplicate/stale IDs.
- Test actual notification delivery, reboot recovery, and widget updates on Android hardware separately from CI web/Gradle builds.
