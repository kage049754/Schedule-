export const DEFAULT_APPEARANCE = 'forest';

export const THEMES = Object.freeze({
  forest: Object.freeze({
    label: 'Forest',
    description: 'CampusOS signature green, cream, and soft sage',
    forest: '#174f3b', forest2: '#236b50', cream: '#f7f5ec', white: '#ffffff',
    ink: '#1f2937', muted: '#718096', line: '#e7e9e3', soft: '#edf4ef', red: '#b42318'
  }),
  ocean: Object.freeze({
    label: 'Ocean',
    description: 'Deep teal, clear blue, and cool paper',
    forest: '#1d5e7a', forest2: '#2f82a0', cream: '#f0f7fa', white: '#fcfeff',
    ink: '#1f2d36', muted: '#71838d', line: '#dce9ee', soft: '#e3f0f5', red: '#b42318'
  }),
  sunset: Object.freeze({
    label: 'Sunset',
    description: 'Warm terracotta, clay, and soft ivory',
    forest: '#99543d', forest2: '#b66b4e', cream: '#fbf3ed', white: '#ffffff',
    ink: '#332720', muted: '#88766c', line: '#eee1d8', soft: '#f7eae1', red: '#b42318'
  }),
  lavender: Object.freeze({
    label: 'Lavender',
    description: 'Plum accents, lilac, and pale violet',
    forest: '#67517f', forest2: '#8a72a6', cream: '#f6f2fa', white: '#fffDff',
    ink: '#30283b', muted: '#81768b', line: '#e9e1f0', soft: '#efe8f6', red: '#b42318'
  }),
  rose: Object.freeze({
    label: 'Rose',
    description: 'Berry accents, dusty pink, and blush',
    forest: '#925069', forest2: '#b46d86', cream: '#fbf1f4', white: '#fffDff',
    ink: '#372832', muted: '#897781', line: '#eedfe6', soft: '#f6e7ed', red: '#b42318'
  }),
  monochrome: Object.freeze({
    label: 'Monochrome',
    description: 'Charcoal, slate, and balanced grayscale',
    forest: '#343a40', forest2: '#59636d', cream: '#f1f2f3', white: '#ffffff',
    ink: '#252a2e', muted: '#737b82', line: '#e1e4e6', soft: '#e9ecef', red: '#b42318'
  })
});

export function normalizeAppearance(value) {
  return Object.hasOwn(THEMES, value) ? value : DEFAULT_APPEARANCE;
}
