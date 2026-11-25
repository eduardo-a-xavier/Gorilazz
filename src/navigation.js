import { NODES, ROADS, distance, nearestRoad, roadGap } from './world-data.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const CRUISE_SPEED_MS = 16.5; // ~59.4 km/h (faixa 55–65 km/h nas retas)
export const LOOK_AHEAD_M = 8.5;

// Suavização Catmull-Rom entre pontos da malha viária: elimina quebras secas nos cruzamentos e preserva 100% dos pontos no asfalto.
export function catmullRomSpline(points, subdivisions = 4) {
  if (!points || points.length < 2) return points ? points.slice() : [];
  const filtered = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (distance(points[i], filtered.at(-1)) > .4) filtered.push(points[i]);
  }
  if (filtered.length < 3) return filtered;
  const out = [];
  for (let i = 0; i < filtered.length - 1; i++) {
    const p0 = filtered[Math.max(0, i - 1)];
    const p1 = filtered[i];
    const p2 = filtered[i + 1];
    const p3 = filtered[Math.min(filtered.length - 1, i + 2)];
    out.push(p1);
    const segLen = distance(p1, p2);
    const steps = segLen > 4 ? subdivisions : 2;
    for (let s = 1; s < steps; s++) {
      const u = s / steps, u2 = u * u, u3 = u2 * u;
      const x = .5 * ((2 * p1.x) + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
      const z = .5 * ((2 * p1.z) + (-p0.z + p2.z) * u + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * u2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * u3);
      const candidate = { x, z };
      // Garante que a curva Catmull-Rom nos cruzamentos nunca saia do asfalto; se cortar esquina além da pista, interpola linearmente ou projeta no eixo da via.
      if (roadGap(candidate) <= .2) out.push(candidate);
      else {
        const linear = { x: p1.x + (p2.x - p1.x) * u, z: p1.z + (p2.z - p1.z) * u };
        if (roadGap(linear) <= .2) out.push(linear);
      }
    }
  }
  out.push(filtered.at(-1));
  return out;
}

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
  const rawRoadPath = [first, ...paths[goal].filter((_, i) => i % 2 === 0), last];
  const smoothRoadPath = catmullRomSpline(rawRoadPath, 3);
  const path = [...smoothRoadPath, target];
  while (path.length < 3) path.splice(1, 0, { x: (first.x + last.x) / 2, z: (first.z + last.z) / 2 });
  return { points: path, index: distance(start, first) < 5 && path.length > 1 ? 1 : 0, target };
}

// Calcula o ponto de look-ahead contínuo ao longo da spline e a curvatura antecipada à frente para desacelerar antes das curvas.
export function sampleLookAhead(vehicle, points, startIndex, lookAhead = LOOK_AHEAD_M) {
  let idx = startIndex;
  while (idx < points.length - 1 && distance(vehicle, points[idx]) < 5.5) idx++;
  let acc = distance(vehicle, points[idx]);
  let aim = points[idx];
  let k = idx;
  while (k < points.length - 2 && acc < lookAhead) {
    const seg = distance(points[k], points[k + 1]);
    if (acc + seg >= lookAhead) {
      const t = seg > 1e-4 ? (lookAhead - acc) / seg : 0;
      aim = { x: points[k].x + (points[k + 1].x - points[k].x) * t, z: points[k].z + (points[k + 1].z - points[k].z) * t };
      break;
    }
    acc += seg;
    k++;
    aim = points[k];
  }
  // Mede a mudança de direção nos próximos ~24 m da spline para antecipar frenagem antes de curvas fechadas.
  let maxCurve = 0, curveDist = 0;
  let baseHeading = Math.atan2(-(aim.x - vehicle.x), -(aim.z - vehicle.z));
  for (let m = idx; m < points.length - 2 && curveDist < 24; m++) {
    const a = points[m], b = points[m + 1], d = distance(a, b);
    if (d < .2) continue;
    curveDist += d;
    const h = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    const diff = Math.abs(Math.atan2(Math.sin(h - baseHeading), Math.cos(h - baseHeading)));
    if (diff > maxCurve) maxCurve = diff;
  }
  return { index: idx, aim, maxCurve };
}

export function navigationInput(vehicle, navigation) {
  const points = navigation.points;
  const remaining = distance(vehicle, navigation.target);
  const dynamicLookAhead = clamp(6.0 + Math.abs(vehicle.speed) * .32, 6.0, 10.5);
  const { index, aim, maxCurve } = sampleLookAhead(vehicle, points, navigation.index, dynamicLookAhead);
  navigation.index = index;
  if (navigation.index >= points.length - 1 && remaining < 8 && Math.abs(vehicle.speed) < 1) return { arrived: true, throttle: false, brake: true, steer: 0 };
  const target = navigation.index >= points.length - 1 ? points[navigation.index] : aim;
  const angle = Math.atan2(-(target.x - vehicle.x), -(target.z - vehicle.z));
  const turn = Math.atan2(Math.sin(angle - vehicle.heading), Math.cos(angle - vehicle.heading));
  if (!navigation.reversing && ((Math.abs(turn) > 1.65 && remaining > 10) || (vehicle.blocked && remaining > 8))) {
    navigation.reversing = true;
    navigation.reverseTicks = 0;
    navigation.reverseSteer = -Math.sign(turn || 1);
  }
  if (navigation.reversing) {
    navigation.reverseTicks++;
    if ((vehicle.blocked && vehicle.speed <= 0 && navigation.reverseTicks > 15) || (Math.abs(turn) < 1.15 && navigation.reverseTicks >= 45) || navigation.reverseTicks > 300) {
      navigation.reversing = false;
    } else {
      if (!vehicle.reverseReady && vehicle.speed >= -.05) {
        if (Math.abs(vehicle.speed) >= .05) return { throttle: false, brake: true, steer: 0, arrived: false };
        return { throttle: false, brake: !vehicle.brakeWasDown, steer: 0, arrived: false };
      }
      return { throttle: false, brake: true, steer: clamp((navigation.reverseSteer ?? -Math.sign(turn || 1)) * .9, -1, 1), arrived: false };
    }
  }
  // Velocidade de cruzeiro nas retas (~16.5 m/s ≈ 59.4 km/h), reduzindo suavemente antes de curvas (maxCurve) e na aproximação do destino.
  const cornerSeverity = Math.max(Math.abs(turn) * 1.4, maxCurve * .95);
  const curveCap = CRUISE_SPEED_MS / (1 + cornerSeverity * 3.1);
  const arrivalCap = Math.sqrt(Math.max(0, remaining - 5) * 7);
  const desiredSpeed = Math.min(CRUISE_SPEED_MS, Math.max(2, curveCap), arrivalCap);
  const rawSteer = clamp(turn * 2.1, -1, 1);
  const prevSteer = navigation.smoothSteer ?? rawSteer;
  navigation.smoothSteer = prevSteer + (rawSteer - prevSteer) * .38;
  return {
    throttle: vehicle.speed < desiredSpeed - .5,
    brake: vehicle.speed > desiredSpeed + .5,
    steer: clamp(navigation.smoothSteer, -1, 1),
    arrived: false,
  };
}
