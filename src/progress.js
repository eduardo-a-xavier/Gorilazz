import { WORLD_BOUNDS, OBSTACLES } from './world-data.js';
const KEY = 'gorilazz.journey.v1';
const WORLD_KEY = 'gorilazz.world.v1';
export function loadJourney(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY) ?? 'null');
    if (data?.version !== 1) return { position: 0, discovered: [] };
    const position = Number.isFinite(data.position) ? ((data.position % 1) + 1) % 1 : 0;
    const discovered = Array.isArray(data.discovered) ? [...new Set(data.discovered.filter(index => Number.isInteger(index) && index >= 0 && index < 4))] : [];
    return { position, discovered };
  } catch { return { position: 0, discovered: [] }; }
}
export function saveJourney(storage, position, discovered) {
  try {
    storage.setItem(KEY, JSON.stringify({ version: 1, position: ((position % 1) + 1) % 1, discovered: [...discovered] }));
    return true;
  } catch { return false; }
}

export function loadWorldJourney(storage) {
  try {
    const data = JSON.parse(storage?.getItem(WORLD_KEY) ?? 'null');
    if (data?.version !== 1) return null;
    const discovered = Array.isArray(data.discovered) ? [...new Set(data.discovered.filter(index => Number.isInteger(index) && index >= 0 && index < 4))] : [];
    const { x, z, heading } = data.vehicle ?? {};
    const safe = Number.isFinite(x) && Number.isFinite(z) && Number.isFinite(heading) &&
      x >= WORLD_BOUNDS.minX + 3 && x <= WORLD_BOUNDS.maxX - 3 && z >= WORLD_BOUNDS.minZ + 3 && z <= WORLD_BOUNDS.maxZ - 3 &&
      !OBSTACLES.some(point => Math.hypot(x - point.x, z - point.z) < point.radius + 2.3);
    return { vehicle: safe ? { x, z, heading: Math.atan2(Math.sin(heading), Math.cos(heading)) } : { x: 0, z: 0, heading: 0 }, discovered };
  } catch { return null; }
}
export function saveWorldJourney(storage, vehicle, discovered) {
  try {
    storage?.setItem(WORLD_KEY, JSON.stringify({ version: 1, vehicle: { x: vehicle.x, z: vehicle.z, heading: vehicle.heading }, discovered: [...discovered] }));
    return Boolean(storage);
  } catch { return false; }
}
