import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { db } from '../database/db.js'
import { buildReminderCandidates, reminderDefaults, stableNotificationId } from './reminderRules.js'

const CLASS_ID_BASE = 1000000
const TASK_ID_BASE = 2000000
const ACTIVITY_ID_BASE = 3000000
const SNOOZE_ID_BASE = 4000000
const REMINDER_ACTION_TYPE = 'schedule-reminder-actions'
const REMINDER_CHANNEL_VIBRATE = 'schedule-reminders-vibrate'
const REMINDER_CHANNEL_SILENT = 'schedule-reminders-silent'

function reminderChannelId(vibrationEnabled) {
  return vibrationEnabled ? REMINDER_CHANNEL_VIBRATE : REMINDER_CHANNEL_SILENT
}

export async function getReminderSettings() {
  const row = await db.settings.get('reminders')
  return { ...reminderDefaults(), ...(row?.value || {}) }
}

export async function saveReminderSettings(settings) {
  const safe = {
    classesEnabled: Boolean(settings.classesEnabled),
    activitiesEnabled: settings.activitiesEnabled !== false,
    tasksEnabled: Boolean(settings.tasksEnabled),
    leadMinutes: Math.max(0, Math.min(120, Number(settings.leadMinutes) || 0)),
    taskLeadDays: Math.max(0, Math.min(7, Number(settings.taskLeadDays) || 0)),
    taskReminderTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(settings.taskReminderTime || '') ? settings.taskReminderTime : '08:00',
    vibrationEnabled: Boolean(settings.vibrationEnabled),
  }
  await db.settings.put({ key: 'reminders', value: safe, updatedAt: new Date().toISOString() })
  await rescheduleLocalReminders(safe)
  return safe
}

export async function requestReminderPermission() {
  if (!Capacitor.isNativePlatform()) return { display: 'unsupported' }
  const current = await LocalNotifications.checkPermissions()
  if (current.display === 'granted') return current
  return LocalNotifications.requestPermissions()
}

export async function checkExactAlarmAccess() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return { exact_alarm: 'unsupported' }
  return LocalNotifications.checkExactNotificationSetting()
}

export async function openExactAlarmSettings() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return { exact_alarm: 'unsupported' }
  return LocalNotifications.changeExactNotificationSetting()
}

export async function sendTestReminder(vibrationEnabled = true) {
  if (!Capacitor.isNativePlatform()) throw new Error('Test notifications are available in the installed Android app.')
  const permission = await requestReminderPermission()
  if (permission.display !== 'granted') throw new Error('Notification permission was not granted.')
  const channelId = await ensureReminderChannel(vibrationEnabled)
  return LocalNotifications.schedule({ notifications: [{
    id: 1900001,
    title: 'Schedule reminder test',
    body: 'Your local notifications are working on this device.',
    actionTypeId: REMINDER_ACTION_TYPE,
    autoCancel: true,
    ...(channelId ? { channelId } : {}),
    schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
  }] })
}

async function ensureReminderChannel(vibrationEnabled) {
  if (Capacitor.getPlatform() !== 'android') return undefined
  const channelId = reminderChannelId(vibrationEnabled)
  await LocalNotifications.createChannel({
    id: channelId,
    name: vibrationEnabled ? 'Schedule reminders (vibration)' : 'Schedule reminders (silent)',
    description: 'Upcoming classes and task deadlines',
    importance: 5,
    visibility: 1,
    vibration: Boolean(vibrationEnabled),
    lights: true,
    lightColor: '#315C43',
  })
  return channelId
}


export async function initializeReminderActionListener() {
  if (!Capacitor.isNativePlatform()) return null
  await LocalNotifications.registerActionTypes({
    types: [{
      id: REMINDER_ACTION_TYPE,
      actions: [
        { id: 'snooze-10', title: 'Snooze 10 min' },
        { id: 'dismiss', title: 'Dismiss', destructive: true },
      ],
    }],
  })
  return LocalNotifications.addListener('localNotificationActionPerformed', async ({ actionId, notification }) => {
    if (!notification?.id) return
    if (actionId === 'dismiss') {
      await LocalNotifications.removeDeliveredNotifications({ notifications: [{ id: notification.id }] })
      return
    }
    if (actionId !== 'snooze-10') return
    const settings = await getReminderSettings()
    const channelId = await ensureReminderChannel(settings.vibrationEnabled)
    await LocalNotifications.removeDeliveredNotifications({ notifications: [{ id: notification.id }] })
    const id = stableNotificationId('snooze-' + notification.id + '-' + Date.now(), SNOOZE_ID_BASE)
    await LocalNotifications.schedule({
      notifications: [{
        id,
        title: notification.title || 'Schedule reminder',
        body: notification.body || 'Reminder snoozed for 10 minutes.',
        ...(channelId ? { channelId } : {}),
        actionTypeId: REMINDER_ACTION_TYPE,
        autoCancel: true,
        schedule: { at: new Date(Date.now() + 10 * 60 * 1000), allowWhileIdle: true },
      }],
    })
  })
}

export async function rescheduleLocalReminders(settingsOverride = null) {
  if (!Capacitor.isNativePlatform()) return { scheduled: 0, skipped: true }
  const settings = settingsOverride || await getReminderSettings()
  const pending = await LocalNotifications.getPending()
  const managed = pending.notifications.filter((item) =>
    (item.id >= CLASS_ID_BASE && item.id < 1800000) ||
    (item.id >= TASK_ID_BASE && item.id < 2800000) ||
    (item.id >= ACTIVITY_ID_BASE && item.id < 3800000) ||
    item.id === 1900001
  )
  if (managed.length) await LocalNotifications.cancel({ notifications: managed.map(({ id }) => ({ id })) })
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return { scheduled: 0, permissionRequired: true }
  const channelId = await ensureReminderChannel(settings.vibrationEnabled)
  const [slots, activities, subjects, tasks] = await Promise.all([
    db.scheduleSlots.toArray(), db.activities.toArray(), db.subjects.toArray(), db.tasks.toArray(),
  ])
  await LocalNotifications.registerActionTypes({ types: [{ id: REMINDER_ACTION_TYPE, actions: [{ id: 'snooze-10', title: 'Snooze 10 min' }, { id: 'dismiss', title: 'Dismiss', destructive: true }] }] })
  const candidates = buildReminderCandidates({ slots, activities, subjects, tasks, settings, now: new Date(), days: 30 })
  const notifications = candidates.map((item) => ({
    id: stableNotificationId(item.key, item.kind === 'class' ? CLASS_ID_BASE : item.kind === 'activity' ? ACTIVITY_ID_BASE : TASK_ID_BASE),
    title: item.title,
    body: item.body,
    actionTypeId: REMINDER_ACTION_TYPE,
    autoCancel: true,
    ...(channelId ? { channelId } : {}),
    schedule: { at: item.at, allowWhileIdle: true },
  }))
  if (notifications.length) await LocalNotifications.schedule({ notifications })
  return { scheduled: notifications.length, permissionRequired: false }
}
