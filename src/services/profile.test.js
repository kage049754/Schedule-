import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProfile } from './profile.js'

test('profile values are trimmed and bounded without requiring account details', () => {
  const profile = normalizeProfile({
    displayName: '  Alex  ',
    program: '  BS Information Technology ',
    yearSection: '  2-6 ',
  })
  assert.equal(profile.id, 'local')
  assert.equal(profile.displayName, 'Alex')
  assert.equal(profile.program, 'BS Information Technology')
  assert.equal(profile.yearSection, '2-6')
  assert.ok(profile.updatedAt)
})

test('blank profile fields remain valid and do not create a login identity', () => {
  const profile = normalizeProfile({})
  assert.equal(profile.displayName, '')
  assert.equal(profile.program, '')
  assert.equal(profile.yearSection, '')
})
