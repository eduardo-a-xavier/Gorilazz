import { NODES, ROADS, distance, nearestRoad } from './world-data.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function planPath(start, target) {
  const nearest = point => NODES.reduce((best, node, i) => distance(point, node) < distance(point, NODES[best]) ? i : best, 0);
  const from = nearest(start), to = nearest(target);
  const costs = NODES.map(() => Infinity), previous = new Map(), remaining = new Set(NODES.map((_, i) => i)); costs[from] = 0;
  while (remaining.size) {
    const at = [...remaining].reduce((a, b) => costs[a] < costs[b] ? a : b); remaining.delete(at);
    if (at === to) break;
    for (const road of ROADS.filter(r => r.from === at || r.to === at)) {
      const next = road.from === at ? road.to : road.from;
      if (costs[at] + road.length < costs[next]) { costs[next] = costs[at] + road.length; previous.set(next, { at, road }); }
    }
  }
  const segments = []; let cursor = to;
  while (cursor !== from && previous.has(cursor)) { const edge = previous.get(cursor); segments.unshift(edge.road.to === cursor ? edge.road.samples : [...edge.road.samples].reverse()); cursor = edge.at; }
  // Join the closest street first; ordinary manual driving stays unconstrained.
  const first = nearestRoad(start);
  const path = [first, NODES[from], ...segments.flatMap(samples => samples.filter((_, i) => i % 5 === 0)), target];
  return { points: path, index: distance(start, first) < 5 ? 1 : 0, target };
}
export function navigationInput(vehicle, navigation) {
  const points = navigation.points;
  while (navigation.index < points.length - 1 && distance(vehicle, points[navigation.index]) < 8) navigation.index++;
  const target = points[navigation.index]; const remaining = distance(vehicle, navigation.target);
  if (navigation.index === points.length - 1 && remaining < 8 && Math.abs(vehicle.speed) < 1) return { arrived: true, throttle: false, brake: true, steer: 0 };
  const angle = Math.atan2(-(target.x - vehicle.x), -(target.z - vehicle.z));
  const turn = Math.atan2(Math.sin(angle - vehicle.heading), Math.cos(angle - vehicle.heading));
  const desiredSpeed = Math.min(10, Math.max(2, 10 / (1 + Math.abs(turn) * 3)), Math.sqrt(Math.max(0, remaining - 5) * 7));
  return { throttle: vehicle.speed < desiredSpeed - .5, brake: vehicle.speed > desiredSpeed + .5 || vehicle.speed < 0, steer: clamp(turn * 2.2, -1, 1), arrived: false };
}
