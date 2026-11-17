import test from 'node:test'
import assert from 'node:assert/strict'
import { filterNotes, normalizeNote } from './notes.js'

test('note validation trims text and defaults to personal', () => {
  const note = normalizeNote({ title: '  Review  ', content: '  Chapter one  ' })
  assert.equal(note.title, 'Review')
  assert.equal(note.content, 'Chapter one')
  assert.equal(note.kind, 'personal')
  assert.equal(note.subjectId, null)
  assert.equal(note.archived, false)
  assert.equal(note.pinned, false)
  assert.ok(note.updatedAt)
})

test('note validation requires a title and content', () => {
  assert.throws(() => normalizeNote({ content: 'Text' }), /title/)
  assert.throws(() => normalizeNote({ title: 'Title' }), /Write something/)
})

test('filtering searches title and body and sorts pinned notes first', () => {
  const notes = [
    { id: 1, title: 'Class', content: 'Database review', kind: 'lecture', updatedAt: '2026-11-17', pinned: false },
    { id: 2, title: 'Exam plan', content: 'Study later', kind: 'personal', updatedAt: '2026-11-16', pinned: true },
    { id: 3, title: 'Archived', content: 'Database', kind: 'lecture', archived: true, pinned: true },
  ]
  assert.deepEqual(filterNotes(notes, 'database').map((note) => note.id), [1])
  assert.deepEqual(filterNotes(notes).map((note) => note.id), [2, 1])
  assert.deepEqual(filterNotes(notes, '', 'all', true).map((note) => note.id), [3])
})
