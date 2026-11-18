import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_APPEARANCE, THEMES, normalizeAppearance } from '../src-native/appearance.js';

test('CampusOS appearance presets provide complete light palettes', () => {
  assert.deepEqual(Object.keys(THEMES), ['forest', 'sunset', 'monochrome']);
  for (const theme of Object.values(THEMES)) {
    for (const key of ['forest', 'forest2', 'cream', 'white', 'ink', 'muted', 'line', 'soft', 'red']) {
      assert.match(theme[key], /^#[0-9a-f]{6}$/i);
    }
  }
  assert.equal(THEMES.forest.forest, '#174f3b');
  assert.equal(THEMES.forest.cream, '#f7f5ec');
});

test('appearance selection safely falls back to Forest for unknown values', () => {
  assert.equal(DEFAULT_APPEARANCE, 'forest');
  assert.equal(normalizeAppearance('sunset'), 'sunset');
  assert.equal(normalizeAppearance('monochrome'), 'monochrome');
  assert.equal(normalizeAppearance('dark'), 'forest');
  assert.equal(normalizeAppearance(null), 'forest');
});
