import { NODES, ROADS, distance, nearestRoad, roadGap } from './world-data.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const CRUISE_SPEED_MS = 17.6; // ~63.4 km/h (ritmo vivo na faixa 55–65 km/h nas retas)
export const LOOK_AHEAD_M = 9.5;

// Suavização Catmull-Rom entre pontos da malha viária: elimina quebras secas nos cruzamentos e preserva 100% dos pontos no asfalto.
export function catmullRomSpline(points, subdivisions = 8) {
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
      if (roadGap(candidate) <= -.5) out.push(candidate);
      else {
        const linear = { x: p1.x + (p2.x - p1.x) * u, z: p1.z + (p2.z - p1.z) * u };
        if (roadGap(linear) <= -.5) out.push(linear);
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
  const hasHeading = Number.isFinite(start?.heading);
  const fx = hasHeading ? -Math.sin(start.heading) : 0;
  const fz = hasHeading ? -Math.cos(start.heading) : 0;
  const initialDot = points => {
    if (!hasHeading || !points || points.length < 2) return 1;
    const p0 = points[0];
    const p1 = points[Math.min(points.length - 1, 3)];
    const dx = p1.x - p0.x, dz = p1.z - p0.z, len = Math.hypot(dx, dz);
    return len > 1e-4 ? (dx * fx + dz * fz) / len : 1;
  };
  const originCandidates = [
    { to: startRoad.from, opp: startRoad.to, points: startRoad.samples.slice(0, startIndex + 1).reverse() },
    { to: startRoad.to, opp: startRoad.from, points: startRoad.samples.slice(startIndex) },
  ];
  if (startRoad === endRoad) {
    const segment = startRoad.samples.slice(Math.min(startIndex, endIndex), Math.max(startIndex, endIndex) + 1);
    originCandidates.push({ to: goal, opp: -1, points: startIndex <= endIndex ? segment : segment.reverse() });
  }
  // Proíbe retorno/U-turn fechado na mesma rua quando o alvo está atrás do carro em distância curta: força seguir em frente e contornar pelo quarteirão.
  const midRoad = startIndex > 4 && startIndex < startRoad.samples.length - 5;
  const shortBehind = hasHeading && midRoad && (startRoad === endRoad || distance(start, target) < 45);
  const forwardCandidates = shortBehind ? originCandidates.filter(c => initialDot(c.points) >= 0) : originCandidates;
  const chosenOrigin = forwardCandidates.length ? forwardCandidates : originCandidates;
  // Se uma direção da rua inicial foi bloqueada por exigir meia-volta, também bloqueia voltar por essa mesma rua no primeiro cruzamento.
  const blockedBackFrom = chosenOrigin.length === 1 && chosenOrigin[0].opp >= 0 ? chosenOrigin[0].to : -1;
  const blockedBackTo = chosenOrigin.length === 1 && chosenOrigin[0].opp >= 0 ? chosenOrigin[0].opp : -1;
  for (const road of ROADS) {
    if (!(road === startRoad && road.from === blockedBackFrom && road.to === blockedBackTo)) edge(road.from, road.to, road.samples);
    if (!(road === startRoad && road.to === blockedBackFrom && road.from === blockedBackTo)) edge(road.to, road.from, road.samples.slice().reverse());
  }
  for (const c of chosenOrigin) edge(origin, c.to, c.points);
  edge(endRoad.from,goal,endRoad.samples.slice(0,endIndex+1));
  edge(endRoad.to,goal,endRoad.samples.slice(endIndex).reverse());
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
  const smoothRoadPath = catmullRomSpline(rawRoadPath, 8);
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
  // Mede a mudança de direção nos próximos ~34 m da spline para antecipar frenagem antes de curvas fechadas.
  let maxCurve = 0, curveDist = 0;
  let baseHeading = Math.atan2(-(aim.x - vehicle.x), -(aim.z - vehicle.z));
  for (let m = idx; m < points.length - 2 && curveDist < 34; m++) {
    const a = points[m], b = points[m + 1], d = distance(a, b);
    if (d < .2) continue;
    curveDist += d;
    const h = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    const diff = Math.abs(Math.atan2(Math.sin(h - baseHeading), Math.cos(h - baseHeading)));
    if (diff > maxCurve) maxCurve = diff;
  }
  return { index: idx, aim, maxCurve };
}

// Ré de destravamento só depois de 1,5 s realmente bloqueado (120 passos/s).
export const UNSTICK_DELAY_TICKS = 180;
// Rampa de saída da parada: o carro parte de ~4 m/s e chega ao cruzeiro em ~1,2 s.
export const LAUNCH_RAMP_S = 1.2;
// Limite de giro acumulado sem avanço (~315°) para acionar recálculo anti-looping pelo quarteirão.
export const LOOP_TURN_LIMIT_RAD = 5.5;

export function navigationInput(vehicle, navigation, { sinceStop = Infinity } = {}) {
  navigation.reversing ??= false;
  const points = navigation.points;
  const remaining = distance(vehicle, navigation.target);
  const dynamicLookAhead = clamp(5.2 + Math.abs(vehicle.speed) * .28, 5.2, 10.5);
  const { index, aim, maxCurve } = sampleLookAhead(vehicle, points, navigation.index, dynamicLookAhead);
  const prevIndex = navigation.index;
  navigation.index = index;
  // Guarda anti-looping: se o carro acumular >= 315° de giro sem avançar nos waypoints nem se aproximar do alvo, recalcula a rota contornando pela frente.
  if (Number.isFinite(navigation.prevHeading)) {
    const dh = Math.abs(Math.atan2(Math.sin(vehicle.heading - navigation.prevHeading), Math.cos(vehicle.heading - navigation.prevHeading)));
    if (navigation.index > prevIndex || remaining < (navigation.progressRef ?? remaining) - 2) {
      navigation.progressRef = remaining;
      navigation.turnAccum = 0;
    } else if (!navigation.reversing) {
      navigation.turnAccum = (navigation.turnAccum ?? 0) + dh;
    }
    if (navigation.turnAccum >= LOOP_TURN_LIMIT_RAD && remaining > 10 && navigation.target) {
      const replanned = planPath(vehicle, navigation.target);
      while (replanned.index < replanned.points.length - 1 && distance(vehicle, replanned.points[replanned.index]) < 6) replanned.index++;
      navigation.points = replanned.points;
      navigation.index = replanned.index;
      navigation.turnAccum = 0;
      navigation.progressRef = remaining;
      navigation.reversing = false;
      navigation.loopRecoveries = (navigation.loopRecoveries ?? 0) + 1;
    }
  } else {
    navigation.progressRef = remaining;
    navigation.turnAccum = 0;
  }
  navigation.prevHeading = vehicle.heading;
  const activePoints = navigation.points;
  const activeAim = navigation.index >= activePoints.length - 1 ? activePoints[activePoints.length - 1] : (activePoints === points ? aim : activePoints[navigation.index]);
  if ((navigation.index >= activePoints.length - 1 || remaining < 6) && remaining < 8 && Math.abs(vehicle.speed) < 1) return { arrived: true, throttle: false, brake: true, steer: 0, drift: false };
  const target = activeAim;
  const angle = Math.atan2(-(target.x - vehicle.x), -(target.z - vehicle.z));
  const turn = Math.atan2(Math.sin(angle - vehicle.heading), Math.cos(angle - vehicle.heading));
  if (!navigation.reversing) {
    navigation.blockedTicks = vehicle.blocked ? (navigation.blockedTicks ?? 0) + 1 : 0;
  }
  const stuck = (navigation.blockedTicks ?? 0) > UNSTICK_DELAY_TICKS;
  if (!navigation.reversing && stuck) {
    navigation.reversing = true;
    navigation.reverseTicks = 0;
    navigation.blockedTicks = 0;
    navigation.reverseSteer = -Math.sign(turn || 1);
  }
  if (navigation.reversing) {
    navigation.reverseTicks++;
    if ((!vehicle.blocked && navigation.reverseTicks > 45) || (vehicle.blocked && vehicle.speed <= 0 && navigation.reverseTicks > 60) || (Math.abs(turn) < 1.15 && navigation.reverseTicks >= 90) || navigation.reverseTicks > 300) {
      navigation.reversing = false;
    } else {
      if (!vehicle.reverseReady && vehicle.speed >= -.05) {
        if (Math.abs(vehicle.speed) >= .05) return { throttle: false, brake: true, steer: 0, drift: false, arrived: false };
        return { throttle: false, brake: !vehicle.brakeWasDown, steer: 0, drift: false, arrived: false };
      }
      return { throttle: false, brake: true, steer: clamp((navigation.reverseSteer ?? -Math.sign(turn || 1)) * .9, -1, 1), drift: false, arrived: false };
    }
  }
  // Velocidade de cruzeiro viva nas retas (~63 km/h), mantendo fluidez em curvas médias e desacelerando só em curvas fechadas ou aproximação final.
  const absTurn = Math.abs(turn);
  const cornerSeverity = Math.max(Math.max(0, absTurn - .12) * 1.2, Math.max(0, maxCurve - .22) * .78);
  const curveCap = CRUISE_SPEED_MS / (1 + cornerSeverity * 3.4);
  const minCornerSpeed = absTurn > 0.55 ? 1.8 : 2.8;
  const arrivalCap = Math.sqrt(Math.max(0, remaining - 5) * 7);
  // Rampa de saída progressiva e ágil.
  const launch = clamp(sinceStop / LAUNCH_RAMP_S, 0, 1);
  const launchCap = 4.0 + (CRUISE_SPEED_MS - 4.0) * (launch * (2 - launch));
  const desiredSpeed = Math.min(CRUISE_SPEED_MS, Math.max(minCornerSpeed, curveCap), arrivalCap, launchCap);
  const rawSteer = clamp(turn * 2.6, -1, 1);
  const prevSteer = navigation.smoothSteer ?? rawSteer;
  navigation.smoothSteer = prevSteer + (rawSteer - prevSteer) * .42;
  // Drift / escorregada controlada orgânica em curvas moderadas/fechadas com velocidade firme, mantendo margem ampla no asfalto (avenidas largas).
  const safeOnRoad = roadGap(vehicle) <= -2.5 && remaining > 18;
  const drift = safeOnRoad && vehicle.speed > 9.5 && absTurn <= .95 && (absTurn > .22 || maxCurve > .48) && Math.abs(navigation.smoothSteer) > .22;
  return {
    throttle: vehicle.speed < desiredSpeed - .4,
    brake: vehicle.speed > desiredSpeed + .5,
    steer: clamp(navigation.smoothSteer, -1, 1),
    drift,
    arrived: false,
  };
}
