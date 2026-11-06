import { NODES, ROADS, distance, nearestRoad } from './world-data.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function planPath(start, target) {
  const first = nearestRoad(start), last = nearestRoad(target);
  const startRoad = ROADS[first.road], endRoad = ROADS[last.road];
  const nearestIndex = (road, point) => road.samples.reduce((best, p, i) =>
    distance(p,point) < distance(road.samples[best],point) ? i : best, 0);
  const startIndex = nearestIndex(startRoad, first), endIndex = nearestIndex(endRoad, last);
  const graph = NODES.map(() => []);
  const origin = graph.push([]) - 1, goal = graph.push([]) - 1;
  function edge(from,to,points) {
    const cost = points.slice(1).reduce((sum,p,i) => sum + distance(points[i],p),0);
    graph[from].push({ to, points, cost });
  }
  for (const road of ROADS) {
    edge(road.from, road.to, road.samples);
    edge(road.to, road.from, road.samples.slice().reverse());
  }
  edge(origin,startRoad.from,startRoad.samples.slice(0,startIndex+1).reverse());
  edge(origin,startRoad.to,startRoad.samples.slice(startIndex));
  edge(endRoad.from,goal,endRoad.samples.slice(0,endIndex+1));
  edge(endRoad.to,goal,endRoad.samples.slice(endIndex).reverse());
  if (startRoad === endRoad) {
    const segment = startRoad.samples.slice(Math.min(startIndex,endIndex),Math.max(startIndex,endIndex)+1);
    edge(origin,goal,startIndex <= endIndex ? segment : segment.reverse());
  }
  const costs = graph.map(() => Infinity), paths = graph.map(() => []), remaining = new Set(graph.keys());
  costs[origin] = 0;
  while (remaining.size) {
    const at = [...remaining].reduce((a,b) => costs[a] < costs[b] ? a : b);
    if (at === goal) break;
    remaining.delete(at);
    for (const edge of graph[at]) {
      const cost = costs[at] + edge.cost;
      if (cost >= costs[edge.to]) continue;
      costs[edge.to] = cost;
      paths[edge.to] = paths[at].concat(edge.points);
    }
  }
  const path = [first, ...paths[goal].filter((_, i) => i % 2 === 0), last, target];
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
