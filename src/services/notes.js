import { db } from '../database/db.js'

export function normalizeNote(input) {
  const title = String(input.title || '').trim()
  const content = String(input.content || '').trim()
  const kind = ['personal', 'lecture', 'subject'].includes(input.kind) ? input.kind : 'personal'
  if (!title) throw new Error('Enter a note title.')
  if (!content) throw new Error('Write something before saving the note.')
  return {
    title,
    content,
    kind,
    subjectId: input.subjectId ? Number(input.subjectId) : null,
    updatedAt: new Date().toISOString(),
    archived: Boolean(input.archived),
    pinned: Boolean(input.pinned),
  }
}

export async function saveNote(input, id = null) {
  const note = normalizeNote(input)
  if (note.subjectId) {
    const subject = await db.subjects.get(note.subjectId)
    if (!subject) throw new Error('The selected subject no longer exists.')
  }
  if (id) {
    const existing = await db.notes.get(Number(id))
    if (!existing) throw new Error('This note no longer exists.')
    await db.notes.update(Number(id), note)
    return Number(id)
  }
  return db.notes.add({ ...note, createdAt: note.updatedAt })
}

export async function deleteNote(id) {
  return db.notes.delete(Number(id))
}

export async function setNoteArchived(id, archived) {
  return db.notes.update(Number(id), { archived: Boolean(archived), updatedAt: new Date().toISOString() })
}

export async function setNotePinned(id, pinned) {
  return db.notes.update(Number(id), { pinned: Boolean(pinned), updatedAt: new Date().toISOString() })
}

export function filterNotes(notes, search = '', kind = 'all', archived = false) {
  const query = String(search).trim().toLocaleLowerCase()
  return notes.filter((note) => Boolean(note.archived) === archived)
    .filter((note) => kind === 'all' || note.kind === kind)
    .filter((note) => !query || [note.title, note.content].some((value) => String(value || '').toLocaleLowerCase().includes(query)))
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}
