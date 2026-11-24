// Central de Descobertas (drawer): busca, filtros e a lista de fichas. Monta o <dialog> no DOM e cuida só da apresentação.
// Regras de busca e status em discoveries-search.js. O texto completo só aparece depois de descoberta.
import { FILTERS, filterEntries, statusFor, isBandFiction, hintFor } from './discoveries-search.js';

export function createDiscoveriesDrawer({ lore, visited, goTo, onClose }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'discoveries-drawer'; dialog.className = 'discoveries-drawer'; dialog.setAttribute('aria-labelledby', 'discoveries-title');
  dialog.innerHTML = `
    <button type="button" class="close" aria-label="Fechar central de descobertas">×</button>
    <p class="eyebrow">CENTRAL DE DESCOBERTAS</p>
    <h2 id="discoveries-title">Universo Gorillaz</h2>
    <p class="discoveries-count" aria-live="polite"></p>
    <label class="discoveries-search"><span>Buscar por palavra-chave</span><input type="search" placeholder="Ex.: Kong Studios, Jamie Hewlett, Cyborg, Grammy" autocomplete="off"></label>
    <div class="discoveries-filters" role="group" aria-label="Filtrar fichas"></div>
    <ul class="discoveries-list"></ul>
    <p class="discoveries-empty" hidden>Nenhuma ficha com essa busca. Tente outra palavra ou clique em "Todas".</p>`;
  document.body.append(dialog);
  const input = dialog.querySelector('input'), list = dialog.querySelector('.discoveries-list'), count = dialog.querySelector('.discoveries-count');
  const empty = dialog.querySelector('.discoveries-empty'), filtersEl = dialog.querySelector('.discoveries-filters');
  let filter = 'Todas';

  for (const name of FILTERS) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = name; button.dataset.filter = name;
    button.setAttribute('aria-pressed', String(name === filter));
    button.addEventListener('click', () => { filter = name; for (const other of filtersEl.children) other.setAttribute('aria-pressed', String(other.dataset.filter === filter)); render(); });
    filtersEl.append(button);
  }
  input.addEventListener('input', render);
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => onClose?.());

  function card(entry, found) {
    const item = document.createElement('li'); item.className = `discovery-card ${found.discovered ? 'is-found' : 'is-locked'}`;
    const title = document.createElement('h3'); title.textContent = found.discovered ? entry.title : entry.title;
    const status = document.createElement('p'); status.className = 'discovery-status'; status.textContent = found.label;
    item.append(title, status);
    if (found.discovered) {
      const period = document.createElement('p'); period.className = 'discovery-period'; period.textContent = entry.period;
      const text = document.createElement('p'); text.className = 'discovery-text'; text.textContent = entry.text;
      item.append(period, text);
      if (isBandFiction(entry)) { const tag = document.createElement('span'); tag.className = 'discovery-fiction'; tag.textContent = 'Ficção da banda'; item.append(tag); }
      const source = document.createElement('p'); source.className = 'discovery-source';
      const link = document.createElement('a'); link.href = entry.source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Fonte';
      source.append('Fonte: ', link, ` · acessado em ${entry.source.accessed}`);
      item.append(source);
    } else {
      const hint = document.createElement('p'); hint.className = 'discovery-hint'; hint.textContent = hintFor(entry);
      const go = document.createElement('button'); go.type = 'button'; go.className = 'discovery-go'; go.textContent = 'Ir até lá';
      go.addEventListener('click', () => { dialog.close(); goTo(entry.stopId); });
      item.append(hint, go);
    }
    return item;
  }

  function render() {
    const visitedIds = visited();
    const results = filterEntries(lore, { query: input.value, filter });
    count.textContent = `${lore.filter(entry => visitedIds.has(entry.stopId)).length} de ${lore.length} descobertas`;
    list.replaceChildren(...results.map(entry => card(entry, statusFor(entry, visitedIds))));
    empty.hidden = results.length > 0;
  }

  return {
    get element() { return dialog; },
    open() { input.value = ''; render(); dialog.showModal(); input.focus(); },
    render,
  };
}
