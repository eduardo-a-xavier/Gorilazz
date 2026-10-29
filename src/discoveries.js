import { DISCOVERIES, MEMBER_LOCATIONS, distance, clearPath } from './world-data.js';
const KEY = 'gorilazz-discoveries-v1';
export function createJournal(storage) {
  const known = new Set();
  try { const saved = JSON.parse(storage?.getItem(KEY) || '[]'); if (Array.isArray(saved)) for (const id of saved) if (DISCOVERIES.some(d => d.id === id)) known.add(id); } catch { /* Storage is optional. */ }
  function persist() { try { storage?.setItem(KEY, JSON.stringify([...known])); } catch { /* Keep the in-memory journal. */ } }
  return { known, discover(id) { if (!DISCOVERIES.some(d => d.id === id)) return false; const fresh = !known.has(id); known.add(id); persist(); return fresh; }, reset() { known.clear(); persist(); } };
}
export function nearbyInteraction(vehicle) {
  const choices = [
    ...DISCOVERIES.map((point, index) => ({ ...point, type: 'discovery', index })),
    ...MEMBER_LOCATIONS.map((point, index) => ({ ...point, type: 'member', index, title: ['2-D', 'Murdoc', 'Noodle', 'Russel'][index] })),
  ].filter(point => distance(vehicle, point) < 13 && clearPath(vehicle, point.type === 'member' ? { x: point.x + (vehicle.x - point.x) * .4, z: point.z + (vehicle.z - point.z) * .4 } : point));
  choices.sort((a, b) => distance(vehicle, a) - distance(vehicle, b));
  return choices[0] || null;
}
