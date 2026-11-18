import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NAVIGATION_ORDER,
  getVisibleNavigationTabs,
  moveNavigationModule,
  normalizeNavigationPreferences,
  setNavigationModuleVisible,
} from '../src-native/navigation.js';

test('navigation preferences normalize malformed and incomplete values safely', () => {
  assert.deepEqual(normalizeNavigationPreferences(), { order: [...DEFAULT_NAVIGATION_ORDER], hidden: [] });
  assert.deepEqual(normalizeNavigationPreferences('{bad json'), { order: [...DEFAULT_NAVIGATION_ORDER], hidden: [] });
  assert.deepEqual(normalizeNavigationPreferences({
    order: ['tasks', 'tasks', 'unknown', 'budget'],
    hidden: ['home', 'settings', 'notes', 'notes', 'bad'],
  }), { order: ['home', 'tasks', 'budget', 'schedule', 'notes', 'settings'], hidden: ['notes'] });
});

test('home and settings stay pinned while modules can be moved', () => {
  const moved = moveNavigationModule({}, 'tasks', -1);
  assert.deepEqual(moved.order, ['home', 'schedule', 'budget', 'tasks', 'notes', 'settings']);
  assert.deepEqual(moveNavigationModule(moved, 'schedule', -1).order, moved.order);
  assert.deepEqual(moveNavigationModule(moved, 'settings', -1).order, moved.order);
});

test('module visibility can be toggled without hiding pinned navigation', () => {
  const hidden = setNavigationModuleVisible({}, 'budget', false);
  assert.deepEqual(hidden.hidden, ['budget']);
  assert.deepEqual(getVisibleNavigationTabs(hidden), ['home', 'schedule', 'notes', 'tasks', 'settings']);
  assert.deepEqual(setNavigationModuleVisible(hidden, 'budget', true).hidden, []);
  assert.deepEqual(setNavigationModuleVisible(hidden, 'home', false).hidden, ['budget']);
});
