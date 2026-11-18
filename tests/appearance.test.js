import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_APPEARANCE, THEMES, normalizeAppearance } from '../src-native/appearance.js';

test('six coordinated light color combinations are available', () => {
  assert.deepEqual(Object.keys(THEMES), ['forest', 'ocean', 'sunset', 'lavender', 'rose', 'monochrome']);
  assert.equal(Object.keys(THEMES).length, 6);
});

test('every palette defines valid accessible UI color tokens', () => {
  const required = ['forest', 'forest2', 'cream', 'white', 'ink', 'muted', 'line', 'soft', 'red'];
  for (const [id, theme] of Object.entries(THEMES)) {
    assert.ok(theme.label, id + ' has a label');
    assert.ok(theme.description, id + ' has a description');
    for (const token of required) {
      assert.match(theme[token], /^#[0-9a-fA-F]{6}$/, id + '.' + token + ' must be a six-digit hex color');
    }
  }
});

test('palettes have distinct accent combinations', () => {
  const combinations = Object.values(THEMES).map(theme => theme.forest + ':' + theme.forest2);
  assert.equal(new Set(combinations).size, combinations.length);
});

test('Forest remains the default and invalid saved choices recover safely', () => {
  assert.equal(DEFAULT_APPEARANCE, 'forest');
  assert.equal(normalizeAppearance('ocean'), 'ocean');
  assert.equal(normalizeAppearance('unknown-palette'), 'forest');
  assert.equal(normalizeAppearance(null), 'forest');
});
