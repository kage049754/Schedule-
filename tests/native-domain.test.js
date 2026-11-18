import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoneyToCentavos, parseTimeToMinutes, hasTimeConflict, getAllowanceRange, calculateAvailableBalance, normalizeActivityInput } from '../src-native/domain.js';

test('money is stored as integer centavos', () => {
  assert.equal(parseMoneyToCentavos('205'), 20500);
  assert.equal(parseMoneyToCentavos('20.50'), 2050);
  assert.throws(() => parseMoneyToCentavos('0'));
});
test('time parsing validates 24-hour values', () => {
  assert.equal(parseTimeToMinutes('08:30'), 510);
  assert.throws(() => parseTimeToMinutes('25:00'));
});
test('schedule overlap rejects intersecting entries but allows adjacency', () => {
  const current = [{ startMinutes: 480, endMinutes: 540 }];
  assert.equal(hasTimeConflict(current, { startMinutes: 500, endMinutes: 560 }), true);
  assert.equal(hasTimeConflict(current, { startMinutes: 540, endMinutes: 600 }), false);
});
test('weekly allowance begins Monday and spans seven days', () => {
  assert.deepEqual(getAllowanceRange('weekly', new Date(2026, 10, 18)), { startDate: '2026-11-16', endDate: '2026-11-22' });
});
test('balance combines active allowance and income less expenses', () => {
  assert.equal(calculateAvailableBalance({allowances:[{amount:10000,startDate:'2026-01-01',endDate:'2026-12-31'}],income:[{amount:5000,date:'2026-11-01'}],expenses:[{amount:2500,date:'2026-11-18'}]},'2026-11-18'),12500);
});

test('personal activities validate and normalize their weekly schedule fields', () => {
  assert.deepEqual(normalizeActivityInput({title:' Study group ',day:3,startMinutes:600,endMinutes:660,location:' Library ',notes:' Bring notes '}),
    {title:'Study group',day:3,startMinutes:600,endMinutes:660,location:'Library',notes:'Bring notes'});
  assert.throws(() => normalizeActivityInput({title:'',day:3,startMinutes:600,endMinutes:660}), /title/);
  assert.throws(() => normalizeActivityInput({title:'Activity',day:0,startMinutes:600,endMinutes:660}), /Monday–Saturday/);
  assert.throws(() => normalizeActivityInput({title:'Activity',day:3,startMinutes:660,endMinutes:600}), /End time/);
});
test('personal activity overlap checks treat class and activity entries equally', () => {
  const classSlot = {startMinutes:480,endMinutes:540};
  const otherActivity = {startMinutes:600,endMinutes:660};
  const candidate = normalizeActivityInput({title:'Appointment',day:1,startMinutes:530,endMinutes:570});
  assert.equal(hasTimeConflict([classSlot,otherActivity],candidate),true);
  const adjacent = normalizeActivityInput({title:'Appointment',day:1,startMinutes:540,endMinutes:600});
  assert.equal(hasTimeConflict([classSlot,otherActivity],adjacent),false);
});
