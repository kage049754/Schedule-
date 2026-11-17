import { db } from '../database/db.js'

export function normalizeProfile(input = {}) {
  return {
    id: 'local',
    displayName: String(input.displayName || '').trim().slice(0, 60),
    program: String(input.program || '').trim().slice(0, 80),
    yearSection: String(input.yearSection || '').trim().slice(0, 60),
    updatedAt: new Date().toISOString(),
  }
}

export async function getLocalProfile() {
  return (await db.profile.get('local')) || normalizeProfile()
}

export async function saveLocalProfile(input) {
  const profile = normalizeProfile(input)
  await db.profile.put(profile)
  return profile
}
