import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput, View, NativeModules
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const CalendarDays = (props) => <MaterialCommunityIcons name="calendar-month-outline" {...props}/>;
const Wallet = (props) => <MaterialCommunityIcons name="wallet-outline" {...props}/>;
const NotebookPen = (props) => <MaterialCommunityIcons name="notebook-edit-outline" {...props}/>;
const CheckSquare = (props) => <MaterialCommunityIcons name="checkbox-marked-outline" {...props}/>;
const LayoutDashboard = (props) => <MaterialCommunityIcons name="view-dashboard-outline" {...props}/>;
const Settings = (props) => <MaterialCommunityIcons name="cog-outline" {...props}/>;
const Trash2 = (props) => <MaterialCommunityIcons name="delete-outline" {...props}/>;
const GraduationCap = (props) => <MaterialCommunityIcons name="school-outline" {...props}/>;
const Bell = (props) => <MaterialCommunityIcons name="bell-outline" {...props}/>;
const Plus = (props) => <MaterialCommunityIcons name="plus" {...props}/>;
import { getDatabase, getSetting, setSetting } from './src-native/database';
import { exportNativeBackup, restoreNativeBackup } from './src-native/backupStorage';
import { THEMES, normalizeAppearance } from './src-native/appearance';
import { normalizeNavigationPreferences } from './src-native/navigation';
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, getAllowanceRange, calculateAvailableBalance, normalizeActivityInput, isValidDateKey, calculateFinanceSummary, summarizeBudgetTransactions, calculateCategoryUsage, validateSavingsWithdrawal, normalizeNativeNote, filterNativeNotes, normalizeNativeTask, filterNativeTasks, findNextNativeClass, findNearestNativeTask } from './src-native/domain';

