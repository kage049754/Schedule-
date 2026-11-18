export const DEFAULT_APPEARANCE = 'forest';

export const THEMES = Object.freeze({
  forest: Object.freeze({ label: 'Forest', description: 'CampusOS signature green and warm cream', forest: '#174f3b', forest2: '#236b50', cream: '#f7f5ec', white: '#ffffff', ink: '#1f2937', muted: '#718096', line: '#e7e9e3', soft: '#edf4ef', red: '#b42318' }),
  sunset: Object.freeze({ label: 'Sunset', description: 'Warm terracotta with soft ivory surfaces', forest: '#99543d', forest2: '#b66b4e', cream: '#fbf3ed', white: '#ffffff', ink: '#332720', muted: '#88766c', line: '#eee1d8', soft: '#f7eae1', red: '#b42318' }),
  monochrome: Object.freeze({ label: 'Monochrome', description: 'Clean grayscale with restrained contrast', forest: '#343a40', forest2: '#59636d', cream: '#f1f2f3', white: '#ffffff', ink: '#252a2e', muted: '#737b82', line: '#e1e4e6', soft: '#e9ecef', red: '#b42318' })
});

export function normalizeAppearance(value) {
  return Object.hasOwn(THEMES, value) ? value : DEFAULT_APPEARANCE;
}
