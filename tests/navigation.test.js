import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_NAVIGATION_ORDER, normalizeNavigationPreferences } from '../src-native/navigation.js';

test('navigation defaults keep Home first and Settings last', () => {
  assert.deepEqual(normalizeNavigationPreferences(), {
    order: DEFAULT_NAVIGATION_ORDER,
    hidden: []
  });
});

test('saved module order is preserved while pinned tabs remain fixed', () => {
  const result = normalizeNavigationPreferences({
    order: ['tasks', 'settings', 'budget', 'home', 'schedule', 'notes', 'tasks'],
    hidden: ['budget', 'home', 'settings', 'unknown', 'budget']
  });
  assert.deepEqual(result.order, ['home', 'tasks', 'budget', 'schedule', 'notes', 'settings']);
  assert.deepEqual(result.hidden, ['budget']);
});

test('navigation preferences accept serialized local settings and recover from invalid JSON', () => {
  assert.deepEqual(normalizeNavigationPreferences('{"order":["notes"],"hidden":["tasks"]}'), {
    order: ['home', 'notes', 'schedule', 'budget', 'tasks', 'settings'],
    hidden: ['tasks']
  });
  assert.deepEqual(normalizeNavigationPreferences('{bad json'), {
    order: DEFAULT_NAVIGATION_ORDER,
    hidden: []
  });
});
