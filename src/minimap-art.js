// Arte do minimapa: fundo pré-renderizado (asfalto com grade, quarteirões sombreados, avenidas com contorno iluminado
// e vinheta). É desenhado uma vez num canvas e entra no SVG como <image>; o SVG só redesenha marcadores e o carro.
// Funções puras de medida e de desenho (ctx recebido), testadas em Node.
export const MINIMAP_RECT = { x: -140, y: -200, w: 280, h: 250 }; // mesma área do SVG do minimapa (unidades do mundo)
export const MINIMAP_PX_PER_UNIT = 2.5;                            // resolução do fundo: 700 x 625 px

export function minimapCanvasSize(pxPerUnit = MINIMAP_PX_PER_UNIT) {
  return { width: Math.round(MINIMAP_RECT.w * pxPerUnit), height: Math.round(MINIMAP_RECT.h * pxPerUnit) };
}

// Mundo -> pixel do canvas do fundo (y do canvas = z do mundo).
export function worldToArt(x, z, pxPerUnit = MINIMAP_PX_PER_UNIT) {
  return { px: (x - MINIMAP_RECT.x) * pxPerUnit, py: (z - MINIMAP_RECT.y) * pxPerUnit };
}

// Largura do brilho da avenida: proporcional à largura da rua (em unidades do mundo).
export function avenueGlow(width, pxPerUnit = MINIMAP_PX_PER_UNIT) {
  return { outer: Math.max(2, width * .9 * pxPerUnit), inner: Math.max(1, width * .42 * pxPerUnit) };
}

// Desenha o fundo no contexto 2D. lots/roads: CITY_LOTS e ROADS; eraColor: cor do bairro por lote.
export function paintMinimapArt(ctx, { lots, roads, eraColor, pxPerUnit = MINIMAP_PX_PER_UNIT }) {
  const { width, height } = minimapCanvasSize(pxPerUnit);
  const T = (x, z) => worldToArt(x, z, pxPerUnit);
  // Base: asfalto escuro com ruído leve (pontos determinísticos, sem custo por quadro).
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#16221f'); base.addColorStop(1, '#0e1716');
  ctx.fillStyle = base; ctx.fillRect(0, 0, width, height);
  let seed = 17; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  ctx.fillStyle = 'rgba(255,255,255,.035)';
  for (let i = 0; i < 900; i++) ctx.fillRect(rnd() * width, rnd() * height, 1.2, 1.2);
  // Grade urbana: linhas a cada 6 unidades do mundo.
  ctx.strokeStyle = 'rgba(196,220,157,.07)'; ctx.lineWidth = 1;
  for (let x = Math.ceil(MINIMAP_RECT.x / 6) * 6; x <= MINIMAP_RECT.x + MINIMAP_RECT.w; x += 6) { const { px } = T(x, 0); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, height); ctx.stroke(); }
  for (let z = Math.ceil(MINIMAP_RECT.y / 6) * 6; z <= MINIMAP_RECT.y + MINIMAP_RECT.h; z += 6) { const { py } = T(0, z); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(width, py); ctx.stroke(); }
  // Quarteirões: cor do bairro, sombra interna (lado de baixo mais escuro) e borda.
  for (const lot of lots) {
    const { px, py } = T(lot.x, lot.z), w = lot.w * pxPerUnit, d = lot.d * pxPerUnit;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-lot.rotation);
    ctx.fillStyle = eraColor(lot); ctx.globalAlpha = .5; ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.fillRect(-w / 2, d / 2 - Math.max(1, d * .18), w, Math.max(1, d * .18));
    ctx.globalAlpha = .6; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1; ctx.strokeRect(-w / 2, -d / 2, w, d);
    ctx.restore();
  }
  // Ruas: asfalto, depois contorno iluminado nas avenidas (maiores) e linha tracejada fina nas ruas menores.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const road of roads) {
    const pts = road.samples.map(p => T(p.x, p.z));
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py))); };
    const glow = avenueGlow(road.width, pxPerUnit);
    path(); ctx.strokeStyle = '#0a1110'; ctx.lineWidth = road.width * pxPerUnit; ctx.stroke();
    path(); ctx.strokeStyle = 'rgba(210,226,168,.22)'; ctx.lineWidth = road.width * pxPerUnit * .62; ctx.stroke();
    if (road.kind !== 'lane') { // avenida: contorno iluminado
      path(); ctx.strokeStyle = 'rgba(196,220,157,.55)'; ctx.lineWidth = glow.outer * .35; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(241,236,220,.85)'; ctx.lineWidth = glow.inner * .45; ctx.stroke();
    } else {
      path(); ctx.strokeStyle = 'rgba(241,236,220,.35)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // Vinheta e radar nas bordas (escurece o perímetro, como a tela de um radar).
  const vig = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .35, width / 2, height / 2, Math.max(width, height) * .72);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.72)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(196,220,157,.18)'; ctx.lineWidth = 1;
  for (let r = 1; r <= 3; r++) { ctx.beginPath(); ctx.arc(width / 2, height / 2, r * Math.min(width, height) / 7, 0, Math.PI * 2); ctx.stroke(); }
}
