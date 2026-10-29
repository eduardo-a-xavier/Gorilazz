const KEY = 'gorilazz.journey.v1';
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
