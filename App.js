import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput, View
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
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, getAllowanceRange, calculateAvailableBalance, normalizeActivityInput } from './src-native/domain';

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
  return <Pressable onPress={onPress} style={styles.item}><View style={styles.itemText}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{title}</Text>{detail ? <Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{detail}</Text> : null}</View>{trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}{onDelete ? <Pressable hitSlop={10} onPress={onDelete} style={styles.delete}><Trash2 size={17} color={COLORS.red}/></Pressable> : null}</Pressable>;
}
function Empty({ text }) { return <Text style={[styles.empty, { color: ACTIVE_COLORS.muted }]}>{text}</Text>; }

export default function App() {
  const [tab, setTab] = useState('home');
  const [db, setDb] = useState(null);
  const [busy, setBusy] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ profile: {}, classes: [], allClasses: [], activities: [], allActivities: [], subjects: [], tasks: [], income: [], expenses: [], allowances: [], notes: [], goals: [], categories: [] });
  const [form, setForm] = useState({});
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState('10');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [appearance, setAppearance] = useState('forest');\n  const [navigationOrder, setNavigationOrder] = useState(TABS.map(item => item.id));\n  const [hiddenTabs, setHiddenTabs] = useState([]);
  ACTIVE_COLORS = THEMES[appearance] || THEMES.forest;

  const refreshData = async (database = db) => {
    if (!database) return;
    const day = new Date().getDay(), today = todayKey();
    const [profile, classes, allClasses, activities, allActivities, subjects, tasks, income, expenses, allowances, notes, goals, categories] = await Promise.all([
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
      database.getAllAsync('SELECT * FROM notes WHERE archived=0 ORDER BY pinned DESC, updatedAt DESC'),
      database.getAllAsync("SELECT g.*, COALESCE((SELECT SUM(CASE WHEN e.type='withdrawal' THEN -e.amount ELSE e.amount END) FROM savingsEntries e WHERE e.goalId=g.id),0) AS savedAmount FROM savingsGoals g ORDER BY g.id DESC"),
      database.getAllAsync('SELECT * FROM categories WHERE active=1 ORDER BY name')
    ]);
    setData({ profile: profile || {}, classes, allClasses, activities, allActivities, subjects, tasks, income, expenses, allowances, notes, goals, categories });
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
    try { const amount=parseAmount(form.amount), description=(form.description||'').trim(); if(!description) throw new Error('Enter what the expense was for.');
      let category = await db.getFirstAsync("SELECT * FROM categories WHERE lower(name)=lower(?) AND type='expense'",(form.category||'Food').trim());
      if(!category){const result=await db.runAsync("INSERT INTO categories (name,type,active) VALUES (?,'expense',1)",(form.category||'Food').trim());category={id:result.lastInsertRowId};}
      await db.runAsync('INSERT INTO expenses (amount,description,categoryId,date,createdAt) VALUES (?,?,?,?,?)',amount,description,category.id,todayKey(),new Date().toISOString());
      resetForm(); changed();
    } catch(error){showError(error);}
  };
  const addAllowance = async () => {
    try {
      const amount=parseAmount(form.allowanceAmount), period=(form.allowancePeriod||'weekly').toLowerCase();
      if(!['daily','weekly','monthly'].includes(period)) throw new Error('Choose daily, weekly, or monthly.');
      const range=getAllowanceRange(period);
      await db.runAsync('INSERT INTO allowances (amount,period,startDate,endDate,createdAt) VALUES (?,?,?,?,?)',amount,period,range.startDate,range.endDate,new Date().toISOString());
      resetForm(); changed();
    } catch(error){showError(error);}
  };
  const addIncome = async () => {
    try { const amount=parseAmount(form.incomeAmount), source=(form.source||'').trim(); if(!source) throw new Error('Enter an income source.');
      await db.runAsync('INSERT INTO income (amount,source,date,createdAt) VALUES (?,?,?,?)',amount,source,todayKey(),new Date().toISOString()); resetForm(); changed();
    } catch(error){showError(error);}
  };
  const addNote = async () => {
    try { const title=(form.noteTitle||'').trim(), content=(form.noteContent||'').trim(); if(!title||!content) throw new Error('Enter a title and note content.');
      await db.runAsync('INSERT INTO notes (title,content,kind,updatedAt,archived,pinned) VALUES (?,?,?,?,0,0)',title,content,form.noteKind||'personal',new Date().toISOString()); resetForm(); changed();
    } catch(error){showError(error);}
  };
  const addTask = async () => {
    try { const title=(form.taskTitle||'').trim(); if(!title) throw new Error('Enter a task title.');
      const dueDate=(form.dueDate||'').trim(); if(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('Use YYYY-MM-DD for the due date.');
      const now=new Date().toISOString(); await db.runAsync('INSERT INTO tasks (title,dueDate,priority,completed,createdAt,updatedAt) VALUES (?,?,?,0,?,?)',title,dueDate||null,form.priority||'Normal',now,now); resetForm(); changed();
    } catch(error){showError(error);}
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
  const remove = async (table,id) => Alert.alert('Delete record?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await db.runAsync('DELETE FROM '+table+' WHERE id=?',id);changed();}catch(e){showError(e);}}}]);
  const toggleTask = async (task) => { await db.runAsync('UPDATE tasks SET completed=?,updatedAt=? WHERE id=?',task.completed?0:1,new Date().toISOString(),task.id); changed(); };

  const renderHome = () => <><Heading detail={DAYS[new Date().getDay()]+' · '+todayKey()}>{data.profile.displayName ? 'Welcome back, '+data.profile.displayName : 'Your day, organized.'}</Heading>
    {(data.profile.program||data.profile.yearSection)?<Text style={styles.profileLine}>{[data.profile.program,data.profile.yearSection].filter(Boolean).join(' · ')}</Text>:null}
    <View style={styles.stats}><Card style={styles.stat}><Text style={styles.label}>TODAY'S CLASSES</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.classes.length}</Text></Card><Card style={styles.stat}><Text style={styles.label}>PENDING TASKS</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.tasks.filter(x=>!x.completed).length}</Text></Card><Card style={styles.stat}><Text style={styles.label}>MONEY AVAILABLE</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{peso(availableBalance)}</Text></Card><Card style={styles.stat}><Text style={styles.label}>SAVINGS GOALS</Text><Text style={[styles.statValue,{color:ACTIVE_COLORS.forest}]}>{data.goals.length}</Text></Card></View>
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

  const renderBudget = () => <><Heading detail="All amounts are stored as integer centavos.">Budget</Heading><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Available balance</Text><Text style={[styles.balance,{color:ACTIVE_COLORS.forest}]}>{peso(availableBalance)}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Active allowance + income − expenses</Text></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add an expense</Text><Field label="Description" value={form.description||''} onChangeText={v=>updateForm('description',v)}/><Field label="Amount (₱)" value={form.amount||''} onChangeText={v=>updateForm('amount',v)} keyboardType="decimal-pad"/><Field label="Category" value={form.category||'Food'} onChangeText={v=>updateForm('category',v)}/><Button title="Save expense" onPress={addExpense}/></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add allowance</Text><Field label="Amount (₱)" value={form.allowanceAmount||''} onChangeText={v=>updateForm('allowanceAmount',v)} keyboardType="decimal-pad"/><Field label="Period (daily / weekly / monthly)" value={form.allowancePeriod||'weekly'} onChangeText={v=>updateForm('allowancePeriod',v)}/><Button title="Save allowance" onPress={addAllowance}/></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add income</Text><Field label="Source" value={form.source||''} onChangeText={v=>updateForm('source',v)}/><Field label="Amount (₱)" value={form.incomeAmount||''} onChangeText={v=>updateForm('incomeAmount',v)} keyboardType="decimal-pad"/><Button title="Save income" onPress={addIncome}/></Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Allowances</Text>{data.allowances.map(x=><Item key={x.id} title={peso(x.amount)+' · '+x.period} detail={x.startDate+' to '+x.endDate} onDelete={()=>remove('allowances',x.id)}/>)}{!data.allowances.length?<Empty text="No allowance periods recorded."/>:null}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Expenses</Text>{data.expenses.map(x=><Item key={x.id} title={x.description} detail={x.date} trailing={'−'+peso(x.amount)} onDelete={()=>remove('expenses',x.id)}/>) }{!data.expenses.length?<Empty text="No expenses recorded yet."/>:null}</Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Income</Text>{data.income.map(x=><Item key={x.id} title={x.source} detail={x.date} trailing={'+'+peso(x.amount)} onDelete={()=>remove('income',x.id)}/>) }{!data.income.length?<Empty text="No income recorded yet."/>:null}</Card>
  </>;

  const renderNotes = () => <><Heading detail="Personal, lecture, and subject notes stored locally.">Notepad</Heading><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>New note</Text><Field label="Title" value={form.noteTitle||''} onChangeText={v=>updateForm('noteTitle',v)}/><Field label="Content" value={form.noteContent||''} onChangeText={v=>updateForm('noteContent',v)} multiline/><Field label="Type (personal / lecture / subject)" value={form.noteKind||'personal'} onChangeText={v=>updateForm('noteKind',v)}/><Button title="Save note" onPress={addNote}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Saved notes</Text>{data.notes.map(x=><Item key={x.id} title={(x.pinned?'★ ':'')+x.title} detail={x.kind+' · '+(x.updatedAt||'').slice(0,10)} onDelete={()=>remove('notes',x.id)}/>) }{!data.notes.length?<Empty text="No notes saved yet."/>:null}</Card></>;

  const renderTasks = () => <><Heading detail="Assignments, deadlines, and priorities.">Tasks</Heading><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Add a task</Text><Field label="Task title" value={form.taskTitle||''} onChangeText={v=>updateForm('taskTitle',v)}/><Field label="Due date (YYYY-MM-DD, optional)" value={form.dueDate||''} onChangeText={v=>updateForm('dueDate',v)}/><Field label="Priority (Low / Normal / High)" value={form.priority||'Normal'} onChangeText={v=>updateForm('priority',v)}/><Button title="Add task" onPress={addTask}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Your tasks</Text>{data.tasks.map(x=><View key={x.id} style={styles.taskRow}><Pressable onPress={()=>toggleTask(x)} style={[styles.check,x.completed&&styles.checked]}><Text style={styles.checkText}>{x.completed?'✓':''}</Text></Pressable><View style={styles.itemText}><Text style={[styles.itemTitle,x.completed&&styles.done]}>{x.title}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{x.dueDate?'Due '+x.dueDate:'No due date'} · {x.priority}</Text></View><Pressable onPress={()=>remove('tasks',x.id)}><Trash2 size={17} color={ACTIVE_COLORS.red}/></Pressable></View>)}{!data.tasks.length?<Empty text="No tasks yet."/>:null}</Card></>;

  const renderSettings = () => <><Heading detail="Personalize your planner and manage local data.">Settings</Heading>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Appearance</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Choose the CampusOS-style color theme. Your choice is saved on this device and applied throughout the app.</Text>
      {Object.entries(THEMES).map(([id, theme])=><Pressable key={id} onPress={async()=>{setAppearance(id);await setSetting('appearance',id);}} style={[styles.themeOption,{borderColor:appearance===id?theme.forest:theme.line,backgroundColor:theme.cream}]}>
        <View style={styles.themeSwatches}><View style={[styles.themeSwatch,{backgroundColor:theme.forest}]}/><View style={[styles.themeSwatch,{backgroundColor:theme.white,borderColor:theme.line,borderWidth:1}]}/><View style={[styles.themeSwatch,{backgroundColor:theme.soft}]}/></View>
        <View style={styles.itemText}><Text style={[styles.itemTitle,{color:theme.ink}]}>{theme.label}</Text><Text style={[styles.itemDetail,{color:theme.muted}]}>{theme.description}</Text></View>
        <View style={[styles.themeRadio,{borderColor:theme.forest}]}>{appearance===id?<View style={[styles.themeRadioSelected,{backgroundColor:theme.forest}]}/>:null}</View>
      </Pressable>)}
    </Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Navigation and modules</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Show the modules you use most and arrange their order. Home and Settings remain available.</Text>
      {navigationOrder.filter(id=>id!=='home'&&id!=='settings').map((id,index)=>{const item=TABS.find(tabItem=>tabItem.id===id);if(!item)return null;return <View key={id} style={styles.modulePreference}><View style={styles.itemText}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>{item.label}</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>{hiddenTabs.includes(id)?'Hidden from navigation':'Visible in navigation'}</Text></View><Switch value={!hiddenTabs.includes(id)} onValueChange={async value=>{const next=value?hiddenTabs.filter(x=>x!==id):[...hiddenTabs,id];setHiddenTabs(next);await setSetting('navigationPreferences',JSON.stringify({order:navigationOrder,hidden:next}));}} trackColor={{true:ACTIVE_COLORS.forest}}/><View style={styles.moduleMove}><Pressable disabled={index===0} onPress={async()=>{const modules=navigationOrder.filter(x=>x!=='home'&&x!=='settings');const from=modules.indexOf(id),to=from-1;if(to<0)return;[modules[from],modules[to]]=[modules[to],modules[from]];const next=['home',...modules,'settings'];setNavigationOrder(next);await setSetting('navigationPreferences',JSON.stringify({order:next,hidden:hiddenTabs}));}}><Text style={[styles.moduleMoveText,index===0&&styles.disabledText]}>↑</Text></Pressable><Pressable disabled={index===navigationOrder.filter(x=>x!=='home'&&x!=='settings').length-1} onPress={async()=>{const modules=navigationOrder.filter(x=>x!=='home'&&x!=='settings');const from=modules.indexOf(id),to=from+1;if(to>=modules.length)return;[modules[from],modules[to]]=[modules[to],modules[from]];const next=['home',...modules,'settings'];setNavigationOrder(next);await setSetting('navigationPreferences',JSON.stringify({order:next,hidden:hiddenTabs}));}}><Text style={[styles.moduleMoveText,index===navigationOrder.filter(x=>x!=='home'&&x!=='settings').length-1&&styles.disabledText]}>↓</Text></Pressable></View></View>})}
    </Card>
    <Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Local profile</Text><Field label="Display name" value={form.displayName??data.profile.displayName??''} onChangeText={v=>updateForm('displayName',v)}/><Field label="Program" value={form.program??data.profile.program??''} onChangeText={v=>updateForm('program',v)}/><Field label="Year and section" value={form.yearSection??data.profile.yearSection??''} onChangeText={v=>updateForm('yearSection',v)}/><Button title="Save profile" onPress={saveProfile}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Reminders</Text><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Enable local reminders</Text><Switch value={remindersEnabled} onValueChange={async value=>{setRemindersEnabled(value);await setSetting('remindersEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><Field label="Class reminder lead time (minutes)" value={leadMinutes} onChangeText={async value=>{setLeadMinutes(value);await setSetting('leadMinutes',value);}} keyboardType="number-pad"/><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Chime sound</Text><Switch value={soundEnabled} onValueChange={async value=>{setSoundEnabled(value);await setSetting('soundEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><View style={styles.switchRow}><Text style={[styles.itemTitle,{color:ACTIVE_COLORS.ink}]}>Vibration</Text><Switch value={vibrationEnabled} onValueChange={async value=>{setVibrationEnabled(value);await setSetting('vibrationEnabled',value);}} trackColor={{true:ACTIVE_COLORS.forest2}}/></View><Button title="Request notification permission" secondary onPress={async()=>{const result=await Notifications.requestPermissionsAsync();Alert.alert('Notifications',result.granted?'Permission granted.':'Permission not granted.');}}/><Button title="Send test notification" secondary onPress={async()=>{const permission=await Notifications.requestPermissionsAsync();if(!permission.granted){Alert.alert('Permission required','Allow notifications in Android settings first.');return;}await Notifications.scheduleNotificationAsync({content:{title:'Schedule reminder test',body:'Your local notifications are working.',sound:soundEnabled?'schedule_chime.wav':null},trigger:null});Alert.alert('Sent','A local test notification was requested.');}}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Backup and restore</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Export a portable Schedule JSON backup or import a backup from the previous Capacitor app. Import replaces all local records on this device.</Text><Button title="Export local backup" onPress={exportBackup}/><Button title="Import JSON backup" secondary onPress={importBackup}/></Card><Card><Text style={[styles.cardTitle,{color:ACTIVE_COLORS.ink}]}>Storage</Text><Text style={[styles.itemDetail,{color:ACTIVE_COLORS.muted}]}>Native SQLite database: schedule-local.db. No login, backend, or cloud sync is used.</Text><Button title="Refresh local data" secondary onPress={changed}/></Card></>;

  const screen = {home:renderHome,schedule:renderSchedule,budget:renderBudget,notes:renderNotes,tasks:renderTasks,settings:renderSettings}[tab];
  if (busy) return <SafeAreaView style={styles.loading}><StatusBar barStyle="dark-content" backgroundColor={ACTIVE_COLORS.cream}/><GraduationCap size={34} color={ACTIVE_COLORS.forest}/><Text style={styles.loadingText}>Preparing your local planner…</Text></SafeAreaView>;

  return <SafeAreaView style={[styles.safe,{backgroundColor:ACTIVE_ACTIVE_COLORS.cream}]}>
    <StatusBar barStyle="dark-content" backgroundColor={ACTIVE_ACTIVE_COLORS.cream}/>
    <View style={[styles.topbar,{backgroundColor:ACTIVE_ACTIVE_COLORS.cream}]}><View style={styles.brand}><View style={[styles.logo,{backgroundColor:ACTIVE_ACTIVE_COLORS.forest}]}><GraduationCap size={23} color="#fff"/></View><View><Text style={[styles.brandEyebrow,{color:ACTIVE_ACTIVE_COLORS.forest2}]}>STUDENT PLANNER</Text><Text style={[styles.brandName,{color:ACTIVE_ACTIVE_COLORS.ink}]}>Schedule</Text></View></View><Pressable onPress={()=>setTab('settings')} style={[styles.settingsIcon,{backgroundColor:ACTIVE_ACTIVE_COLORS.white}]}><Settings color={ACTIVE_ACTIVE_COLORS.forest} size={21}/></Pressable></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView key={tab} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{screen()}</ScrollView>
    </KeyboardAvoidingView>
    <View style={[styles.nav,{backgroundColor:ACTIVE_ACTIVE_COLORS.white,borderTopColor:ACTIVE_ACTIVE_COLORS.line}]}>{navigationOrder.filter(id=>id==='home'||id==='settings'||!hiddenTabs.includes(id)).map(id=>TABS.find(item=>item.id===id)).filter(Boolean).map(({id,label,Icon})=><Pressable key={id} onPress={()=>{setTab(id);resetForm();}} style={[styles.navItem,tab===id&&styles.navActive,tab===id&&{backgroundColor:ACTIVE_ACTIVE_COLORS.soft}]}><Icon size={19} color={tab===id?ACTIVE_ACTIVE_COLORS.forest:'#89948c'}/><Text style={[styles.navLabel,tab===id&&styles.navLabelActive,tab===id&&{color:ACTIVE_ACTIVE_COLORS.forest}]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},flex:{flex:1},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.cream},loadingText:{marginTop:12,color:COLORS.muted,fontSize:14},
  topbar:{paddingHorizontal:18,paddingTop:8,paddingBottom:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{flexDirection:'row',alignItems:'center',gap:11},logo:{width:43,height:43,borderRadius:15,backgroundColor:COLORS.forest,alignItems:'center',justifyContent:'center'},brandEyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:COLORS.forest2},brandName:{fontSize:20,fontWeight:'800',color:COLORS.ink},settingsIcon:{width:40,height:40,borderRadius:20,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},
  content:{paddingHorizontal:16,paddingBottom:30,gap:14},heading:{marginTop:7,marginBottom:2},h1:{fontSize:26,fontWeight:'800',color:COLORS.ink},sub:{fontSize:12,color:COLORS.muted,marginTop:4},profileLine:{color:COLORS.muted,fontSize:12,marginTop:-8},
  card:{backgroundColor:COLORS.white,borderRadius:20,padding:16,borderWidth:1,borderColor:COLORS.line,gap:10},cardTitle:{fontSize:16,fontWeight:'800',color:COLORS.ink,marginBottom:3},stats:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',flexGrow:1,minHeight:90,justifyContent:'center'},statValue:{fontSize:21,fontWeight:'800',color:COLORS.forest,marginTop:8},balance:{fontSize:28,fontWeight:'900',color:COLORS.forest},label:{fontSize:10,fontWeight:'700',letterSpacing:.6,color:COLORS.muted},
  field:{gap:5},input:{minHeight:44,borderWidth:1,borderColor:COLORS.line,borderRadius:12,paddingHorizontal:12,paddingVertical:9,color:COLORS.ink,backgroundColor:'#fff',fontSize:14},multiline:{minHeight:90,textAlignVertical:'top'},button:{minHeight:46,backgroundColor:COLORS.forest,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:14,marginTop:3},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},buttonSecondary:{backgroundColor:'#edf4ef',borderWidth:1,borderColor:'#d8e8dd'},buttonSecondaryText:{color:COLORS.forest},buttonDanger:{backgroundColor:'#fff1f0'},buttonDangerText:{color:COLORS.red},buttonCompact:{minHeight:36},
  modulePreference:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:9,borderTopWidth:1,borderTopColor:COLORS.line},moduleMove:{flexDirection:'row',gap:12,paddingHorizontal:4},moduleMoveText:{fontSize:20,fontWeight:'800',color:COLORS.forest,paddingHorizontal:3},disabledText:{opacity:0.25},\n  themeOption:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1.5,borderRadius:15,padding:12},themeSwatches:{flexDirection:'row',gap:4},themeSwatch:{width:17,height:34,borderRadius:6},themeRadio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'},themeRadioSelected:{width:10,height:10,borderRadius:5},
  item:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed',gap:9},itemText:{flex:1},itemTitle:{fontSize:14,fontWeight:'700',color:COLORS.ink},itemDetail:{fontSize:11,color:COLORS.muted,marginTop:3},trailing:{fontSize:12,fontWeight:'800',color:COLORS.forest},delete:{padding:5},empty:{fontSize:12,color:COLORS.muted,paddingVertical:12},taskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed'},check:{width:23,height:23,borderWidth:1.5,borderColor:'#b8c7bd',borderRadius:7,alignItems:'center',justifyContent:'center'},checked:{backgroundColor:COLORS.forest,borderColor:COLORS.forest},checkText:{color:'#fff',fontWeight:'900'},done:{textDecorationLine:'line-through',color:'#9aa39b'},switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:7},nav:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.line,paddingTop:7,paddingBottom:Platform.OS==='android'?7:3,paddingHorizontal:2},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3,paddingVertical:4,borderRadius:10},navActive:{backgroundColor:'#edf4ef'},navLabel:{fontSize:9,color:'#89948c',fontWeight:'600'},navLabelActive:{color:COLORS.forest,fontWeight:'900'}
});