const COLORS = { forest: '#174f3b', forest2: '#236b50', cream: '#f7f5ec', white: '#ffffff', ink: '#1f2937', muted: '#718096', line: '#e7e9e3', amber: '#b7791f', red: '#b42318' };
let ACTIVE_COLORS = COLORS;
const TABS = [
  { id: 'home', label: 'Home', Icon: LayoutDashboard },
  { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
  { id: 'budget', label: 'Budget', Icon: Wallet },
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquare },
  { id: 'settings', label: 'Settings', Icon: Settings }
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayKey = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const peso = (centavos = 0) => '₱' + (Number(centavos || 0) / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseAmount = parseMoneyToCentavos;
const parseTime = parseTimeToMinutes;
const timeLabel = (mins) => new Date(2000,0,1,Math.floor(mins/60),mins%60).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'});
const timeInput = (mins) => String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');
const showError = (error) => Alert.alert('Schedule', error?.message || 'Something went wrong.');

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

function Card({ children, style }) { return <View style={[styles.card, { backgroundColor: ACTIVE_COLORS.white, borderColor: ACTIVE_COLORS.line }, style]}>{children}</View>; }
function Heading({ children, detail }) { return <View style={styles.heading}><Text style={[styles.h1, { color: ACTIVE_COLORS.ink }]}>{children}</Text>{detail ? <Text style={[styles.sub, { color: ACTIVE_COLORS.muted }]}>{detail}</Text> : null}</View>; }
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, style }) {
  return <View style={styles.field}><Text style={[styles.label, { color: ACTIVE_COLORS.muted }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder || label} placeholderTextColor={ACTIVE_COLORS.muted} keyboardType={keyboardType || 'default'} multiline={multiline} style={[styles.input, { color: ACTIVE_COLORS.ink, backgroundColor: ACTIVE_COLORS.white, borderColor: ACTIVE_COLORS.line }, multiline && styles.multiline, style]} /></View>;
}
function Button({ title, onPress, secondary, danger, compact }) {
  return <Pressable onPress={onPress} style={[styles.button, { backgroundColor: ACTIVE_COLORS.forest }, secondary && [styles.buttonSecondary, { backgroundColor: ACTIVE_COLORS.soft, borderColor: ACTIVE_COLORS.line }], danger && styles.buttonDanger, compact && styles.buttonCompact]}><Text style={[styles.buttonText, secondary && [styles.buttonSecondaryText, { color: ACTIVE_COLORS.forest }], danger && styles.buttonDangerText]}>{title}</Text></Pressable>;
}
function Item({ title, detail, trailing, onDelete, onPress }) {
  return <Pressable onPress={onPress} style={[styles.item,{borderTopColor:ACTIVE_COLORS.line}]}><View style={styles.itemText}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{title}</Text>{detail ? <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{detail}</Text> : null}</View>{trailing ? <Text style={[styles.trailing,{color:ACTIVE_COLORS.forest}]}>{trailing}</Text> : null}{onDelete ? <Pressable hitSlop={10} onPress={onDelete} style={styles.delete}><Trash2 size={17} color={ACTIVE_COLORS.red}/></Pressable> : null}</Pressable>;
}
function Empty({ text }) { return <Text style={[styles.empty, { color: ACTIVE_COLORS.muted }]}>{text}</Text>; }

export default function App() {
  const [tab, setTab] = useState('home');
  const [db, setDb] = useState(null);
  const [busy, setBusy] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ profile: {}, classes: [], allClasses: [], activities: [], allActivities: [], subjects: [], tasks: [], taskChecklist: [], income: [], expenses: [], allowances: [], notes: [], goals: [], categories: [], savingsEntries: [], categoryBudgets: [] });
  const [form, setForm] = useState({});
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState('10');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [appearance, setAppearance] = useState('forest');
  const [navigationOrder, setNavigationOrder] = useState(TABS.map(item => item.id));
  const [hiddenTabs, setHiddenTabs] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [noteSearch, setNoteSearch] = useState('');
  const [noteKindFilter, setNoteKindFilter] = useState('all');
  const [showArchivedNotes, setShowArchivedNotes] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskView, setTaskView] = useState('pending');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  ACTIVE_COLORS = THEMES[appearance] || THEMES.forest;

  const refreshData = async (database = db) => {
    if (!database) return;
    const day = new Date().getDay(), today = todayKey();
    const [profile, classes, allClasses, activities, allActivities, subjects, tasks, income, expenses, allowances, notes, goals, categories, savingsEntries, categoryBudgets, taskChecklist] = await Promise.all([
      database.getFirstAsync('SELECT * FROM profile WHERE id = ?', 'local'),
      database.getAllAsync('SELECT s.*, sub.code, sub.name AS subjectName FROM scheduleSlots s LEFT JOIN subjects sub ON sub.id=s.subjectId WHERE s.day=? AND s.active=1 ORDER BY s.startMinutes', day),
      database.getAllAsync('SELECT s.*, sub.code, sub.name AS subjectName FROM scheduleSlots s LEFT JOIN subjects sub ON sub.id=s.subjectId WHERE s.active=1 ORDER BY s.day,s.startMinutes'),
      database.getAllAsync('SELECT * FROM activities WHERE day=? ORDER BY startMinutes', day),
      database.getAllAsync('SELECT * FROM activities ORDER BY day,startMinutes'),
      database.getAllAsync('SELECT * FROM subjects ORDER BY code'),
      database.getAllAsync('SELECT * FROM tasks ORDER BY completed, dueDate IS NULL, dueDate'),
      database.getAllAsync('SELECT * FROM income ORDER BY date DESC, id DESC'),
      database.getAllAsync('SELECT * FROM expenses ORDER BY date DESC, id DESC'),
      database.getAllAsync('SELECT * FROM allowances'),
      database.getAllAsync('SELECT * FROM notes ORDER BY pinned DESC, updatedAt DESC'),
      database.getAllAsync("SELECT g.*, COALESCE((SELECT SUM(CASE WHEN e.type='withdrawal' THEN -e.amount ELSE e.amount END) FROM savingsEntries e WHERE e.goalId=g.id),0) AS savedAmount FROM savingsGoals g ORDER BY g.id DESC"),
      database.getAllAsync('SELECT * FROM categories WHERE active=1 ORDER BY name'),
      database.getAllAsync('SELECT * FROM savingsEntries ORDER BY date DESC, id DESC'),
      database.getAllAsync('SELECT * FROM categoryBudgets ORDER BY startDate DESC, id DESC'),
      database.getAllAsync('SELECT * FROM taskChecklist ORDER BY taskId, position, id')
    ]);
    setData({ profile: profile || {}, classes, allClasses, activities, allActivities, subjects, tasks, taskChecklist, income, expenses, allowances, notes, goals, categories, savingsEntries, categoryBudgets });
    const widget = NativeModules.ScheduleWidget;
    if (widget?.updateSnapshot) {
      try {
        const now = new Date();
        const nextClass = findNextNativeClass(allClasses, now);
        const nextTask = findNearestNativeTask(tasks);
        const dueDateLabel = nextTask?.dueDate ? (() => {
          const [year, month, day] = nextTask.dueDate.split('-').map(Number);
          const formatted = new Date(year, month - 1, day).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
          return nextTask.dueDate < today ? 'OVERDUE · ' + formatted : 'Due ' + formatted;
        })() : '';
        await widget.updateSnapshot({
          classTitle: nextClass?.title || 'No upcoming class',
          classDetails: nextClass?.details || 'Your timetable is clear',
          classStartAt: nextClass?.startAt?.getTime() || 0,
          taskTitle: nextTask?.title || 'No pending deadline',
          taskDueDate: dueDateLabel,
        });
      } catch (error) {
        console.warn('Unable to refresh the Schedule home-screen widget.', error);
      }
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const database = await getDatabase();
        const [reminders, lead, sound, vibration, savedAppearance, savedNavigation] = await Promise.all([
          getSetting('remindersEnabled', 'true'), getSetting('leadMinutes', '10'),
          getSetting('soundEnabled', 'true'), getSetting('vibrationEnabled', 'true'), getSetting('appearance', 'forest'), getSetting('navigationPreferences', '{}')
        ]);
        if (!active) return;
        setDb(database); setRemindersEnabled(reminders !== 'false'); setLeadMinutes(lead);
        setSoundEnabled(sound !== 'false'); setVibrationEnabled(vibration !== 'false');
        setAppearance(normalizeAppearance(savedAppearance));
        const savedNavigationPreferences = normalizeNavigationPreferences(savedNavigation);
        setNavigationOrder(savedNavigationPreferences.order);
        setHiddenTabs(savedNavigationPreferences.hidden);
        await refreshData(database);
      } catch (error) { showError(error); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (db) refreshData(db).catch(showError); }, [tab, refresh, db]);

  const availableBalance = useMemo(() => {
    const today = todayKey();
    return calculateAvailableBalance(data, today);
  }, [data]);
  const savingsTotal = useMemo(() => data.goals.reduce((sum,goal)=>sum+Number(goal.savedAmount||0),0), [data]);

  const changed = () => setRefresh(value => value + 1);
  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const resetForm = () => setForm({});

  const scheduleReminderRefresh = async (database = db) => {
    if (!database) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!remindersEnabled) return;
      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) return;
      await Notifications.setNotificationChannelAsync('schedule-reminders', {
        name: 'Schedule reminders', importance: Notifications.AndroidImportance.HIGH,
        sound: soundEnabled ? 'schedule_chime.wav' : null,
        vibrationPattern: vibrationEnabled ? [0, 250, 150, 250] : null,
        enableVibrate: vibrationEnabled
      });
      const [slots, subjects, tasks, activities] = await Promise.all([
        database.getAllAsync('SELECT * FROM scheduleSlots WHERE active=1'),
        database.getAllAsync('SELECT * FROM subjects'),
        database.getAllAsync('SELECT * FROM tasks WHERE completed=0 AND dueDate IS NOT NULL'),
        database.getAllAsync('SELECT * FROM activities')
      ]);
      const subjectMap = new Map(subjects.map(x => [x.id,x]));
      const now = new Date(), lead = Math.max(0, Math.min(120, Number(leadMinutes)||0));
      for (let offset=0; offset<30; offset++) {
        const date = new Date(now.getFullYear(),now.getMonth(),now.getDate()+offset);
        const day = date.getDay(), dateKey = [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
        for (const slot of slots.filter(x=>x.day===day)) {
          const subject=subjectMap.get(slot.subjectId); if(!subject) continue;
          const at=new Date(date); at.setHours(Math.floor(slot.startMinutes/60),slot.startMinutes%60,0,0); at.setMinutes(at.getMinutes()-lead);
          if(at<=now) continue;
          await Notifications.scheduleNotificationAsync({content:{title:'Upcoming class: '+(subject.code||subject.name),body:(slot.kind||'Class')+' starts in '+lead+' minutes'+(slot.room?' · '+slot.room:''),sound:soundEnabled?'schedule_chime.wav':null,data:{kind:'class',slotId:slot.id}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:at,channelId:'schedule-reminders'}});
        }
        for (const activity of activities.filter(x=>x.day===day)) {
          const at=new Date(date); at.setHours(Math.floor(activity.startMinutes/60),activity.startMinutes%60,0,0); at.setMinutes(at.getMinutes()-lead);
          if(at<=now) continue;
          await Notifications.scheduleNotificationAsync({content:{title:'Upcoming activity: '+activity.title,body:(activity.location||'Personal activity')+' · starts in '+lead+' minutes',data:{kind:'activity',activityId:activity.id}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:at,channelId:'schedule-reminders'}});
        }
      }
      for (const task of tasks) {
        const [y,m,d]=task.dueDate.split('-').map(Number), at=new Date(y,m-1,d,8,0,0,0);
        if(at>now) await Notifications.scheduleNotificationAsync({content:{title:'Task deadline: '+task.title,body:'This task is due today.',data:{kind:'task',taskId:task.id}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:at,channelId:'schedule-reminders'}});
      }
    } catch (error) { console.warn('Reminder scheduling failed', error); }
  };

  useEffect(() => { if (db && !busy) scheduleReminderRefresh(db); }, [db, busy, refresh, remindersEnabled, leadMinutes, soundEnabled, vibrationEnabled]);

  const addClass = async () => {
    try {
      const code=(form.code||'').trim().toUpperCase(), name=(form.subjectName||'').trim();
      if(!code||!name) throw new Error('Enter the subject code and name.');
      const day=Number(form.day||'1'), startMinutes=parseTime(form.start||'08:00'), endMinutes=parseTime(form.end||'09:00');
      if(day<1||day>6||endMinutes<=startMinutes) throw new Error('Choose Monday–Saturday and a valid time range.');
      let subject=await db.getFirstAsync('SELECT * FROM subjects WHERE code=?',code);
      if(!subject){const result=await db.runAsync('INSERT INTO subjects (code,name,professor,lectureRoom,labRoom,color,createdAt) VALUES (?,?,?,?,?,?,?)',code,name,form.professor||'',form.room||'',form.labRoom||'','forest',new Date().toISOString()); subject={id:result.lastInsertRowId,code,name};}
      const entries=await db.getAllAsync('SELECT startMinutes,endMinutes FROM scheduleSlots WHERE day=? AND active=1 UNION ALL SELECT startMinutes,endMinutes FROM activities WHERE day=?',day,day);
      if(hasTimeConflict(entries, { startMinutes, endMinutes })) throw new Error('This time overlaps an existing class or activity. Nothing was changed.');
      await db.runAsync('INSERT INTO scheduleSlots (subjectId,day,startMinutes,endMinutes,kind,room,active,createdAt) VALUES (?,?,?,?,?,?,1,?)',subject.id,day,startMinutes,endMinutes,form.kind==='Lab'?'Lab':'Lecture',form.room||'',new Date().toISOString());
      resetForm(); changed();
    } catch(error){showError(error);}
  };

  const saveActivity = async () => {
    try {
      const activity = normalizeActivityInput({
        title: form.activityTitle,
        day: Number(form.activityDay || '1'),
        startMinutes: parseTime(form.activityStart || '10:00'),
        endMinutes: parseTime(form.activityEnd || '11:00'),
        location: form.activityLocation || '',
        notes: form.activityNotes || '',
      });
      const editingId = Number(form.activityId || 0);
      const [slots, activities] = await Promise.all([
        db.getAllAsync('SELECT startMinutes,endMinutes FROM scheduleSlots WHERE day=? AND active=1', activity.day),
        db.getAllAsync('SELECT id,startMinutes,endMinutes FROM activities WHERE day=?', activity.day),
      ]);
      const otherActivities = activities.filter(item => item.id !== editingId);
      if (hasTimeConflict([...slots, ...otherActivities], activity)) {
        throw new Error('Schedule conflict: this activity overlaps an existing class or activity. Nothing was changed.');
      }
      if (editingId) {
        await db.runAsync('UPDATE activities SET title=?,day=?,startMinutes=?,endMinutes=?,location=?,notes=?,updatedAt=? WHERE id=?',
          activity.title, activity.day, activity.startMinutes, activity.endMinutes, activity.location, activity.notes, new Date().toISOString(), editingId);
      } else {
        await db.runAsync('INSERT INTO activities (title,day,startMinutes,endMinutes,location,notes,createdAt) VALUES (?,?,?,?,?,?,?)',
          activity.title, activity.day, activity.startMinutes, activity.endMinutes, activity.location, activity.notes, new Date().toISOString());
      }
      resetForm();
      changed();
    } catch (error) { showError(error); }
  };
  const editActivity = (activity) => setForm({
    activityId: String(activity.id),
    activityTitle: activity.title,
    activityDay: String(activity.day),
    activityStart: timeInput(activity.startMinutes),
    activityEnd: timeInput(activity.endMinutes),
    activityLocation: activity.location || '',
    activityNotes: activity.notes || '',
  });
  const addExpense = async () => {
    try {
      const amount = parseAmount(form.amount);
      const description = (form.description || '').trim();
      const categoryName = (form.category || '').trim();
      const date = (form.expenseDate || todayKey()).trim();
      if (!description) throw new Error('Enter what the expense was for.');
      if (!isValidDateKey(date)) throw new Error('Enter a valid expense date using YYYY-MM-DD.');
      let category = null;
      if (categoryName) {
        category = await db.getFirstAsync("SELECT * FROM categories WHERE lower(name)=lower(?) AND type='expense' AND active=1", categoryName);
        if (!category) {
          const result = await db.runAsync("INSERT INTO categories (name,type,active) VALUES (?,'expense',1)", categoryName);
          category = { id: result.lastInsertRowId };
        }
      }
      await db.runAsync('INSERT INTO expenses (amount,description,categoryId,date,createdAt) VALUES (?,?,?,?,?)',
        amount, description, category?.id ?? null, date, new Date().toISOString());
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addAllowance = async () => {
    try {
      const amount = parseAmount(form.allowanceAmount);
      const period = (form.allowancePeriod || 'weekly').toLowerCase();
      const range = getAllowanceRange(period);
      await db.runAsync('INSERT INTO allowances (amount,period,startDate,endDate,createdAt) VALUES (?,?,?,?,?)',
        amount, period, range.startDate, range.endDate, new Date().toISOString());
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addIncome = async () => {
    try {
      const amount = parseAmount(form.incomeAmount);
      const source = (form.source || '').trim();
      const date = (form.incomeDate || todayKey()).trim();
      if (!source) throw new Error('Enter an income source.');
      if (!isValidDateKey(date)) throw new Error('Enter a valid income date using YYYY-MM-DD.');
      await db.runAsync('INSERT INTO income (amount,source,date,createdAt) VALUES (?,?,?,?)',
        amount, source, date, new Date().toISOString());
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addSavingsGoal = async () => {
    try {
      const title = (form.goalTitle || '').trim();
      const target = parseAmount(form.goalTargetAmount);
      if (!title) throw new Error('Enter a savings goal name.');
      await db.runAsync('INSERT INTO savingsGoals (title,targetAmount,createdAt) VALUES (?,?,?)',
        title, target, new Date().toISOString());
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addSavingsEntry = async () => {
    try {
      const goalId = Number(form.savingGoalId);
      const amount = parseAmount(form.savingAmount);
      const type = form.savingType || 'deposit';
      const date = (form.savingDate || todayKey()).trim();
      if (!Number.isInteger(goalId) || goalId <= 0) throw new Error('Choose a savings goal.');
      if (!['deposit', 'withdrawal'].includes(type)) throw new Error('Choose deposit or withdrawal.');
      if (!isValidDateKey(date)) throw new Error('Enter a valid savings date using YYYY-MM-DD.');
      await db.withTransactionAsync(async () => {
        const goal = await db.getFirstAsync('SELECT id FROM savingsGoals WHERE id=?', goalId);
        if (!goal) throw new Error('This savings goal no longer exists.');
        const entries = await db.getAllAsync('SELECT amount,type FROM savingsEntries WHERE goalId=?', goalId);
        if (type === 'withdrawal') validateSavingsWithdrawal(entries, amount);
        await db.runAsync('INSERT INTO savingsEntries (goalId,amount,type,date) VALUES (?,?,?,?)',
          goalId, amount, type, date);
      });
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addCategoryLimit = async () => {
    try {
      const categoryId = Number(form.limitCategoryId);
      const amount = parseAmount(form.limitAmount);
      const period = (form.limitPeriod || 'weekly').toLowerCase();
      if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error('Choose an expense category.');
      const category = await db.getFirstAsync("SELECT id FROM categories WHERE id=? AND type='expense' AND active=1", categoryId);
      if (!category) throw new Error('The selected expense category is unavailable.');
      const range = getAllowanceRange(period);
      const existing = await db.getFirstAsync(
        'SELECT id FROM categoryBudgets WHERE categoryId=? AND period=? AND startDate=? AND endDate=? ORDER BY id LIMIT 1',
        categoryId, period, range.startDate, range.endDate
      );
      if (existing) {
        await db.runAsync('UPDATE categoryBudgets SET amount=? WHERE id=?', amount, existing.id);
      } else {
        await db.runAsync('INSERT INTO categoryBudgets (categoryId,amount,period,startDate,endDate) VALUES (?,?,?,?,?)',
          categoryId, amount, period, range.startDate, range.endDate);
      }
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const addNote = async () => {
    try {
      const note = normalizeNativeNote({
        title: form.noteTitle,
        content: form.noteContent,
        kind: form.noteKind || 'personal',
        subjectId: form.noteSubjectId || null,
        pinned: form.notePinned,
      });
      if (note.subjectId) {
        const subject = await db.getFirstAsync('SELECT id FROM subjects WHERE id=?', note.subjectId);
        if (!subject) throw new Error('The selected subject no longer exists.');
      }
      const now = new Date().toISOString();
      const editingId = Number(form.noteId || 0);
      if (editingId) {
        const existing = await db.getFirstAsync('SELECT id FROM notes WHERE id=?', editingId);
        if (!existing) throw new Error('This note no longer exists.');
        await db.runAsync('UPDATE notes SET title=?,content=?,kind=?,subjectId=?,pinned=?,updatedAt=? WHERE id=?',
          note.title, note.content, note.kind, note.subjectId, note.pinned ? 1 : 0, now, editingId);
      } else {
        await db.runAsync('INSERT INTO notes (title,content,kind,subjectId,updatedAt,archived,pinned) VALUES (?,?,?,?,?,0,?)',
          note.title, note.content, note.kind, note.subjectId, now, note.pinned ? 1 : 0);
      }
      resetForm();
      setNoteEditorOpen(false);
      changed();
    } catch (error) { showError(error); }
  };
  const startNewNote = () => {
    setForm({ noteTitle: '', noteContent: '', noteKind: 'personal', noteSubjectId: '', notePinned: false });
    setNoteEditorOpen(true);
  };
  const startEditNote = (note) => {
    setForm({
      noteId: String(note.id),
      noteTitle: note.title || '',
      noteContent: note.content || '',
      noteKind: note.kind || 'personal',
      noteSubjectId: note.subjectId ? String(note.subjectId) : '',
      notePinned: Boolean(note.pinned),
    });
    setNoteEditorOpen(true);
  };
  const toggleNotePinned = async (note) => {
    try {
      await db.runAsync('UPDATE notes SET pinned=?,updatedAt=? WHERE id=?',
        note.pinned ? 0 : 1, new Date().toISOString(), note.id);
      changed();
    } catch (error) { showError(error); }
  };
  const toggleNoteArchived = async (note) => {
    try {
      await db.runAsync('UPDATE notes SET archived=?,updatedAt=? WHERE id=?',
        note.archived ? 0 : 1, new Date().toISOString(), note.id);
      changed();
    } catch (error) { showError(error); }
  };
  const saveTask = async () => {
    try {
      const task = normalizeNativeTask({
        title: form.taskTitle,
        description: form.taskDescription,
        dueDate: form.taskDueDate,
        priority: form.taskPriority || 'Normal',
        subjectId: form.taskSubjectId || null,
      });
      if (task.subjectId) {
        const subject = await db.getFirstAsync('SELECT id FROM subjects WHERE id=?', task.subjectId);
        if (!subject) throw new Error('The selected subject no longer exists.');
      }
      const now = new Date().toISOString();
      const editingId = Number(form.taskId || 0);
      if (editingId) {
        const existing = await db.getFirstAsync('SELECT id FROM tasks WHERE id=?', editingId);
        if (!existing) throw new Error('This task no longer exists.');
        await db.runAsync('UPDATE tasks SET title=?,description=?,subjectId=?,dueDate=?,priority=?,updatedAt=? WHERE id=?',
          task.title, task.description, task.subjectId, task.dueDate, task.priority, now, editingId);
      } else {
        await db.runAsync('INSERT INTO tasks (title,description,subjectId,dueDate,priority,completed,createdAt,updatedAt) VALUES (?,?,?,?,?,0,?,?)',
          task.title, task.description, task.subjectId, task.dueDate, task.priority, now, now);
      }
      resetForm(); changed();
    } catch (error) { showError(error); }
  };
  const startEditTask = (task) => {
    setForm({
      taskId: String(task.id),
      taskTitle: task.title || '',
      taskDescription: task.description || '',
      taskSubjectId: task.subjectId ? String(task.subjectId) : '',
      taskDueDate: task.dueDate || '',
      taskPriority: task.priority || 'Normal',
    });
  };
  const addChecklistItem = async (task) => {
    try {
      const key = 'checklist_' + task.id;
      const text = String(form[key] || '').trim();
      if (!text) throw new Error('Enter a checklist item.');
      const parent = await db.getFirstAsync('SELECT id FROM tasks WHERE id=?', task.id);
      if (!parent) throw new Error('This task no longer exists.');
      const position = await db.getFirstAsync('SELECT COALESCE(MAX(position),-1)+1 AS nextPosition FROM taskChecklist WHERE taskId=?', task.id);
      await db.runAsync('INSERT INTO taskChecklist (taskId,text,position,completed) VALUES (?,?,?,0)',
        task.id, text, Number(position?.nextPosition || 0));
      setForm(current => ({ ...current, [key]: '' }));
      changed();
    } catch (error) { showError(error); }
  };
  const toggleChecklistItem = async (item) => {
    try {
      await db.runAsync('UPDATE taskChecklist SET completed=? WHERE id=?', item.completed ? 0 : 1, item.id);
      changed();
    } catch (error) { showError(error); }
  };
  const saveProfile = async () => {
    try { await db.runAsync('UPDATE profile SET displayName=?,program=?,yearSection=?,updatedAt=? WHERE id=?',(form.displayName??data.profile.displayName??'').trim(),(form.program??data.profile.program??'').trim(),(form.yearSection??data.profile.yearSection??'').trim(),new Date().toISOString(),'local'); resetForm(); changed(); Alert.alert('Saved','Your profile is stored only on this device.'); }
    catch(error){showError(error);}
  };
  const exportBackup = async () => {
    try {
      const backup = await exportNativeBackup();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uri = FileSystem.cacheDirectory + 'schedule-backup-' + stamp + '.json';
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Schedule backup' });
      } else {
        Alert.alert('Backup created', 'The backup was saved to the app cache, but sharing is unavailable on this device.');
      }
    } catch (error) { showError(error); }
  };
  const importBackup = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/json'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets?.length) return;
      const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
      let payload;
      try { payload = JSON.parse(raw); } catch { throw new Error('The selected file is not valid JSON.'); }
      Alert.alert(
        'Replace local planner data?',
        'Importing this backup replaces the records currently stored on this device. Export a backup of your current data first if you may need it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Replace and import', style: 'destructive', onPress: async () => {
            try {
              const count = await restoreNativeBackup(payload);
              await refreshData(db);
              changed();
              Alert.alert('Import complete', count + ' records were restored to this device.');
            } catch (error) { showError(error); }
          } },
        ],
      );
    } catch (error) { showError(error); }
  };
  const remove = async (table,id) => Alert.alert('Delete record?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{if(table==='savingsGoals'){await db.withTransactionAsync(async()=>{await db.runAsync('DELETE FROM savingsEntries WHERE goalId=?',id);await db.runAsync('DELETE FROM savingsGoals WHERE id=?',id);});}else if(table==='tasks'){await db.withTransactionAsync(async()=>{await db.runAsync('DELETE FROM taskChecklist WHERE taskId=?',id);await db.runAsync('DELETE FROM tasks WHERE id=?',id);});}else{await db.runAsync('DELETE FROM '+table+' WHERE id=?',id);}changed();}catch(e){showError(e);}}}]);
  const toggleTask = async (task) => { try { await db.runAsync('UPDATE tasks SET completed=?,updatedAt=? WHERE id=?',task.completed?0:1,new Date().toISOString(),task.id); changed(); } catch (error) { showError(error); } };

  const renderHome = () => <><Heading detail={DAYS[new Date().getDay()]+' · '+todayKey()}>{data.profile.displayName ? 'Welcome back, '+data.profile.displayName : 'Your day, organized.'}</Heading>
    {(data.profile.program||data.profile.yearSection)?<Text style={[styles.profileLine,{color:ACTIVE_COLORS.muted}]}>{[data.profile.program,data.profile.yearSection].filter(Boolean).join(' · ')}</Text>:null}
    <View style={styles.stats}><Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>TODAY'S CLASSES</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.classes.length}</Text></Card><Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>PENDING TASKS</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.tasks.filter(x=>!x.completed).length}</Text></Card><Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>MONEY AVAILABLE</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(availableBalance)}</Text></Card><Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>SAVINGS GOALS</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.goals.length}</Text></Card></View>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Today's classes</Text>{data.classes.length?data.classes.map(x=><Item key={x.id} title={x.code||x.subjectName||'Class'} detail={(x.room||'Room not set')+' · '+x.kind+' · '+timeLabel(x.startMinutes)+'–'+timeLabel(x.endMinutes)}/>):<Empty text="No classes scheduled for today."/>}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Recent expenses</Text>{data.expenses.slice(0,4).map(x=><Item key={x.id} title={x.description} detail={x.date} trailing={'−'+peso(x.amount)}/>)}{!data.expenses.length?<Empty text="Your expenses will appear here."/>:null}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Tasks to finish</Text>{data.tasks.filter(x=>!x.completed).slice(0,4).map(x=><Item key={x.id} title={x.title} detail={x.dueDate?'Due '+x.dueDate:'No due date'}/>)}{!data.tasks.some(x=>!x.completed)?<Empty text="No pending tasks."/>:null}</Card>
  </>;

  const renderSchedule = () => <><Heading detail="Monday–Saturday · Local timetable">Schedule</Heading><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add a class</Text><Field label="Subject code" value={form.code||''} onChangeText={v=>updateForm('code',v)} placeholder="e.g. ITEC 80"/><Field label="Subject name" value={form.subjectName||''} onChangeText={v=>updateForm('subjectName',v)}/><Field label="Professor (optional)" value={form.professor||''} onChangeText={v=>updateForm('professor',v)}/><Field label="Room" value={form.room||''} onChangeText={v=>updateForm('room',v)}/><Field label="Day (1=Mon … 6=Sat)" value={form.day||'1'} onChangeText={v=>updateForm('day',v)} keyboardType="number-pad"/><Field label="Start (24-hour)" value={form.start||'08:00'} onChangeText={v=>updateForm('start',v)}/><Field label="End (24-hour)" value={form.end||'09:00'} onChangeText={v=>updateForm('end',v)}/><Field label="Type (Lecture or Lab)" value={form.kind||'Lecture'} onChangeText={v=>updateForm('kind',v)}/><Button title="Add class" onPress={addClass}/></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>{form.activityId?'Edit personal activity':'Add personal activity'}</Text><Field label="Activity title" value={form.activityTitle||''} onChangeText={v=>updateForm('activityTitle',v)}/><Field label="Day (1=Mon … 6=Sat)" value={form.activityDay||'1'} onChangeText={v=>updateForm('activityDay',v)} keyboardType="number-pad"/><Field label="Start (24-hour)" value={form.activityStart||'10:00'} onChangeText={v=>updateForm('activityStart',v)}/><Field label="End (24-hour)" value={form.activityEnd||'11:00'} onChangeText={v=>updateForm('activityEnd',v)}/><Field label="Location (optional)" value={form.activityLocation||''} onChangeText={v=>updateForm('activityLocation',v)}/><Field label="Notes (optional)" value={form.activityNotes||''} onChangeText={v=>updateForm('activityNotes',v)} multiline/><Button title={form.activityId?'Save activity changes':'Add activity'} onPress={saveActivity}/>{form.activityId?<Button title="Cancel editing" secondary onPress={()=>setForm({})}/>:null}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Weekly timetable · Classes</Text>{data.allClasses.length?data.allClasses.map(x=><Item key={x.id} title={DAYS[x.day]+' · '+(x.code||x.subjectName)+' · '+x.kind} detail={(x.room||'No room')+' · '+timeLabel(x.startMinutes)+'–'+timeLabel(x.endMinutes)} onDelete={()=>remove('scheduleSlots',x.id)}/>):<Empty text="No class entries yet."/>}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Personal activities</Text>{data.allActivities.length?data.allActivities.map(x=><Item key={x.id} title={DAYS[x.day]+' · '+x.title} detail={timeLabel(x.startMinutes)+'–'+timeLabel(x.endMinutes)+(x.location?' · '+x.location:'')+(x.notes?' · '+x.notes:'')} onPress={()=>editActivity(x)} onDelete={()=>remove('activities',x.id)}/>):<Empty text="No personal activities yet."/>}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Subjects</Text>{data.subjects.map(x=><Item key={x.id} title={x.code+' — '+x.name} detail={x.professor||'Professor not set'}/>)}</Card>
  </>;

  const renderBudget = () => {
    const currentDate = todayKey();
    const totals = calculateFinanceSummary(data, currentDate);
    const report = summarizeBudgetTransactions(data.income, data.expenses, reportPeriod, new Date());
    const activeLimits = data.categoryBudgets.filter(item => item.startDate <= currentDate && item.endDate >= currentDate);
    const actions = [
      { id: 'expense', label: 'Expense' },
      { id: 'income', label: 'Income' },
      { id: 'allowance', label: 'Allowance' },
      { id: 'goal', label: 'Savings goal' },
      { id: 'saving', label: 'Savings activity' },
      { id: 'limit', label: 'Category limit' },
    ];
    return <>
      <Heading detail="Allowance, spending, and savings · stored locally">Budget</Heading>
      <View style={styles.stats}>
        <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>AVAILABLE BALANCE</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(totals.availableBalance)}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Active allowance + income − expenses</Text></Card>
        <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>ALLOWANCE TODAY</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(totals.allowanceTotal)}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Current allowance periods</Text></Card>
        <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>TOTAL INCOME</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(totals.incomeTotal)}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>All recorded income</Text></Card>
        <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>TOTAL EXPENSES</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(totals.expenseTotal)}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>All recorded expenses</Text></Card>
      </View>

      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add a record</Text>
        <View style={styles.budgetActionRow}>
          {actions.map(action => <Button key={action.id} compact secondary={form.budgetAction!==action.id} title={action.label} onPress={()=>updateForm('budgetAction',action.id)}/>)}
        </View>
        {(!form.budgetAction || form.budgetAction==='expense') && <>
          <Field label="What did you spend on?" value={form.description||''} onChangeText={v=>updateForm('description',v)} placeholder="Lunch, fare, school supplies…"/>
          <Field label="Amount (₱)" value={form.amount||''} onChangeText={v=>updateForm('amount',v)} keyboardType="decimal-pad"/>
          <Field label="Expense category" value={form.category||'Food'} onChangeText={v=>updateForm('category',v)} placeholder="Food, Transportation, School…"/>
          <Field label="Date (YYYY-MM-DD)" value={form.expenseDate||currentDate} onChangeText={v=>updateForm('expenseDate',v)} placeholder={currentDate}/>
          <Button title="Save expense" onPress={addExpense}/>
        </>}
        {form.budgetAction==='income' && <>
          <Field label="Income source" value={form.source||''} onChangeText={v=>updateForm('source',v)} placeholder="Allowance, part-time work…"/>
          <Field label="Amount (₱)" value={form.incomeAmount||''} onChangeText={v=>updateForm('incomeAmount',v)} keyboardType="decimal-pad"/>
          <Field label="Date (YYYY-MM-DD)" value={form.incomeDate||currentDate} onChangeText={v=>updateForm('incomeDate',v)} placeholder={currentDate}/>
          <Button title="Add income" onPress={addIncome}/>
        </>}
        {form.budgetAction==='allowance' && <>
          <Field label="Amount (₱)" value={form.allowanceAmount||''} onChangeText={v=>updateForm('allowanceAmount',v)} keyboardType="decimal-pad"/>
          <Field label="Period (daily / weekly / monthly)" value={form.allowancePeriod||'weekly'} onChangeText={v=>updateForm('allowancePeriod',v)} placeholder="weekly"/>
          <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Weekly allowance runs Monday to Sunday. Monthly allowance follows the calendar month.</Text>
          <Button title="Save allowance" onPress={addAllowance}/>
        </>}
        {form.budgetAction==='goal' && <>
          <Field label="Savings goal name" value={form.goalTitle||''} onChangeText={v=>updateForm('goalTitle',v)} placeholder="New laptop, emergency fund…"/>
          <Field label="Target amount (₱)" value={form.goalTargetAmount||''} onChangeText={v=>updateForm('goalTargetAmount',v)} keyboardType="decimal-pad"/>
          <Button title="Create savings goal" onPress={addSavingsGoal}/>
        </>}
        {form.budgetAction==='saving' && <>
          <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Savings goal</Text>
          {data.goals.length ? <View style={styles.budgetActionRow}>{data.goals.map(goal=><Button key={goal.id} compact secondary={String(goal.id)!==String(form.savingGoalId||'')} title={goal.title} onPress={()=>updateForm('savingGoalId',String(goal.id))}/>)}</View> : <Empty text="Create a savings goal before recording deposits or withdrawals."/>}
          <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Savings action</Text>
          <View style={styles.budgetActionRow}>
            <Button compact secondary={(form.savingType||'deposit')!=='deposit'} title="Deposit" onPress={()=>updateForm('savingType','deposit')}/>
            <Button compact secondary={form.savingType!=='withdrawal'} title="Withdraw" onPress={()=>updateForm('savingType','withdrawal')}/>
          </View>
          <Field label="Amount (₱)" value={form.savingAmount||''} onChangeText={v=>updateForm('savingAmount',v)} keyboardType="decimal-pad"/>
          <Field label="Date (YYYY-MM-DD)" value={form.savingDate||currentDate} onChangeText={v=>updateForm('savingDate',v)} placeholder={currentDate}/>
          <Button title="Save savings activity" onPress={addSavingsEntry} />
        </>}
        {form.budgetAction==='limit' && <>
          <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Expense category</Text>
          {data.categories.length ? <View style={styles.budgetActionRow}>{data.categories.map(category=><Button key={category.id} compact secondary={String(category.id)!==String(form.limitCategoryId||'')} title={category.name} onPress={()=>updateForm('limitCategoryId',String(category.id))}/>)}</View> : <Empty text="Create an expense category first by saving an expense."/>}
          <Field label="Spending limit (₱)" value={form.limitAmount||''} onChangeText={v=>updateForm('limitAmount',v)} keyboardType="decimal-pad"/>
          <Field label="Period (daily / weekly / monthly)" value={form.limitPeriod||'weekly'} onChangeText={v=>updateForm('limitPeriod',v)} placeholder="weekly"/>
          <Button title="Save category limit" onPress={addCategoryLimit}/>
        </>}
      </Card>

      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Category spending limits</Text>
        {activeLimits.length ? activeLimits.map(limit=>{
          const category=data.categories.find(item=>item.id===limit.categoryId);
          if(!category)return null;
          const usage=calculateCategoryUsage(limit.amount,data.expenses.filter(item=>item.categoryId===limit.categoryId&&item.date>=limit.startDate&&item.date<=limit.endDate));
          return <View key={limit.id} style={styles.limitRow}>
            <View style={styles.rowBetween}>
              <View style={styles.itemText}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{category.name} · {limit.period}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{peso(usage.spent)} spent of {peso(limit.amount)}</Text></View>
              <Button compact secondary title="Delete" onPress={()=>remove('categoryBudgets',limit.id)}/>
            </View>
            <View style={[styles.progressTrack,{backgroundColor:ACTIVE_COLORS.soft}]}><View style={[styles.progressFill,{width:usage.percent+'%',backgroundColor:usage.exceeded?ACTIVE_COLORS.red:ACTIVE_COLORS.forest}]}/></View>
            <Text style={[styles.itemDetail,{color:usage.exceeded?ACTIVE_COLORS.red:ACTIVE_COLORS.muted}]}>{usage.exceeded?'Over by '+peso(-usage.remaining):peso(usage.remaining)+' remaining'} · {usage.percent}% used</Text>
          </View>;
        }) : <Empty text="No active category limits. Add a limit to monitor spending."/>}
      </Card>

      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Savings goals</Text>
        {data.goals.length ? data.goals.map(goal=>{
          const saved=Number(goal.savedAmount||0);
          const percent=goal.targetAmount>0?Math.min(100,Math.round(saved/goal.targetAmount*100)):0;
          return <View key={goal.id} style={styles.goalRow}>
            <View style={styles.rowBetween}>
              <View style={styles.itemText}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{goal.title}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{peso(saved)} saved of {peso(goal.targetAmount)}</Text></View>
              <Button compact secondary title="Delete" onPress={()=>remove('savingsGoals',goal.id)}/>
            </View>
            <View style={[styles.progressTrack,{backgroundColor:ACTIVE_COLORS.soft}]}><View style={[styles.progressFill,{width:percent+'%',backgroundColor:ACTIVE_COLORS.forest}]}/></View>
            <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{percent}% saved</Text>
          </View>;
        }) : <Empty text="Create a goal to track your savings progress."/>}
        <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Recent savings activity</Text>
        {data.savingsEntries.slice(0,6).map(entry=>{
          const goal=data.goals.find(item=>item.id===entry.goalId);
          return <Item key={entry.id} title={(entry.type==='withdrawal'?'−':' +').trim()+peso(entry.amount)+' · '+(goal?.title||'Savings goal')} detail={entry.date} trailing={entry.type==='withdrawal'?'Withdrawn':'Deposited'}/>;
        })}
        {!data.savingsEntries.length?<Empty text="No deposits or withdrawals yet."/>:null}
      </Card>

      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Money report</Text>
        <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{report.label}{report.startDate?' · '+report.startDate+' to '+report.endDate:' · all recorded dates'}</Text>
        <View style={styles.budgetActionRow}>
          {['today','week','month','all'].map(period=><Button key={period} compact secondary={reportPeriod!==period} title={period==='all'?'All time':period==='week'?'Week':period==='month'?'Month':'Today'} onPress={()=>setReportPeriod(period)}/>)}
        </View>
        <View style={styles.stats}>
          <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>INCOME</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(report.incomeTotal)}</Text></Card>
          <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>EXPENSES</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.ink}]}>{peso(report.expenseTotal)}</Text></Card>
          <Card style={styles.stat}><Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>NET</Text><Text style={[styles.statValue,{color:report.net>=0?ACTIVE_COLORS.forest:ACTIVE_COLORS.red}]}>{peso(report.net)}</Text></Card>
        </View>
        <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{report.transactionCount} transaction{report.transactionCount===1?'':'s'} in this range</Text>
        {report.transactions.slice(0,12).map(item=><Item key={item.table+'-'+item.id} title={item.label} detail={item.kind+' · '+item.date} trailing={(item.sign>0?'+':'−')+peso(item.amount)} onDelete={()=>remove(item.table,item.id)}/>)}
        {!report.transactionCount?<Empty text="No income or expenses in this date range."/>:null}
        {report.transactionCount>12?<Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Showing the latest 12 of {report.transactionCount} transactions.</Text>:null}
      </Card>

      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Allowances</Text>
        {data.allowances.map(item=><Item key={item.id} title={peso(item.amount)+' · '+item.period} detail={item.startDate+' to '+item.endDate} onDelete={()=>remove('allowances',item.id)}/>)}
        {!data.allowances.length?<Empty text="No allowance periods recorded."/>:null}
      </Card>
    </>;
  };
  const renderNotes = () => {
    const visibleNotes = filterNativeNotes(data.notes, noteSearch, noteKindFilter, showArchivedNotes);
    const subjectName = id => data.subjects.find(subject => subject.id === id)?.code || '';
    return <>
      <Heading detail="Personal, lecture, and subject-linked notes stored locally.">Notepad</Heading>
      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Find notes</Text>
        <Field label="Search titles and note content" value={noteSearch} onChangeText={setNoteSearch} placeholder="Search notes"/>
        <View style={styles.budgetActionRow}>
          {['all','personal','lecture','subject'].map(kind=><Button key={kind} compact secondary={noteKindFilter!==kind} title={kind==='all'?'All':kind[0].toUpperCase()+kind.slice(1)} onPress={()=>setNoteKindFilter(kind)}/>)}
          <Button compact secondary={!showArchivedNotes} title={showArchivedNotes?'Archived':'Archive'} onPress={()=>setShowArchivedNotes(value=>!value)}/>
        </View>
        <Button title={noteEditorOpen?'Close editor':'New note'} onPress={()=>noteEditorOpen?setNoteEditorOpen(false):startNewNote()}/>
        {noteEditorOpen && <>
          <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>{form.noteId?'Edit note':'New note'}</Text>
          <Field label="Title" value={form.noteTitle||''} onChangeText={v=>updateForm('noteTitle',v)} placeholder="Note title"/>
          <Field label="Content" value={form.noteContent||''} onChangeText={v=>updateForm('noteContent',v)} multiline placeholder="Write your notes here…"/>
          <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Note type</Text>
          <View style={styles.budgetActionRow}>
            {['personal','lecture','subject'].map(kind=><Button key={kind} compact secondary={(form.noteKind||'personal')!==kind} title={kind[0].toUpperCase()+kind.slice(1)} onPress={()=>{updateForm('noteKind',kind);if(kind!=='subject')updateForm('noteSubjectId','');}}/>)}
          </View>
          {form.noteKind==='subject' && <>
            <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Linked subject</Text>
            {data.subjects.length ? <View style={styles.budgetActionRow}>{data.subjects.map(subject=><Button key={subject.id} compact secondary={String(form.noteSubjectId||'')!==String(subject.id)} title={subject.code} onPress={()=>updateForm('noteSubjectId',String(subject.id))}/>)}</View> : <Empty text="Add a subject in Schedule before linking a note."/>}
          </>}
          <Button secondary title={form.notePinned?'Unpin this note':'Pin this note'} onPress={()=>updateForm('notePinned',!form.notePinned)}/>
          <Button title={form.noteId?'Save note changes':'Save note'} onPress={addNote}/>
          <Button secondary title="Cancel" onPress={()=>{resetForm();setNoteEditorOpen(false);}}/>
        </>}
      </Card>
      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>{showArchivedNotes?'Archived notes':'Saved notes'} · {visibleNotes.length}</Text>
        {visibleNotes.map(note=><View key={note.id} style={styles.noteRow}>
          <View style={styles.rowBetween}>
            <View style={styles.itemText}>
              <Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{note.pinned?'★ ':''}{note.title}</Text>
              <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.forest}]}>{note.kind||'personal'}{note.subjectId&&subjectName(note.subjectId)?' · '+subjectName(note.subjectId):''}</Text>
            </View>
            <Button compact secondary title="Edit" onPress={()=>startEditNote(note)}/>
          </View>
          <Text style={[styles.noteBody,{color:ACTIVE_COLORS.ink}]}>{note.content}</Text>
          <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Updated {(note.updatedAt||'').slice(0,16).replace('T',' ')}</Text>
          <View style={styles.budgetActionRow}>
            <Button compact secondary title={note.pinned?'Unpin':'Pin'} onPress={()=>toggleNotePinned(note)}/>
            <Button compact secondary title={note.archived?'Restore':'Archive'} onPress={()=>toggleNoteArchived(note)}/>
            <Button compact secondary danger title="Delete" onPress={()=>remove('notes',note.id)}/>
          </View>
        </View>)}
        {!visibleNotes.length?<Empty text={showArchivedNotes?'No archived notes.':noteSearch?'No notes match your search.':'Your notes will appear here.'}/>:null}
      </Card>
      <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Notes are stored in the local SQLite database and remain available offline.</Text>
    </>;
  };
  const renderTasks = () => {
    const visibleTasks = filterNativeTasks(data.tasks, taskView, taskSearch, todayKey());
    const subjectCode = id => data.subjects.find(subject => subject.id === id)?.code || '';
    return <>
      <Heading detail="Assignments, due dates, priorities, and step-by-step checklists.">Tasks</Heading>
      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>{form.taskId?'Edit task':'New task'}</Text>
        <Field label="Task title" value={form.taskTitle||''} onChangeText={v=>updateForm('taskTitle',v)} placeholder="Assignment, exam, project…"/>
        <Field label="Description (optional)" value={form.taskDescription||''} onChangeText={v=>updateForm('taskDescription',v)} multiline placeholder="Add details or instructions…"/>
        <Field label="Due date (YYYY-MM-DD, optional)" value={form.taskDueDate||''} onChangeText={v=>updateForm('taskDueDate',v)} placeholder="YYYY-MM-DD"/>
        <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Priority</Text>
        <View style={styles.budgetActionRow}>
          {['Low','Normal','High'].map(priority=><Button key={priority} compact secondary={(form.taskPriority||'Normal')!==priority} title={priority} onPress={()=>updateForm('taskPriority',priority)}/>)}
        </View>
        <Text style={[styles.label,{color:ACTIVE_COLORS.muted}]}>Subject (optional)</Text>
        <View style={styles.budgetActionRow}>
          <Button compact secondary={Boolean(form.taskSubjectId)} title="No subject" onPress={()=>updateForm('taskSubjectId','')}/>
          {data.subjects.map(subject=><Button key={subject.id} compact secondary={String(form.taskSubjectId||'')!==String(subject.id)} title={subject.code} onPress={()=>updateForm('taskSubjectId',String(subject.id))}/>)}
        </View>
        <Button title={form.taskId?'Save task changes':'Add task'} onPress={saveTask}/>
        {form.taskId?<Button secondary title="Cancel editing" onPress={resetForm}/>:null}
      </Card>
      <Card>
        <Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Your tasks · {visibleTasks.length}</Text>
        <Field label="Search tasks" value={taskSearch} onChangeText={setTaskSearch} placeholder="Search titles and descriptions"/>
        <View style={styles.budgetActionRow}>
          {['pending','overdue','completed','all'].map(view=><Button key={view} compact secondary={taskView!==view} title={view==='all'?'All':view[0].toUpperCase()+view.slice(1)} onPress={()=>setTaskView(view)}/>)}
        </View>
        {visibleTasks.map(task=>{
          const items=data.taskChecklist.filter(item=>item.taskId===task.id);
          const doneCount=items.filter(item=>Boolean(item.completed)).length;
          const expanded=expandedTaskId===task.id;
          return <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskRow}>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={task.completed?'Mark '+task.title+' pending':'Mark '+task.title+' complete'} accessibilityState={{checked:Boolean(task.completed)}} onPress={()=>toggleTask(task)} style={[styles.check,task.completed&&styles.checked,task.completed&&{backgroundColor:ACTIVE_COLORS.forest,borderColor:ACTIVE_COLORS.forest}]}>
                <Text style={styles.checkText}>{task.completed?'✓':''}</Text>
              </Pressable>
              <View style={styles.itemText}>
                <Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink},task.completed&&styles.done]}>{task.title}</Text>
                <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{task.dueDate?'Due '+task.dueDate:'No due date'}{task.subjectId&&subjectCode(task.subjectId)?' · '+subjectCode(task.subjectId):''} · {task.priority||'Normal'} priority</Text>
              </View>
              <Button compact secondary title="Edit" onPress={()=>startEditTask(task)}/>
              <Button compact secondary danger title="Delete" onPress={()=>remove('tasks',task.id)}/>
            </View>
            {task.description?<Text style={[styles.taskDescription,{color:ACTIVE_COLORS.muted}]}>{task.description}</Text>:null}
            <View style={styles.rowBetween}>
              <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Checklist · {doneCount}/{items.length}</Text>
              <Button compact secondary title={expanded?'Hide checklist':'Open checklist'} onPress={()=>setExpandedTaskId(expanded?null:task.id)}/>
            </View>
            {expanded?<View style={styles.checklistPanel}>
              {items.map(item=><View key={item.id} style={styles.checklistRow}>
                <Pressable accessibilityRole="checkbox" accessibilityLabel={item.text} accessibilityState={{checked:Boolean(item.completed)}} onPress={()=>toggleChecklistItem(item)} style={[styles.check,Boolean(item.completed)&&styles.checked,Boolean(item.completed)&&{backgroundColor:ACTIVE_COLORS.forest,borderColor:ACTIVE_COLORS.forest}]}>
                  <Text style={styles.checkText}>{item.completed?'✓':''}</Text>
                </Pressable>
                <Text style={[styles.itemText,{color:ACTIVE_COLORS.ink},Boolean(item.completed)&&styles.done]}>{item.text}</Text>
                <Button compact secondary danger title="Remove" onPress={()=>remove('taskChecklist',item.id)}/>
              </View>)}
              <Field label="New checklist item" value={form['checklist_'+task.id]||''} onChangeText={v=>updateForm('checklist_'+task.id,v)} placeholder="Break the task into a step…"/>
              <Button secondary title="Add checklist item" onPress={()=>addChecklistItem(task)}/>
              {!items.length?<Empty text="No checklist items. Add steps to track progress."/>:null}
            </View>:null}
          </View>;
        })}
        {!visibleTasks.length?<Empty text={taskSearch?'No tasks match your search.':taskView==='overdue'?'No overdue tasks.':'No tasks in this view.'}/>:null}
      </Card>
      <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Tasks and checklist progress are saved locally and work offline.</Text>
    </>;
  };
  const saveAppearancePreference = async (id) => {
    if (!Object.prototype.hasOwnProperty.call(THEMES, id)) return;
    try {
      await setSetting('appearance', id);
      setAppearance(id);
    } catch (error) { showError(error); }
  };

  const saveNavigationPreferences = async (order, hidden) => {
    const preferences = normalizeNavigationPreferences({ order, hidden });
    try {
      await setSetting('navigationPreferences', JSON.stringify(preferences));
      setNavigationOrder(preferences.order);
      setHiddenTabs(preferences.hidden);
    } catch (error) {
      showError(error);
    }
  };
  const toggleNavigationModule = (id, visible) => {
    if (id === 'home' || id === 'settings') return;
    const nextHidden = visible ? hiddenTabs.filter(item => item !== id) : [...new Set([...hiddenTabs, id])];
    return saveNavigationPreferences(navigationOrder, nextHidden);
  };
  const moveNavigationModule = (id, direction) => {
    const modules = navigationOrder.filter(item => item !== 'home' && item !== 'settings');
    const from = modules.indexOf(id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= modules.length) return;
    [modules[from], modules[to]] = [modules[to], modules[from]];
    return saveNavigationPreferences(['home', ...modules, 'settings'], hiddenTabs);
  };
  const resetNavigationPreferences = () => saveNavigationPreferences(TABS.map(item => item.id), []);

  const renderSettings = () => <><Heading detail="Personalize your planner and manage local data.">Settings</Heading>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Appearance</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Choose the CampusOS-style color theme. Your choice is saved on this device and applied throughout the app.</Text>
      <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Light appearance only. Forest is the default CampusOS-inspired theme; choose Sunset or Monochrome to change the accent palette.</Text>
      {Object.entries(THEMES).map(([id, theme])=><Pressable key={id} accessibilityRole="radio" accessibilityLabel={theme.label+" appearance theme"} accessibilityState={{selected:appearance===id}} onPress={()=>saveAppearancePreference(id)} style={[styles.themeOption,{borderColor:appearance===id?theme.forest:theme.line,backgroundColor:theme.cream}]}>
        <View style={styles.themeSwatches}><View style={[styles.themeSwatch,{backgroundColor:theme.forest}]}/><View style={[styles.themeSwatch,{backgroundColor:theme.white,borderColor:theme.line,borderWidth:1}]}/><View style={[styles.themeSwatch,{backgroundColor:theme.soft}]}/></View>
        <View style={styles.itemText}><Text style={[styles.itemTitle,{color:theme.ink}]}>{theme.label}</Text><Text style={[styles.itemDetail,{color:theme.muted}]}>{theme.description}</Text></View>
        <View style={[styles.themeRadio,{borderColor:theme.forest}]}>{appearance===id?<View style={[styles.themeRadioSelected,{backgroundColor:theme.forest}]}/>:null}</View>
      </Pressable>)}
      <Button title="Reset appearance to Forest" secondary onPress={()=>saveAppearancePreference('forest')}/>
    </Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Navigation and modules</Text>
      <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Choose which sections appear in the bottom bar and arrange their order. Home and Settings stay fixed.</Text>
      {navigationOrder.filter(id=>id!=='home'&&id!=='settings').map((id,index)=>{
        const item=TABS.find(tabItem=>tabItem.id===id);
        if(!item)return null;
        const first=index===0;
        const last=index===navigationOrder.filter(value=>value!=='home'&&value!=='settings').length-1;
        return <View key={id} style={styles.modulePreference}>
          <View style={styles.itemText}>
            <Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{item.label}</Text>
            <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{hiddenTabs.includes(id)?'Hidden from bottom navigation':'Shown in bottom navigation'}</Text>
          </View>
          <Switch accessibilityLabel={`Show ${item.label} in bottom navigation`} value={!hiddenTabs.includes(id)} onValueChange={value=>toggleNavigationModule(id,value)} trackColor={{true:ACTIVE_COLORS.forest}}/>
          <View style={styles.moduleMove}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Move ${item.label} up`} disabled={first} onPress={()=>moveNavigationModule(id,-1)} style={[styles.moduleMoveButton,first&&styles.moduleMoveDisabled]}>
              <Text style={[styles.moduleMoveText,{color:ACTIVE_COLORS.forest}]}>↑</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Move ${item.label} down`} disabled={last} onPress={()=>moveNavigationModule(id,1)} style={[styles.moduleMoveButton,last&&styles.moduleMoveDisabled]}>
              <Text style={[styles.moduleMoveText,{color:ACTIVE_COLORS.forest}]}>↓</Text>
            </Pressable>
          </View>
        </View>;
      })}
      <Button title="Reset navigation order" secondary onPress={resetNavigationPreferences}/>
    </Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Home-screen widget</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Add the Schedule widget from your Android launcher's Widgets list. It shows your next class, room and countdown, plus the nearest unfinished task deadline. It refreshes when local planner records change and periodically while placed on the home screen.</Text></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Local profile</Text><Field label="Display name" value={form.displayName??data.profile.displayName??''} onChangeText={v=>updateForm('displayName',v)}/><Field label="Program" value={form.program??data.profile.program??''} onChangeText={v=>updateForm('program',v)}/><Field label="Year and section" value={form.yearSection??data.profile.yearSection??''} onChangeText={v=>updateForm('yearSection',v)}/><Button title="Save profile" onPress={saveProfile}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Reminders</Text><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Enable local reminders</Text><Switch value={remindersEnabled} onValueChange={async value=>{setRemindersEnabled(value);await setSetting('remindersEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><Field label="Class reminder lead time (minutes)" value={leadMinutes} onChangeText={async value=>{setLeadMinutes(value);await setSetting('leadMinutes',value);}} keyboardType="number-pad"/><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Chime sound</Text><Switch value={soundEnabled} onValueChange={async value=>{setSoundEnabled(value);await setSetting('soundEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Vibration</Text><Switch value={vibrationEnabled} onValueChange={async value=>{setVibrationEnabled(value);await setSetting('vibrationEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><Button title="Request notification permission" secondary onPress={async()=>{const result=await Notifications.requestPermissionsAsync();Alert.alert('Notifications',result.granted?'Permission granted.':'Permission not granted.');}}/><Button title="Send test notification" secondary onPress={async()=>{const permission=await Notifications.requestPermissionsAsync();if(!permission.granted){Alert.alert('Permission required','Allow notifications in Android settings first.');return;}await Notifications.scheduleNotificationAsync({content:{title:'Schedule reminder test',body:'Your local notifications are working.',sound:soundEnabled?'schedule_chime.wav':null},trigger:null});Alert.alert('Sent','A local test notification was requested.');}}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Backup and restore</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Export a portable Schedule JSON backup or import a backup from the previous Capacitor app. Import replaces all local records on this device.</Text><Button title="Export local backup" onPress={exportBackup}/><Button title="Import JSON backup" secondary onPress={importBackup}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Privacy and local storage</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Your schedule, budget, notes, tasks, profile, appearance, and navigation preferences stay in the local SQLite database on this device. The planner does not require an account, backend, or cloud database.</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Database: schedule-local.db. Export a JSON backup before uninstalling the app or clearing its storage. Restoring a backup replaces current local records.</Text><Button title="Refresh local data" secondary onPress={changed}/></Card></>;

  const screen = {home:renderHome,schedule:renderSchedule,budget:renderBudget,notes:renderNotes,tasks:renderTasks,settings:renderSettings}[tab];
  if (busy) return <SafeAreaView style={styles.loading}><StatusBar barStyle="dark-content" backgroundColor={ACTIVE_COLORS.cream}/><GraduationCap size={34} color={ACTIVE_COLORS.forest}/><Text style={styles.loadingText}>Preparing your local planner…</Text></SafeAreaView>;

  return <SafeAreaView style={[styles.safe,{backgroundColor:ACTIVE_COLORS.cream}]}>
    <StatusBar barStyle="dark-content" backgroundColor={ACTIVE_COLORS.cream}/>
    <View style={[styles.topbar,{backgroundColor:ACTIVE_COLORS.cream}]}><View style={styles.brand}><View style={[styles.logo,{backgroundColor:ACTIVE_COLORS.forest}]}><GraduationCap size={23} color="#fff"/></View><View><Text style={[styles.brandEyebrow,{color:ACTIVE_COLORS.forest2}]}>STUDENT PLANNER</Text><Text style={[styles.brandName,{color:ACTIVE_COLORS.ink}]}>Schedule</Text></View></View><Pressable onPress={()=>setTab('settings')} style={[styles.settingsIcon,{backgroundColor:ACTIVE_COLORS.white}]}><Settings color={ACTIVE_COLORS.forest} size={21}/></Pressable></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView key={tab} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{screen()}</ScrollView>
    </KeyboardAvoidingView>
    <View style={[styles.nav,{backgroundColor:ACTIVE_COLORS.white,borderTopColor:ACTIVE_COLORS.line}]}>{navigationOrder.filter(id=>id==='home'||id==='settings'||!hiddenTabs.includes(id)).map(id=>TABS.find(item=>item.id===id)).filter(Boolean).map(({id,label,Icon})=><Pressable key={id} onPress={()=>{setTab(id);resetForm();}} style={[styles.navItem,tab===id&&styles.navActive,tab===id&&{backgroundColor:ACTIVE_COLORS.soft}]}><Icon size={19} color={tab===id?ACTIVE_COLORS.forest:'#89948c'}/><Text style={[styles.navLabel,tab===id&&styles.navLabelActive,tab===id&&{color:ACTIVE_COLORS.forest}]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},flex:{flex:1},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.cream},loadingText:{marginTop:12,color:COLORS.muted,fontSize:14},
  topbar:{paddingHorizontal:18,paddingTop:8,paddingBottom:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{flexDirection:'row',alignItems:'center',gap:11},logo:{width:43,height:43,borderRadius:15,backgroundColor:COLORS.forest,alignItems:'center',justifyContent:'center'},brandEyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:COLORS.forest2},brandName:{fontSize:20,fontWeight:'800',color:COLORS.ink},settingsIcon:{width:40,height:40,borderRadius:20,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},
  content:{paddingHorizontal:16,paddingBottom:30,gap:14},heading:{marginTop:7,marginBottom:2},h1:{fontSize:26,fontWeight:'800',color:COLORS.ink},sub:{fontSize:12,color:COLORS.muted,marginTop:4},profileLine:{color:COLORS.muted,fontSize:12,marginTop:-8},
  card:{backgroundColor:COLORS.white,borderRadius:20,padding:16,borderWidth:1,borderColor:COLORS.line,gap:10},cardTitle:{fontSize:16,fontWeight:'800',color:COLORS.ink,marginBottom:3},stats:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',flexGrow:1,minHeight:90,justifyContent:'center'},statValue:{fontSize:21,fontWeight:'800',color:COLORS.forest,marginTop:8},balance:{fontSize:28,fontWeight:'900',color:COLORS.forest},label:{fontSize:10,fontWeight:'700',letterSpacing:.6,color:COLORS.muted},
  field:{gap:5},input:{minHeight:44,borderWidth:1,borderColor:COLORS.line,borderRadius:12,paddingHorizontal:12,paddingVertical:9,color:COLORS.ink,backgroundColor:'#fff',fontSize:14},multiline:{minHeight:90,textAlignVertical:'top'},button:{minHeight:46,backgroundColor:COLORS.forest,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:14,marginTop:3},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},buttonSecondary:{backgroundColor:'#edf4ef',borderWidth:1,borderColor:'#d8e8dd'},buttonSecondaryText:{color:COLORS.forest},buttonDanger:{backgroundColor:'#fff1f0'},buttonDangerText:{color:COLORS.red},buttonCompact:{minHeight:36},
  modulePreference:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:9,borderTopWidth:1,borderTopColor:COLORS.line},moduleMove:{flexDirection:'row',gap:6,paddingHorizontal:2},moduleMoveButton:{width:32,height:32,borderWidth:1,borderColor:COLORS.line,borderRadius:9,alignItems:'center',justifyContent:'center'},moduleMoveDisabled:{opacity:0.25},moduleMoveText:{fontSize:19,fontWeight:'800',paddingHorizontal:3},disabledText:{opacity:0.25},
  themeOption:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1.5,borderRadius:15,padding:12},themeSwatches:{flexDirection:'row',gap:4},themeSwatch:{width:17,height:34,borderRadius:6},themeRadio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},themeRadioSelected:{width:10,height:10,borderRadius:5},
  budgetActionRow:{flexDirection:'row',flexWrap:'wrap',gap:7},rowBetween:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},limitRow:{gap:8,paddingVertical:8,borderTopWidth:1,borderTopColor:COLORS.line},goalRow:{gap:8,paddingVertical:8,borderTopWidth:1,borderTopColor:COLORS.line},progressTrack:{height:8,borderRadius:8,overflow:'hidden'},progressFill:{height:8,borderRadius:8},noteRow:{gap:9,paddingVertical:11,borderTopWidth:1,borderTopColor:COLORS.line},noteBody:{fontSize:13,lineHeight:20},taskCard:{gap:10,paddingVertical:12,borderTopWidth:1,borderTopColor:COLORS.line},taskDescription:{fontSize:13,lineHeight:19},checklistPanel:{gap:8,paddingLeft:8},checklistRow:{flexDirection:'row',alignItems:'center',gap:8},
  item:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed',gap:9},itemText:{flex:1},itemTitle:{fontSize:14,fontWeight:'700',color:COLORS.ink},itemDetail:{fontSize:11,color:COLORS.muted,marginTop:3},trailing:{fontSize:12,fontWeight:'800',color:COLORS.forest},delete:{padding:5},empty:{fontSize:12,color:COLORS.muted,paddingVertical:12},taskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed'},check:{width:23,height:23,borderWidth:1.5,borderColor:'#b8c7bd',borderRadius:7,alignItems:'center',justifyContent:'center'},checked:{backgroundColor:COLORS.forest,borderColor:COLORS.forest},checkText:{color:'#fff',fontWeight:'900'},done:{textDecorationLine:'line-through',color:'#9aa39b'},switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:7},nav:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.line,paddingTop:7,paddingBottom:Platform.OS==='android'?7:3,paddingHorizontal:2},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3,paddingVertical:4,borderRadius:10},navActive:{backgroundColor:'#edf4ef'},navLabel:{fontSize:9,color:'#89948c',fontWeight:'600'},navLabelActive:{color:COLORS.forest,fontWeight:'900'}
});
