import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Switch, Text, TextInput, View
} from 'react-native';
import * as Notifications from 'expo-notifications';
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
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, calculateAvailableBalance } from './src-native/domain';

const COLORS = { forest: '#174f3b', forest2: '#236b50', cream: '#f7f5ec', white: '#ffffff', ink: '#1f2937', muted: '#718096', line: '#e7e9e3', amber: '#b7791f', red: '#b42318' };
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
const parseAmount = (value) => { const n = Number(String(value).replace(/,/g, '').trim()); if (!Number.isFinite(n) || n <= 0) throw new Error('Enter an amount greater than ₱0.00.'); return Math.round(n * 100); };
const parseTime = (value) => { const match = /^(\\d{1,2}):(\\d{2})$/.exec(value.trim()); if (!match) throw new Error('Use 24-hour time, for example 08:30.'); const h=Number(match[1]), m=Number(match[2]); if(h>23||m>59) throw new Error('Enter a valid time.'); return h*60+m; };
const timeLabel = (mins) => new Date(2000,0,1,Math.floor(mins/60),mins%60).toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'});
const showError = (error) => Alert.alert('Schedule', error?.message || 'Something went wrong.');

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
});

function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }
function Heading({ children, detail }) { return <View style={styles.heading}><Text style={styles.h1}>{children}</Text>{detail ? <Text style={styles.sub}>{detail}</Text> : null}</View>; }
function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, style }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder || label} placeholderTextColor="#9aa39b" keyboardType={keyboardType || 'default'} multiline={multiline} style={[styles.input, multiline && styles.multiline, style]} /></View>;
}
function Button({ title, onPress, secondary, danger, compact }) {
  return <Pressable onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary, danger && styles.buttonDanger, compact && styles.buttonCompact]}><Text style={[styles.buttonText, secondary && styles.buttonSecondaryText, danger && styles.buttonDangerText]}>{title}</Text></Pressable>;
}
function Item({ title, detail, trailing, onDelete, onPress }) {
  return <Pressable onPress={onPress} style={styles.item}><View style={styles.itemText}><Text style={styles.itemTitle}>{title}</Text>{detail ? <Text style={styles.itemDetail}>{detail}</Text> : null}</View>{trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}{onDelete ? <Pressable hitSlop={10} onPress={onDelete} style={styles.delete}><Trash2 size={17} color={COLORS.red}/></Pressable> : null}</Pressable>;
}
function Empty({ text }) { return <Text style={styles.empty}>{text}</Text>; }

