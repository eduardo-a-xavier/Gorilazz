import { distance } from './world-data.js';

// Keep itinerary presentation separate from driving, persistence and scene rendering.
export function createJourneyGuide({ points, regions, onNavigate, onStop, onExplore }) {
  const root = document.querySelector('#journey');
  const status = root.querySelector('#journey-status');
  const title = root.querySelector('#journey-title');
  const description = root.querySelector('#journey-description');
  const meter = root.querySelector('#journey-distance');
  const action = root.querySelector('#journey-action');
  const toggle = root.querySelector('#route-toggle');
  const list = root.querySelector('#route-list');
  let current, mode;
  const write = (element, text) => { if (element.textContent !== text) element.textContent = text; };
  const buttons = points.map((point, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.addEventListener('click', () => { closeRoute(); onNavigate(point); });
    item.append(button); list.append(item);
    return { button, point, index };
  });
  function closeRoute() { list.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Ver roteiro'; }
  toggle.addEventListener('click', () => {
    list.hidden = !list.hidden;
    toggle.setAttribute('aria-expanded', String(!list.hidden));
    toggle.textContent = list.hidden ? 'Ver roteiro' : 'Fechar roteiro';
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeRoute(); toggle.focus(); }
  });
  action.addEventListener('click', () => {
    if (mode === 'travel') onStop();
    else if (mode === 'arrived') onExplore();
    else if (current) onNavigate(current);
  });
  return {
    update({ vehicle, known, destination, nearby }) {
      const unfound = points.filter(point => !known.has(point.id));
      const closestUnfound = [...unfound].sort((a, b) => distance(vehicle, a) - distance(vehicle, b))[0];
      const next = unfound[0];
      const close = nearby?.type === 'archive' ? nearby : nearby?.type === 'discovery' ? points[nearby.index] : null;
      current = destination || close || closestUnfound || next || points[0];
      mode = destination ? 'travel' : close && Math.abs(vehicle.speed) < 2 ? 'arrived' : 'ready';
      write(status, mode === 'travel' ? 'A caminho' : mode === 'arrived' ? 'Você chegou' : next ? 'Seu próximo destino' : 'Roteiro completo');
      write(title, current.title);
      write(description, mode === 'travel' ? 'O Geep segue a estrada. Use os controles para assumir a direção.' : mode === 'arrived' ? 'Pare um instante e descubra a história deste lugar.' : next ? 'Escolha uma parada. A gente leva você até lá.' : 'As cinco histórias estão no diário. Você pode revisitar qualquer parada.');
      // Alvo sem região válida (ex.: integrante no mapa) não derruba o quadro: mostra só a distância.
      const regionName = regions[current.region]?.name;
      write(meter, `${regionName ? regionName + ' · ' : ''}${Math.round(distance(vehicle, current))} m em linha reta`);
      write(action, mode === 'travel' ? 'Parar passeio' : mode === 'arrived' ? 'Explorar história' : 'Ir até lá');
      const rankedIds = [...points].sort((a, b) => distance(vehicle, a) - distance(vehicle, b)).map(p => p.id);
      for (const { button, point, index } of buttons) {
        const rank = rankedIds.indexOf(point.id) + 1;
        const dist = Math.round(distance(vehicle, point));
        write(button, `${known.has(point.id) ? '✓' : String(index + 1).padStart(2, '0')}  ${point.title} · ${ rank }º (${dist} m)`);
        const active = point.id === current.id;
        if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
      }
    },
  };
}
