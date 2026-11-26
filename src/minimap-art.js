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
  // Base limpa em gradiente escuro para máximo contraste das vias e marcadores.
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#101b1a'); base.addColorStop(1, '#091111');
  ctx.fillStyle = base; ctx.fillRect(0, 0, width, height);
  // Grade leve e espaçada (20 unidades do mundo) sem poluir a leitura.
  ctx.strokeStyle = 'rgba(196,220,157,.045)'; ctx.lineWidth = 1;
  for (let x = Math.ceil(MINIMAP_RECT.x / 20) * 20; x <= MINIMAP_RECT.x + MINIMAP_RECT.w; x += 20) { const { px } = T(x, 0); ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, height); ctx.stroke(); }
  for (let z = Math.ceil(MINIMAP_RECT.y / 20) * 20; z <= MINIMAP_RECT.y + MINIMAP_RECT.h; z += 20) { const { py } = T(0, z); ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(width, py); ctx.stroke(); }
  // Quarteirões discretos na cor da era para dar contexto espacial sem competir com as ruas.
  for (const lot of lots) {
    const { px, py } = T(lot.x, lot.z), w = lot.w * pxPerUnit, d = lot.d * pxPerUnit;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-lot.rotation);
    ctx.fillStyle = eraColor(lot); ctx.globalAlpha = .26; ctx.fillRect(-w / 2, -d / 2, w, d);
    ctx.globalAlpha = .35; ctx.strokeStyle = 'rgba(5,10,10,.7)'; ctx.lineWidth = 1; ctx.strokeRect(-w / 2, -d / 2, w, d);
    ctx.restore();
  }
  // Ruas com traçado nítido: borda escura + eixo claro de alta legibilidade.
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const road of roads) {
    const pts = road.samples.map(p => T(p.x, p.z));
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py))); };
    const glow = avenueGlow(road.width, pxPerUnit);
    path(); ctx.strokeStyle = '#070c0c'; ctx.lineWidth = road.width * pxPerUnit * .92; ctx.stroke();
    if (road.kind !== 'lane') {
      path(); ctx.strokeStyle = 'rgba(216,232,188,.34)'; ctx.lineWidth = glow.outer * .42; ctx.stroke();
      path(); ctx.strokeStyle = 'rgba(244,241,228,.92)'; ctx.lineWidth = Math.max(2, glow.inner * .48); ctx.stroke();
    } else {
      path(); ctx.strokeStyle = 'rgba(222,232,202,.55)'; ctx.lineWidth = Math.max(1.5, glow.inner * .36); ctx.stroke();
    }
  }
  // Vinheta suave nas bordas para enquadrar o mapa sem escurecer as vias periféricas.
  const vig = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * .42, width / 2, height / 2, Math.max(width, height) * .76);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.38)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, width, height);
}