export default function App() {
  const [tab, setTab] = useState('home');
  const [db, setDb] = useState(null);
  const [busy, setBusy] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ profile: {}, classes: [], activities: [], subjects: [], tasks: [], income: [], expenses: [], allowances: [], notes: [], goals: [], categories: [] });
  const [form, setForm] = useState({});
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState('10');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const refreshData = async (database = db) => {
    if (!database) return;
    const day = new Date().getDay(), today = todayKey();
    const [profile, classes, allClasses, activities, subjects, tasks, income, expenses, allowances, notes, goals, categories] = await Promise.all([
      database.getFirstAsync('SELECT * FROM profile WHERE id = ?', 'local'),
      database.getAllAsync('SELECT s.*, sub.code, sub.name AS subjectName FROM scheduleSlots s LEFT JOIN subjects sub ON sub.id=s.subjectId WHERE s.day=? AND s.active=1 ORDER BY s.startMinutes', day),
      database.getAllAsync('SELECT s.*, sub.code, sub.name AS subjectName FROM scheduleSlots s LEFT JOIN subjects sub ON sub.id=s.subjectId WHERE s.active=1 ORDER BY s.day,s.startMinutes'),
      database.getAllAsync('SELECT * FROM activities WHERE day=? ORDER BY startMinutes', day),
      database.getAllAsync('SELECT * FROM subjects ORDER BY code'),
      database.getAllAsync('SELECT * FROM tasks ORDER BY completed, dueDate IS NULL, dueDate'),
      database.getAllAsync('SELECT * FROM income ORDER BY date DESC, id DESC'),
      database.getAllAsync('SELECT * FROM expenses ORDER BY date DESC, id DESC'),
      database.getAllAsync('SELECT * FROM allowances'),
      database.getAllAsync('SELECT * FROM notes WHERE archived=0 ORDER BY pinned DESC, updatedAt DESC'),
      database.getAllAsync("SELECT g.*, COALESCE((SELECT SUM(CASE WHEN e.type='withdrawal' THEN -e.amount ELSE e.amount END) FROM savingsEntries e WHERE e.goalId=g.id),0) AS savedAmount FROM savingsGoals g ORDER BY g.id DESC"),
      database.getAllAsync('SELECT * FROM categories WHERE active=1 ORDER BY name')
    ]);
    setData({ profile: profile || {}, classes, allClasses, activities, subjects, tasks, income, expenses, allowances, notes, goals, categories });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const database = await getDatabase();
        const [reminders, lead, sound, vibration] = await Promise.all([
          getSetting('remindersEnabled', 'true'), getSetting('leadMinutes', '10'),
          getSetting('soundEnabled', 'true'), getSetting('vibrationEnabled', 'true')
        ]);
        if (!active) return;
        setDb(database); setRemindersEnabled(reminders !== 'false'); setLeadMinutes(lead);
        setSoundEnabled(sound !== 'false'); setVibrationEnabled(vibration !== 'false');
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
      const dueDate=(form.dueDate||'').trim(); if(dueDate&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(dueDate)) throw new Error('Use YYYY-MM-DD for the due date.');
      const now=new Date().toISOString(); await db.runAsync('INSERT INTO tasks (title,dueDate,priority,completed,createdAt,updatedAt) VALUES (?,?,?,0,?,?)',title,dueDate||null,form.priority||'Normal',now,now); resetForm(); changed();
    } catch(error){showError(error);}
  };
  const saveProfile = async () => {
    try { await db.runAsync('UPDATE profile SET displayName=?,program=?,yearSection=?,updatedAt=? WHERE id=?',(form.displayName??data.profile.displayName??'').trim(),(form.program??data.profile.program??'').trim(),(form.yearSection??data.profile.yearSection??'').trim(),new Date().toISOString(),'local'); resetForm(); changed(); Alert.alert('Saved','Your profile is stored only on this device.'); }
    catch(error){showError(error);}
  };
  const remove = async (table,id) => Alert.alert('Delete record?','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await db.runAsync('DELETE FROM '+table+' WHERE id=?',id);changed();}catch(e){showError(e);}}}]);
  const toggleTask = async (task) => { await db.runAsync('UPDATE tasks SET completed=?,updatedAt=? WHERE id=?',task.completed?0:1,new Date().toISOString(),task.id); changed(); };

  const renderHome = () => <><Heading detail={DAYS[new Date().getDay()]+' · '+todayKey()}>{data.profile.displayName ? 'Welcome back, '+data.profile.displayName : 'Your day, organized.'}</Heading>
    {(data.profile.program||data.profile.yearSection)?<Text style={styles.profileLine}>{[data.profile.program,data.profile.yearSection].filter(Boolean).join(' · ')}</Text>:null}
    <View style={styles.stats}><Card style={styles.stat}><Text style={styles.label}>TODAY'S CLASSES</Text><Text style={styles.statValue}>{data.classes.length}</Text></Card><Card style={styles.stat}><Text style={styles.label}>PENDING TASKS</Text><Text style={styles.statValue}>{data.tasks.filter(x=>!x.completed).length}</Text></Card><Card style={styles.stat}><Text style={styles.label}>MONEY AVAILABLE</Text><Text style={styles.statValue}>{peso(availableBalance)}</Text></Card><Card style={styles.stat}><Text style={styles.label}>SAVINGS GOALS</Text><Text style={styles.statValue}>{data.goals.length}</Text></Card></View>
    <Card><Text style={styles.cardTitle}>Today's classes</Text>{data.classes.length?data.classes.map(x=><Item key={x.id} title={x.code||x.subjectName||'Class'} detail={(x.room||'Room not set')+' · '+x.kind+' · '+timeLabel(x.startMinutes)+'–'+timeLabel(x.endMinutes)}/>):<Empty text="No classes scheduled for today."/>}</Card>
    <Card><Text style={styles.cardTitle}>Recent expenses</Text>{data.expenses.slice(0,4).map(x=><Item key={x.id} title={x.description} detail={x.date} trailing={'−'+peso(x.amount)}/>)}{!data.expenses.length?<Empty text="Your expenses will appear here."/>:null}</Card>
    <Card><Text style={styles.cardTitle}>Tasks to finish</Text>{data.tasks.filter(x=>!x.completed).slice(0,4).map(x=><Item key={x.id} title={x.title} detail={x.dueDate?'Due '+x.dueDate:'No due date'}/>)}{!data.tasks.some(x=>!x.completed)?<Empty text="No pending tasks."/>:null}</Card>
  </>;

  const renderSchedule = () => <><Heading detail="Monday–Saturday · Local timetable">Schedule</Heading><Card><Text style={styles.cardTitle}>Add a class</Text><Field label="Subject code" value={form.code||''} onChangeText={v=>updateForm('code',v)} placeholder="e.g. ITEC 80"/><Field label="Subject name" value={form.subjectName||''} onChangeText={v=>updateForm('subjectName',v)}/><Field label="Professor (optional)" value={form.professor||''} onChangeText={v=>updateForm('professor',v)}/><Field label="Room" value={form.room||''} onChangeText={v=>updateForm('room',v)}/><Field label="Day (1=Mon … 6=Sat)" value={form.day||'1'} onChangeText={v=>updateForm('day',v)} keyboardType="number-pad"/><Field label="Start (24-hour)" value={form.start||'08:00'} onChangeText={v=>updateForm('start',v)}/><Field label="End (24-hour)" value={form.end||'09:00'} onChangeText={v=>updateForm('end',v)}/><Field label="Type (Lecture or Lab)" value={form.kind||'Lecture'} onChangeText={v=>updateForm('kind',v)}/><Button title="Add class" onPress={addClass}/></Card>
    <Card><Text style={styles.cardTitle}>Today's timetable</Text>{data.allClasses.length?data.allClasses.map(x=><Item key={x.id} title={DAYS[x.day]+' · '+(x.code||x.subjectName)+' · '+x.kind} detail={(x.room||'No room')+' · '+timeLabel(x.startMinutes)+'–'+timeLabel(x.endMinutes)} onDelete={()=>remove('scheduleSlots',x.id)}/>):<Empty text="No class entries for today. Add one above; other days are visible on the Dashboard after switching days in the full timetable phase."/>}</Card>
    <Card><Text style={styles.cardTitle}>Subjects</Text>{data.subjects.map(x=><Item key={x.id} title={x.code+' — '+x.name} detail={x.professor||'Professor not set'}/>)}</Card>
  </>;

  const renderBudget = () => <><Heading detail="All amounts are stored as integer centavos.">Budget</Heading><Card><Text style={styles.cardTitle}>Available balance</Text><Text style={styles.balance}>{peso(availableBalance)}</Text><Text style={styles.itemDetail}>Active allowance + income − expenses</Text></Card>
    <Card><Text style={styles.cardTitle}>Add an expense</Text><Field label="Description" value={form.description||''} onChangeText={v=>updateForm('description',v)}/><Field label="Amount (₱)" value={form.amount||''} onChangeText={v=>updateForm('amount',v)} keyboardType="decimal-pad"/><Field label="Category" value={form.category||'Food'} onChangeText={v=>updateForm('category',v)}/><Button title="Save expense" onPress={addExpense}/></Card>
    <Card><Text style={styles.cardTitle}>Add allowance</Text><Field label="Amount (₱)" value={form.allowanceAmount||''} onChangeText={v=>updateForm('allowanceAmount',v)} keyboardType="decimal-pad"/><Field label="Period (daily / weekly / monthly)" value={form.allowancePeriod||'weekly'} onChangeText={v=>updateForm('allowancePeriod',v)}/><Button title="Save allowance" onPress={addAllowance}/></Card>
    <Card><Text style={styles.cardTitle}>Add income</Text><Field label="Source" value={form.source||''} onChangeText={v=>updateForm('source',v)}/><Field label="Amount (₱)" value={form.incomeAmount||''} onChangeText={v=>updateForm('incomeAmount',v)} keyboardType="decimal-pad"/><Button title="Save income" onPress={addIncome}/></Card>
    <Card><Text style={styles.cardTitle}>Allowances</Text>{data.allowances.map(x=><Item key={x.id} title={peso(x.amount)+' · '+x.period} detail={x.startDate+' to '+x.endDate} onDelete={()=>remove('allowances',x.id)}/>)}{!data.allowances.length?<Empty text="No allowance periods recorded."/>:null}</Card>
    <Card><Text style={styles.cardTitle}>Expenses</Text>{data.expenses.map(x=><Item key={x.id} title={x.description} detail={x.date} trailing={'−'+peso(x.amount)} onDelete={()=>remove('expenses',x.id)}/>) }{!data.expenses.length?<Empty text="No expenses recorded yet."/>:null}</Card>
    <Card><Text style={styles.cardTitle}>Income</Text>{data.income.map(x=><Item key={x.id} title={x.source} detail={x.date} trailing={'+'+peso(x.amount)} onDelete={()=>remove('income',x.id)}/>) }{!data.income.length?<Empty text="No income recorded yet."/>:null}</Card>
  </>;

  const renderNotes = () => <><Heading detail="Personal, lecture, and subject notes stored locally.">Notepad</Heading><Card><Text style={styles.cardTitle}>New note</Text><Field label="Title" value={form.noteTitle||''} onChangeText={v=>updateForm('noteTitle',v)}/><Field label="Content" value={form.noteContent||''} onChangeText={v=>updateForm('noteContent',v)} multiline/><Field label="Type (personal / lecture / subject)" value={form.noteKind||'personal'} onChangeText={v=>updateForm('noteKind',v)}/><Button title="Save note" onPress={addNote}/></Card><Card><Text style={styles.cardTitle}>Saved notes</Text>{data.notes.map(x=><Item key={x.id} title={(x.pinned?'★ ':'')+x.title} detail={x.kind+' · '+(x.updatedAt||'').slice(0,10)} onDelete={()=>remove('notes',x.id)}/>) }{!data.notes.length?<Empty text="No notes saved yet."/>:null}</Card></>;

  const renderTasks = () => <><Heading detail="Assignments, deadlines, and priorities.">Tasks</Heading><Card><Text style={styles.cardTitle}>Add a task</Text><Field label="Task title" value={form.taskTitle||''} onChangeText={v=>updateForm('taskTitle',v)}/><Field label="Due date (YYYY-MM-DD, optional)" value={form.dueDate||''} onChangeText={v=>updateForm('dueDate',v)}/><Field label="Priority (Low / Normal / High)" value={form.priority||'Normal'} onChangeText={v=>updateForm('priority',v)}/><Button title="Add task" onPress={addTask}/></Card><Card><Text style={styles.cardTitle}>Your tasks</Text>{data.tasks.map(x=><View key={x.id} style={styles.taskRow}><Pressable onPress={()=>toggleTask(x)} style={[styles.check,x.completed&&styles.checked]}><Text style={styles.checkText}>{x.completed?'✓':''}</Text></Pressable><View style={styles.itemText}><Text style={[styles.itemTitle,x.completed&&styles.done]}>{x.title}</Text><Text style={styles.itemDetail}>{x.dueDate?'Due '+x.dueDate:'No due date'} · {x.priority}</Text></View><Pressable onPress={()=>remove('tasks',x.id)}><Trash2 size={17} color={COLORS.red}/></Pressable></View>)}{!data.tasks.length?<Empty text="No tasks yet."/>:null}</Card></>;

  const renderSettings = () => <><Heading detail="Your data stays on this device.">Settings</Heading><Card><Text style={styles.cardTitle}>Local profile</Text><Field label="Display name" value={form.displayName??data.profile.displayName??''} onChangeText={v=>updateForm('displayName',v)}/><Field label="Program" value={form.program??data.profile.program??''} onChangeText={v=>updateForm('program',v)}/><Field label="Year and section" value={form.yearSection??data.profile.yearSection??''} onChangeText={v=>updateForm('yearSection',v)}/><Button title="Save profile" onPress={saveProfile}/></Card><Card><Text style={styles.cardTitle}>Reminders</Text><View style={styles.switchRow}><Text style={styles.itemTitle}>Enable local reminders</Text><Switch value={remindersEnabled} onValueChange={async value=>{setRemindersEnabled(value);await setSetting('remindersEnabled',value);}} trackColor={{true:COLORS.forest2}}/></View><Field label="Class reminder lead time (minutes)" value={leadMinutes} onChangeText={async value=>{setLeadMinutes(value);await setSetting('leadMinutes',value);}} keyboardType="number-pad"/><View style={styles.switchRow}><Text style={styles.itemTitle}>Chime sound</Text><Switch value={soundEnabled} onValueChange={async value=>{setSoundEnabled(value);await setSetting('soundEnabled',value);}} trackColor={{true:COLORS.forest2}}/></View><View style={styles.switchRow}><Text style={styles.itemTitle}>Vibration</Text><Switch value={vibrationEnabled} onValueChange={async value=>{setVibrationEnabled(value);await setSetting('vibrationEnabled',value);}} trackColor={{true:COLORS.forest2}}/></View><Button title="Request notification permission" secondary onPress={async()=>{const result=await Notifications.requestPermissionsAsync();Alert.alert('Notifications',result.granted?'Permission granted.':'Permission not granted.');}}/><Button title="Send test notification" secondary onPress={async()=>{const permission=await Notifications.requestPermissionsAsync();if(!permission.granted){Alert.alert('Permission required','Allow notifications in Android settings first.');return;}await Notifications.scheduleNotificationAsync({content:{title:'Schedule reminder test',body:'Your local notifications are working.',sound:soundEnabled?'schedule_chime.wav':null},trigger:null});Alert.alert('Sent','A local test notification was requested.');}}/></Card><Card><Text style={styles.cardTitle}>Storage</Text><Text style={styles.itemDetail}>Native SQLite database: schedule-local.db. No login, backend, or cloud sync is used.</Text><Button title="Refresh local data" secondary onPress={changed}/></Card></>;

  const screen = {home:renderHome,schedule:renderSchedule,budget:renderBudget,notes:renderNotes,tasks:renderTasks,settings:renderSettings}[tab];
  if (busy) return <SafeAreaView style={styles.loading}><StatusBar barStyle="dark-content" backgroundColor={COLORS.cream}/><GraduationCap size={34} color={COLORS.forest}/><Text style={styles.loadingText}>Preparing your local planner…</Text></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream}/>
    <View style={styles.topbar}><View style={styles.brand}><View style={styles.logo}><GraduationCap size={23} color="#fff"/></View><View><Text style={styles.brandEyebrow}>STUDENT PLANNER</Text><Text style={styles.brandName}>Schedule</Text></View></View><Pressable onPress={()=>setTab('settings')} style={styles.settingsIcon}><Settings color={COLORS.forest} size={21}/></Pressable></View>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView key={tab} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{screen()}</ScrollView>
    </KeyboardAvoidingView>
    <View style={styles.nav}>{TABS.map(({id,label,Icon})=><Pressable key={id} onPress={()=>{setTab(id);resetForm();}} style={[styles.navItem,tab===id&&styles.navActive]}><Icon size={19} color={tab===id?COLORS.forest:'#89948c'}/><Text style={[styles.navLabel,tab===id&&styles.navLabelActive]}>{label}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:COLORS.cream},flex:{flex:1},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.cream},loadingText:{marginTop:12,color:COLORS.muted,fontSize:14},
  topbar:{paddingHorizontal:18,paddingTop:8,paddingBottom:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{flexDirection:'row',alignItems:'center',gap:11},logo:{width:43,height:43,borderRadius:15,backgroundColor:COLORS.forest,alignItems:'center',justifyContent:'center'},brandEyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.5,color:COLORS.forest2},brandName:{fontSize:20,fontWeight:'800',color:COLORS.ink},settingsIcon:{width:40,height:40,borderRadius:20,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},
  content:{paddingHorizontal:16,paddingBottom:30,gap:14},heading:{marginTop:7,marginBottom:2},h1:{fontSize:26,fontWeight:'800',color:COLORS.ink},sub:{fontSize:12,color:COLORS.muted,marginTop:4},profileLine:{color:COLORS.muted,fontSize:12,marginTop:-8},
  card:{backgroundColor:COLORS.white,borderRadius:20,padding:16,borderWidth:1,borderColor:COLORS.line,gap:10},cardTitle:{fontSize:16,fontWeight:'800',color:COLORS.ink,marginBottom:3},stats:{flexDirection:'row',flexWrap:'wrap',gap:10},stat:{width:'48%',flexGrow:1,minHeight:90,justifyContent:'center'},statValue:{fontSize:21,fontWeight:'800',color:COLORS.forest,marginTop:8},balance:{fontSize:28,fontWeight:'900',color:COLORS.forest},label:{fontSize:10,fontWeight:'700',letterSpacing:.6,color:COLORS.muted},
  field:{gap:5},input:{minHeight:44,borderWidth:1,borderColor:COLORS.line,borderRadius:12,paddingHorizontal:12,paddingVertical:9,color:COLORS.ink,backgroundColor:'#fff',fontSize:14},multiline:{minHeight:90,textAlignVertical:'top'},button:{minHeight:46,backgroundColor:COLORS.forest,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:14,marginTop:3},buttonText:{color:'#fff',fontWeight:'800',fontSize:14},buttonSecondary:{backgroundColor:'#edf4ef',borderWidth:1,borderColor:'#d8e8dd'},buttonSecondaryText:{color:COLORS.forest},buttonDanger:{backgroundColor:'#fff1f0'},buttonDangerText:{color:COLORS.red},buttonCompact:{minHeight:36},
  item:{flexDirection:'row',alignItems:'center',paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed',gap:9},itemText:{flex:1},itemTitle:{fontSize:14,fontWeight:'700',color:COLORS.ink},itemDetail:{fontSize:11,color:COLORS.muted,marginTop:3},trailing:{fontSize:12,fontWeight:'800',color:COLORS.forest},delete:{padding:5},empty:{fontSize:12,color:COLORS.muted,paddingVertical:12},taskRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,borderTopWidth:1,borderTopColor:'#f0f1ed'},check:{width:23,height:23,borderWidth:1.5,borderColor:'#b8c7bd',borderRadius:7,alignItems:'center',justifyContent:'center'},checked:{backgroundColor:COLORS.forest,borderColor:COLORS.forest},checkText:{color:'#fff',fontWeight:'900'},done:{textDecorationLine:'line-through',color:'#9aa39b'},switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:7},nav:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:COLORS.line,paddingTop:7,paddingBottom:Platform.OS==='android'?7:3,paddingHorizontal:2},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3,paddingVertical:4,borderRadius:10},navActive:{backgroundColor:'#edf4ef'},navLabel:{fontSize:9,color:'#89948c',fontWeight:'600'},navLabelActive:{color:COLORS.forest,fontWeight:'900'}
});
