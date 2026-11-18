export const PINNED_NAVIGATION_TABS = Object.freeze(['home', 'settings']);
export const MOVABLE_NAVIGATION_TABS = Object.freeze(['schedule', 'budget', 'notes', 'tasks']);
export const DEFAULT_NAVIGATION_ORDER = Object.freeze(['home', ...MOVABLE_NAVIGATION_TABS, 'settings']);

function readPreferences(input) {
  if (typeof input !== 'string') return input && typeof input === 'object' ? input : {};
  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function normalizeNavigationPreferences(input = {}) {
  const value = readPreferences(input);
  const supplied = Array.isArray(value.order) ? value.order : [];
  const movable = [...new Set(supplied.filter((id) => MOVABLE_NAVIGATION_TABS.includes(id)))];
  const order = ['home', ...movable, ...MOVABLE_NAVIGATION_TABS.filter((id) => !movable.includes(id)), 'settings'];
  const hidden = [...new Set((Array.isArray(value.hidden) ? value.hidden : [])
    .filter((id) => MOVABLE_NAVIGATION_TABS.includes(id)))];
  return { order, hidden };
}

export function moveNavigationModule(input, moduleId, direction) {
  const preferences = normalizeNavigationPreferences(input);
  if (!MOVABLE_NAVIGATION_TABS.includes(moduleId) || ![-1, 1].includes(direction)) return preferences;
  const modules = preferences.order.slice(1, -1);
  const index = modules.indexOf(moduleId);
  const target = index + direction;
  if (target < 0 || target >= modules.length) return preferences;
  [modules[index], modules[target]] = [modules[target], modules[index]];
  return { ...preferences, order: ['home', ...modules, 'settings'] };
}

export function setNavigationModuleVisible(input, moduleId, visible) {
  const preferences = normalizeNavigationPreferences(input);
  if (!MOVABLE_NAVIGATION_TABS.includes(moduleId)) return preferences;
  const hidden = visible
    ? preferences.hidden.filter((id) => id !== moduleId)
    : [...new Set([...preferences.hidden, moduleId])];
  return { ...preferences, hidden };
}

export function getVisibleNavigationTabs(input) {
  const preferences = normalizeNavigationPreferences(input);
  return preferences.order.filter((id) => PINNED_NAVIGATION_TABS.includes(id) || !preferences.hidden.includes(id));
}
