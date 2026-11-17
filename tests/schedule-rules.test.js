import test from 'node:test'
import assert from 'node:assert/strict'
import { hasTimeConflict, mergeAdjacentSlots } from '../src/services/scheduleRules.js'

test('allows adjacent entries without treating them as conflicts', () => {
  const existing = [{ startMinutes: 480, endMinutes: 540 }]
  assert.equal(hasTimeConflict(existing, { startMinutes: 540, endMinutes: 600 }), false)
})

test('rejects partial and fully-contained overlaps', () => {
  const existing = [{ startMinutes: 480, endMinutes: 600 }]
  assert.equal(hasTimeConflict(existing, { startMinutes: 570, endMinutes: 630 }), true)
  assert.equal(hasTimeConflict(existing, { startMinutes: 500, endMinutes: 550 }), true)
  assert.equal(hasTimeConflict(existing, { startMinutes: 480, endMinutes: 600 }), true)
})

test('ignores inactive timetable entries when checking conflicts', () => {
  const existing = [{ startMinutes: 480, endMinutes: 600, active: false }]
  assert.equal(hasTimeConflict(existing, { startMinutes: 500, endMinutes: 550 }), false)
})

test('merges only adjacent entries with matching subject, room, and type', () => {
  const merged = mergeAdjacentSlots([
    { id: 2, subjectId: 7, room: 'Lab 1', kind: 'Lab', startMinutes: 540, endMinutes: 600 },
    { id: 1, subjectId: 7, room: 'Lab 1', kind: 'Lab', startMinutes: 480, endMinutes: 540 },
    { id: 3, subjectId: 7, room: 'Lab 2', kind: 'Lab', startMinutes: 600, endMinutes: 660 },
  ])
  assert.equal(merged.length, 2)
  assert.equal(merged[0].endMinutes, 600)
  assert.deepEqual(merged[0].ids, [1, 2])
  assert.deepEqual(merged[1].ids, [3])
})
