export const DEFAULT_NAVIGATION_ORDER = Object.freeze(['home', 'schedule', 'budget', 'notes', 'tasks', 'settings']);
const MODULE_IDS = Object.freeze(['schedule', 'budget', 'notes', 'tasks']);

export function normalizeNavigationPreferences(input = {}) {
  let value = input;
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { value = {}; }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) value = {};

  const requestedOrder = Array.isArray(value.order) ? value.order : [];
  const moduleOrder = [...new Set([
    ...requestedOrder.filter(id => MODULE_IDS.includes(id)),
    ...MODULE_IDS
  ])];
  const requestedHidden = Array.isArray(value.hidden) ? value.hidden : [];
  const hidden = [...new Set(requestedHidden.filter(id => MODULE_IDS.includes(id)))];

  return { order: ['home', ...moduleOrder, 'settings'], hidden };
}
