// Minimapa SVG, mapa completo (M), destinos clicáveis, traçado da rota e posição do Geep.
import { CITY_ERAS, CITY_LOTS, DISCOVERIES, ERA_GATES, MEMBER_LOCATIONS, REGIONS, ROADS, distance, eraAt, regionAt } from './world-data.js';
import { MINIMAP_RECT, minimapCanvasSize, paintMinimapArt } from './minimap-art.js';

export function createMapUI({
  sceneSection,
  cameraState,
  bandToggle,
  vehicle,
  members,
  memberAccents,
  onboarding,
  quickMap,
  getWorld,
  getLocalRadio,
  enterWorld,
  stop,
  toggleHudMenu,
  syncCameraModes,
  focusWorld,
  startNavigation,
}) {
  const fullMapOverlay = document.querySelector('#full-map-overlay');
  const mapOpenBtn = document.querySelector('#map-open');
  const map = document.querySelector('#world-map');
  let mapCameraSnapshot = null;

  // Fundo pré-renderizado do minimapa (uma vez, em canvas) e cópia vetorial só no mapa completo.
  const minimapArt = (() => {
    const c = document.createElement('canvas');
    const { width, height } = minimapCanvasSize();
    c.width = width; c.height = height;
    paintMinimapArt(c.getContext('2d'), { lots: CITY_LOTS, roads: ROADS, eraColor: lot => CITY_ERAS[lot.era].color });
    return c.toDataURL('image/webp', .9);
  })();

  const buildMapSvgContent = (carId, detailed = false, art = null) =>
    `<rect x="-140" y="-200" width="280" height="250" rx="22" fill="#182723" stroke="#c4dc9d33" stroke-width="1.5"/>` +
    (art ? `<image class="map-art" href="${art}" x="${MINIMAP_RECT.x}" y="${MINIMAP_RECT.y}" width="${MINIMAP_RECT.w}" height="${MINIMAP_RECT.h}" preserveAspectRatio="none"/>` : '') +
    (art ? '' : CITY_LOTS.map(l => `<rect x="${-l.w/2}" y="${-l.d/2}" width="${l.w}" height="${l.d}" fill="${CITY_ERAS[l.era].color}" fill-opacity="${detailed ? '.55' : '.48'}" transform="translate(${l.x.toFixed(1)} ${l.z.toFixed(1)}) rotate(${(-l.rotation*180/Math.PI).toFixed(1)})"/>`).join('')) +
    (art ? '' : ROADS.map(r => `<polyline points="${r.samples.map(p => `${p.x},${p.z}`).join(' ')}" fill="none" stroke="#111817" stroke-width="${r.width*.56}" stroke-linecap="round"/><polyline points="${r.samples.map(p => `${p.x},${p.z}`).join(' ')}" fill="none" stroke="#e9e4d480" stroke-width="${r.width*.42}" stroke-linecap="round"/>`).join('')) +
    ERA_GATES.map(g => `<g class="map-gate"><circle cx="${g.x.toFixed(1)}" cy="${g.z.toFixed(1)}" r="${detailed ? 5.6 : 4.8}" fill="#0c1314" stroke="${CITY_ERAS[g.era].color}" stroke-width="${detailed ? 1.8 : 1.6}"/><text x="${g.x.toFixed(1)}" y="${(g.z+2.1).toFixed(1)}" text-anchor="middle" fill="${CITY_ERAS[g.era].color}" font-size="${detailed ? 6.2 : 5.6}" font-weight="bold">${CITY_ERAS[g.era].act}</text></g>`).join('') +
    (detailed ? REGIONS.map((r, i) => { const [lx, ly] = [[0, 26], [-102, -164], [88, -164]][i] || [r.x, r.z]; return `<text class="map-region-label" x="${lx}" y="${ly}" text-anchor="middle" fill="${r.color}" stroke="#0b1314" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke" font-size="8.5" font-weight="bold">${['KONG STUDIOS', 'BAIRRO DOS MURAIS', 'MIRANTE DO MOINHO'][i].split(' ')[0]}</text>`; }).join('') : '') +
    DISCOVERIES.map((d, i) => `<g data-map-poi="${d.id}"><title>${d.title}</title><circle cx="${d.x}" cy="${d.z}" r="${detailed ? 5.8 : 4.8}" fill="#ffb547" stroke="#091010" stroke-width="1.6"/><path class="poi-check" d="M-2.4 .1 -.7 1.9 2.6 -1.7" transform="translate(${d.x} ${d.z})" fill="none" stroke="#0b1314" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>${detailed ? `<text x="${d.x}" y="${d.z + 2}" text-anchor="middle" fill="#111415" font-size="5.2" font-weight="bold">${i + 1}</text>` : ''}</g>`).join('') +
    MEMBER_LOCATIONS.map((m, i) => `<g data-map-member="${i}"><title>${['2-D','Murdoc','Noodle','Russel'][i]}</title><rect x="${m.x-3.2}" y="${m.z-3.2}" width="6.4" height="6.4" rx="1.2" transform="rotate(45 ${m.x} ${m.z})" fill="${memberAccents[i]}" stroke="#091010" stroke-width="1.3"/></g>`).join('') +
    `<g id="${carId}"><path class="car-cone" d="M0 0 L-13 -28 A30 30 0 0 1 13 -28 Z" fill="#e8ff9e" fill-opacity=".22"/><circle r="9.5" fill="#e8ff9e24" stroke="#e8ff9e99" stroke-width="1.1"/><path d="M0 -9.5 6.4 6.2 0 3.2 -6.4 6.2Z" fill="#e8ff9e" stroke="#091010" stroke-width="1.6" stroke-linejoin="round"/></g>`;

  map.innerHTML = buildMapSvgContent('map-car', false, minimapArt);
  const fullWorldMap = document.querySelector('#full-world-map');
  if (fullWorldMap) fullWorldMap.innerHTML = buildMapSvgContent('full-map-car', true);

  function toggleFullMap(force) {
    if (!fullMapOverlay) return;
    const open = typeof force === 'boolean' ? force : fullMapOverlay.hidden;
    if (open) onboarding.markUsed('map');
    if (open && fullMapOverlay.hidden) {
      mapCameraSnapshot = { view: getWorld()?.captureView(), camera: cameraState.save() };
      enterWorld(); stop(); toggleHudMenu(null);
    }
    fullMapOverlay.hidden = !open;
    sceneSection.classList.toggle('full-map-open', open);
    mapOpenBtn?.setAttribute('aria-expanded', String(open));
    quickMap.setAttribute('aria-expanded', String(open));
    quickMap.setAttribute('aria-pressed', String(open));
    if (open) document.querySelector('#full-map-close')?.focus({ preventScroll: true });
    else {
      if (mapCameraSnapshot) {
        cameraState.restore(mapCameraSnapshot.camera);
        getWorld()?.restoreView(mapCameraSnapshot.view);
        mapCameraSnapshot = null;
        bandToggle.setAttribute('aria-pressed', String(cameraState.showcase));
        syncCameraModes();
      }
      focusWorld();
    }
  }

  mapOpenBtn?.addEventListener('click', () => toggleFullMap());
  quickMap.addEventListener('click', () => toggleFullMap());
  document.querySelector('#full-map-close')?.addEventListener('click', () => toggleFullMap(false));
  fullMapOverlay?.addEventListener('pointerdown', event => { if (event.target === fullMapOverlay) toggleFullMap(false); });

  const fullMapDestContainer = document.querySelector('#full-map-destinations');
  if (fullMapDestContainer) {
    const makeGroup = (heading, items) => {
      const section = document.createElement('div'); section.className = 'full-map-group';
      const h = document.createElement('h3'); h.textContent = heading; section.append(h);
      for (const item of items) {
        const btn = document.createElement('button'); btn.type = 'button';
        btn.innerHTML = `<span class="dest-tag" style="--tag:${item.color}">${item.tag}</span><strong>${item.title}</strong><small>${item.sub}</small>`;
        btn.addEventListener('click', () => { toggleFullMap(false); startNavigation(item.target); });
        section.append(btn);
      }
      fullMapDestContainer.append(section);
    };
    makeGroup('Regiões Principais (3)', REGIONS.map((r, i) => ({
      tag: `R${i + 1}`, color: r.color, title: r.name, sub: `Ato ${CITY_ERAS[eraAt(r)].act} · Clique para ir`, target: { x: r.x, z: r.z, title: r.name, region: i },
    })));
    makeGroup('Histórias & Descobertas (5)', DISCOVERIES.map((d, i) => ({
      tag: `H${i + 1}`, color: '#f5a9c6', title: d.title, sub: `${d.kind} · ${REGIONS[d.region].name}`, target: d,
    })));
    makeGroup('Integrantes Phase 7 (4)', members.map((m, i) => ({
      tag: m.name[0], color: memberAccents[i], title: m.name, sub: `${m.role} · ${m.song}`, target: { ...MEMBER_LOCATIONS[i], title: m.name, region: regionAt(MEMBER_LOCATIONS[i]) },
    })));
  }

  const routeLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  for (const [key, value] of Object.entries({ fill: 'none', stroke: '#c4dc9d', 'stroke-width': '3', 'stroke-linejoin': 'round' })) routeLine.setAttribute(key, value);
  map.insertBefore(routeLine, document.querySelector('#map-car'));

  const fullRouteLine = fullWorldMap ? document.createElementNS('http://www.w3.org/2000/svg', 'polyline') : null;
  if (fullRouteLine && fullWorldMap) {
    for (const [key, value] of Object.entries({ fill: 'none', stroke: '#c4dc9d', 'stroke-width': '3.5', 'stroke-linejoin': 'round' })) fullRouteLine.setAttribute(key, value);
    fullWorldMap.insertBefore(fullRouteLine, document.querySelector('#full-map-car'));
  }

  let mapZoomed = false, smoothMapSpanW = 184, mapHeading = null;
  let lastRoute, lastRouteIndex;
  document.querySelector('#map-zoom').addEventListener('click', event => {
    mapZoomed = !mapZoomed;
    event.currentTarget.setAttribute('aria-pressed', String(mapZoomed));
    event.currentTarget.setAttribute('aria-label', mapZoomed ? 'Zoom automático do minimapa' : 'Aproximar minimapa');
    event.currentTarget.textContent = mapZoomed ? '−' : '+';
  });

  function updateCar(dt) {
    if (mapHeading === null) mapHeading = vehicle.heading;
    const diff = Math.atan2(Math.sin(vehicle.heading - mapHeading), Math.cos(vehicle.heading - mapHeading));
    mapHeading += diff * (1 - Math.exp(-dt * 12));
    const transform = `translate(${vehicle.x.toFixed(2)},${vehicle.z.toFixed(2)}) rotate(${(-mapHeading * 180 / Math.PI).toFixed(1)})`;
    document.querySelector('#map-car')?.setAttribute('transform', transform);
    document.querySelector('#full-map-car')?.setAttribute('transform', transform);
  }

  function updateHud({ region, speed, moving, destination, known }) {
    for (const svg of [map, fullWorldMap].filter(Boolean)) {
      for (const point of DISCOVERIES) {
        const marker = svg.querySelector(`[data-map-poi="${point.id}"]`);
        if (!marker) continue;
        const found = known.has(point.id);
        marker.style.opacity = svg === fullWorldMap || destination?.target === point || found ? '1' : distance(vehicle, point) < 75 ? '.9' : '.68';
        const dot = marker.querySelector('circle');
        dot.setAttribute('fill', found ? '#7fe9d0' : '#ffb547');
        dot.classList.toggle('poi-found', found);
        dot.classList.toggle('poi-pending', !found);
      }
    }
    const speedRatio = Math.min(1, Math.abs(vehicle.speed) / 22);
    const targetSpanW = mapZoomed ? 112 + speedRatio * 48 : 184 + speedRatio * 68;
    smoothMapSpanW += (targetSpanW - smoothMapSpanW) * .22;
    const spanW = Math.round(smoothMapSpanW), spanH = Math.round(spanW * (260 / 290));
    const minVX = Math.max(-145, Math.min(145 - spanW, vehicle.x - spanW / 2));
    const minVZ = Math.max(-205, Math.min(55 - spanH, vehicle.z - spanH / 2));
    map.setAttribute('viewBox', `${minVX.toFixed(1)} ${minVZ.toFixed(1)} ${spanW} ${spanH}`);
    const zoomLabel = document.querySelector('#map-zoom-label');
    if (zoomLabel) zoomLabel.textContent = mapZoomed ? 'ZOOM +' : moving ? `${speed} KM/H` : 'AUTO';
    const fullCoords = document.querySelector('#full-map-coords');
    if (fullCoords) fullCoords.textContent = `${REGIONS[region].name} · Ato ${CITY_ERAS[eraAt(vehicle)].act} · Kong FM: ${getLocalRadio().read().name}`;
    if (lastRoute !== destination || lastRouteIndex !== destination?.index) {
      const pts = destination ? [vehicle, ...destination.points.slice(destination.index)].map(p => `${p.x},${p.z}`).join(' ') : '';
      routeLine.setAttribute('points', pts);
      fullRouteLine?.setAttribute('points', pts);
      lastRoute = destination;
      lastRouteIndex = destination?.index;
    }
  }

  return {
    fullMapOverlay,
    isFullMapOpen: () => Boolean(fullMapOverlay && !fullMapOverlay.hidden),
    toggleFullMap,
    updateCar,
    updateHud,
  };
}
