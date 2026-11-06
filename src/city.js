import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { CITY_LOTS, CITY_ERAS, ERA_GATES } from './world-data.js';

// Cidade autoral e procedural, dividida em quatro bairros, um por ato da história da banda:
//   Ato 1 · A explosão (2000–2006)      → tijolo, caixas-d'água, escadas de incêndio e grafite
//   Ato 2 · O auge ambicioso (2007–2011) → Plastic Beach: fachadas pastel e lixo plástico colorido
//   Ato 3 · A briga e o hiato (2012–2016)→ prédios fechados, janelas tapadas e andaimes
//   Ato 4 · A reinvenção (2017–2026)     → torres de vidro, telões de LED e neon
// Todas as texturas são desenhadas em canvas; nenhum asset externo é necessário.
// As peças repetidas são fundidas por material para manter poucas chamadas de desenho.

const FLOOR = 3.2;
const PALETTE = {
  brick: ['#a5543f', '#b0654a', '#8f4a3c', '#b8744f', '#80483d'],
  plaster: ['#e8dcc0', '#c9d4b0', '#e2b4aa', '#b9cad3', '#e4c47e'],
  concrete: ['#aeb0a9', '#939c97', '#bab4a6', '#9ea7ab', '#c4bdaf'],
  pastel: ['#f7b7cc', '#8fd8cf', '#ffd77a', '#b0c9ff', '#f2ece0'],
  abandoned: ['#8a8780', '#7b766d', '#938a7c', '#6f716c', '#857d73'],
  glass: ['#2c4a5a', '#24404f', '#35505e', '#2a3d52', '#3a4f5a'],
};
const ERA_AWNINGS = [
  ['#d9475f', '#2f7f7a', '#e0a43a', '#3d5a9c'],
  ['#ff7eb0', '#38c2b5', '#ffcc4d', '#6aa2ff'],
  ['#6b6a64', '#5d6660', '#7a6e62', '#585d63'],
  ['#f2559c', '#3fd0ff', '#9b6bff', '#1f2a33'],
];
const ERA_SHOPS = [
  ['DISCOS', 'FITAS K7', 'LOCADORA', 'FLIPERAMA', 'BAR', 'PADARIA'],
  ['PEIXARIA', 'SURF', 'SORVETES', 'RECICLA', 'BAR DA PRAIA', 'ILHA FM'],
  ['FECHADO', 'ALUGA-SE', 'EM PAUSA', 'VENDE-SE', 'SEM SINAL', 'FECHADO'],
  ['STREAMING', 'VINIL', 'GAMES', 'REALIDADE AR', 'FONES', 'CAFÉ 24H'],
];
// Datas e marcos do documento de história da banda.
const ERA_ADS = [
  ['TOMORROW COMES TODAY|EP · 27/11/2000', 'GORILLAZ|26/03/2001 · CLINT EASTWOOD', 'DEMON DAYS|11/05/2005 · FEEL GOOD INC.', 'GRAMMY 2006|FEEL GOOD INC. · HOLOGRAMAS AO VIVO'],
  ['PLASTIC BEACH|03/03/2010 · UMA ILHA DE PLÁSTICO', 'ESCAPE TO PLASTIC BEACH|TURNÊ 2010 · COACHELLA · GLASTONBURY', 'THE FALL|GRAVADO NUM IPAD · 25/12/2010', 'MONKEY|JOURNEY TO THE WEST · ÓPERA 2007'],
  ['DOYATHING|2012 · O ÚLTIMO ANTES DA PAUSA', 'EM PAUSA|2012 — 2016', 'QUER FAZER MAIS UM?|2014 · A RECONCILIAÇÃO', 'FECHADO PARA REFORMA|VOLTAMOS LOGO'],
  ['HUMANZ|28/04/2017 · SATURNZ BARZ EM 360°', 'THE NOW NOW|29/06/2018 · BRIT AWARD', 'SONG MACHINE|TEMPORADA 1 · 2020', 'CRACKER ISLAND|24/02/2023 · Nº1 NO REINO UNIDO', 'THE MOUNTAIN|27/02/2026 · KONG · Nº1'],
];
const NEON = ['#ff5fa2', '#6fe3ff', '#ffd166', '#9dff8a', '#ff8a5c', '#c69bff'];
const PLASTIC = ['#ff5f8f', '#38c2b5', '#ffcc4d', '#6aa2ff', '#f4efe2', '#9dff8a'];

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
function canvas(width, height = width) { const c = document.createElement('canvas'); c.width = width; c.height = height; return [c, c.getContext('2d')]; }
function shade(hex, amount) { return '#' + new THREE.Color(hex).offsetHSL(0, 0, amount).getHexString(); }
function texture(c, { repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const atlasUV = (row, rows) => [0, 1 - (row + 1) / rows, 1, 1 - row / rows];

// ---------------------------------------------------------------- fachadas
// Cada textura cobre 4 vãos x 4 andares. O mapa de emissão (janelas acesas) é
// compartilhado por estilo, então todas as cores de um estilo usam o mesmo padrão.
const SIZE = 512, CELL = SIZE / 4;
const LIT = { brick: .34, plaster: .34, concrete: .4, pastel: .3, abandoned: 0, glass: .48 };
const GLOWS = {
  default: ['#ffd58a', '#ffd58a', '#ffc070', '#ffb1c8', '#a8e3ff'],
  pastel: ['#fff0b8', '#a8f0e8', '#ffd0e0'],
  glass: ['#e4f6ff', '#e4f6ff', '#ff9ccc', '#7fe6ff', '#c9b2ff'],
};
function windowLayout(style) {
  const rng = seeded(style.length * 977 + style.charCodeAt(0));
  return Array.from({ length: 16 }, () => ({ lit: rng() < LIT[style], glow: pick(rng, GLOWS[style] || GLOWS.default),
    curtain: rng(), blinds: rng() < .2, boarded: rng() < .55, broken: rng() < .3 }));
}
function windowRect(style) {
  if (style === 'glass') return { x: 0, y: 0, w: CELL, h: CELL - 22 };
  if (style === 'concrete') return { x: 8, y: 22, w: CELL - 16, h: 72 };
  return { x: 28, y: 20, w: CELL - 56, h: 80 };
}
function drawWall(ctx, style, color, rng) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, SIZE, SIZE);
  if (style === 'brick') {
    const bh = 9, bw = 24;
    for (let row = 0; row * bh < SIZE; row++) for (let col = -1; col * bw < SIZE; col++) {
      ctx.fillStyle = shade(color, (rng() - .5) * .09); ctx.fillRect(col * bw + (row % 2) * bw / 2, row * bh, bw - 2, bh - 2);
    }
    ctx.fillStyle = 'rgba(214,202,184,.35)';
    for (let row = 0; row * bh < SIZE; row++) ctx.fillRect(0, row * bh + bh - 2, SIZE, 2);
  } else if (style === 'pastel') {
    // Tábuas horizontais de casa de praia.
    for (let y = 0; y < SIZE; y += 16) { ctx.fillStyle = shade(color, (rng() - .5) * .04); ctx.fillRect(0, y, SIZE, 14); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, y + 14, SIZE, 2); }
  } else if (style === 'glass') {
    for (let f = 0; f < 4; f++) for (let b = 0; b < 4; b++) {
      const g = ctx.createLinearGradient(b * CELL, f * CELL, b * CELL + CELL, f * CELL + CELL);
      g.addColorStop(0, shade(color, .12)); g.addColorStop(.5, color); g.addColorStop(1, shade(color, -.06));
      ctx.fillStyle = g; ctx.fillRect(b * CELL, f * CELL, CELL, CELL);
    }
    ctx.fillStyle = '#151d22'; for (let f = 0; f < 4; f++) ctx.fillRect(0, f * CELL + CELL - 22, SIZE, 22);
  } else {
    for (let i = 0; i < 2600; i++) { ctx.fillStyle = rng() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.05)'; ctx.fillRect(rng() * SIZE, rng() * SIZE, 2 + rng() * 5, 2 + rng() * 5); }
    if (style !== 'plaster') {
      ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let f = 0; f < 4; f++) ctx.fillRect(0, f * CELL + CELL - 10, SIZE, 10);
      ctx.fillStyle = 'rgba(0,0,0,.07)'; for (let b = 0; b < 4; b++) ctx.fillRect(b * CELL, 0, 2, SIZE);
    }
    if (style === 'abandoned') {
      // Rachaduras, infiltração e pichações apagadas.
      ctx.strokeStyle = 'rgba(30,28,25,.45)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { ctx.beginPath(); let x = rng() * SIZE, y = rng() * SIZE; ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rng() - .5) * 40; y += rng() * 30; ctx.lineTo(x, y); } ctx.stroke(); }
      for (let i = 0; i < 6; i++) { const g = ctx.createRadialGradient(rng() * SIZE, rng() * SIZE, 0, rng() * SIZE, rng() * SIZE, 120); g.addColorStop(0, 'rgba(60,70,50,.25)'); g.addColorStop(1, 'rgba(60,70,50,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SIZE, SIZE); }
    }
  }
  if (style !== 'glass') for (let b = 0; b < 4; b++) for (let f = 0; f < 4; f++) {
    const r = windowRect(style); const x = b * CELL + r.x, y = f * CELL + r.y + r.h + 6;
    const g = ctx.createLinearGradient(0, y, 0, y + 30 + rng() * 22); g.addColorStop(0, `rgba(30,25,20,${style === 'abandoned' ? .3 : .16})`); g.addColorStop(1, 'rgba(30,25,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x + 4, y, r.w - 8, 52);
  }
}
const facadeCache = new Map();
function facadeMaterial(style, tint) {
  tint %= 3; // três tons por estilo: variedade suficiente com poucas chamadas de desenho
  const key = `${style}/${tint}`; if (facadeCache.has(key)) return facadeCache.get(key);
  const layout = windowLayout(style); const rng = seeded(tint * 131 + style.length);
  const [c, ctx] = canvas(SIZE); drawWall(ctx, style, PALETTE[style][tint], rng);
  const glows = style !== 'abandoned'; let emissive = facadeCache.get(`${style}/emissive`);
  const [ec, ectx] = emissive || !glows ? [] : canvas(SIZE);
  if (ectx) { ectx.fillStyle = '#000'; ectx.fillRect(0, 0, SIZE, SIZE); }
  const frame = { concrete: '#3c4346', brick: '#efe7d4', glass: '#9fb4bd', pastel: '#ffffff', abandoned: '#5a554c' }[style] || '#f4efe2';
  layout.forEach((win, i) => {
    const r = windowRect(style); const x = (i % 4) * CELL + r.x, y = Math.floor(i / 4) * CELL + r.y;
    if (style === 'glass') {
      if (win.lit) {
        // Escritório aceso: luz do teto e silhuetas de mesas, sem pintar o vidro inteiro.
        const g = ctx.createLinearGradient(0, y, 0, y + r.h); g.addColorStop(0, win.glow); g.addColorStop(.35, 'rgba(255,255,255,0)');
        ctx.globalAlpha = .55; ctx.fillStyle = g; ctx.fillRect(x + 3, y + 3, r.w - 6, r.h - 6); ctx.globalAlpha = 1;
        ctx.fillStyle = win.glow; ctx.fillRect(x + 8, y + 8, r.w - 16, 4);
        ctx.fillStyle = 'rgba(10,15,20,.55)'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 12 + k * 38, y + r.h - 34, 26, 16);
        if (ectx) { ectx.fillStyle = win.glow; ectx.fillRect(x + 8, y + 8, r.w - 16, 4); ectx.globalAlpha = .35; ectx.fillRect(x + 3, y + 12, r.w - 6, r.h * .35); ectx.globalAlpha = 1; }
      }
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x, y + r.h); ctx.lineTo(x + r.w * .6, y); ctx.lineTo(x + r.w * .85, y); ctx.lineTo(x + r.w * .2, y + r.h); ctx.fill();
      ctx.fillStyle = frame; ctx.fillRect(x, y, 3, r.h); ctx.fillRect(x + r.w / 2 - 1, y, 2, r.h);
      return;
    }
    if (style === 'brick') { ctx.fillStyle = '#d8ccb4'; ctx.fillRect(x - 6, y - 10, r.w + 12, 9); }
    ctx.fillStyle = frame; ctx.fillRect(x - 4, y - 4, r.w + 8, r.h + 8);
    const glass = ctx.createLinearGradient(0, y, 0, y + r.h); glass.addColorStop(0, '#22303a'); glass.addColorStop(1, '#4a6470');
    ctx.fillStyle = glass; ctx.fillRect(x, y, r.w, r.h);
    if (style === 'abandoned') {
      ctx.fillStyle = '#121416'; ctx.fillRect(x, y, r.w, r.h);
      if (win.boarded) { for (let k = 0; k < 5; k++) { ctx.fillStyle = shade('#8b6a45', (k % 2 ? -.05 : .03)); ctx.fillRect(x - 2, y + 4 + k * 16, r.w + 4, 13); } ctx.save(); ctx.translate(x + r.w / 2, y + r.h / 2); ctx.rotate(.6); ctx.fillStyle = '#6e5235'; ctx.fillRect(-r.w * .7, -6, r.w * 1.4, 12); ctx.restore(); }
      else if (win.broken) { ctx.fillStyle = 'rgba(160,180,185,.5)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r.w * .7, y); ctx.lineTo(x + r.w * .3, y + r.h * .4); ctx.lineTo(x + r.w * .5, y + r.h * .7); ctx.lineTo(x, y + r.h * .55); ctx.fill(); }
      ctx.fillStyle = '#6b665c'; ctx.fillRect(x - 8, y + r.h + 3, r.w + 16, 7);
      return;
    }
    if (win.lit) {
      ctx.fillStyle = win.glow; ctx.fillRect(x, y, r.w, r.h);
      if (ectx) { ectx.fillStyle = win.glow; ectx.fillRect(x, y, r.w, r.h); }
      ctx.fillStyle = 'rgba(120,70,50,.35)'; const cw = r.w * (.15 + win.curtain * .25);
      ctx.fillRect(x, y, cw, r.h); ctx.fillRect(x + r.w - cw * .6, y, cw * .6, r.h);
      if (ectx) { ectx.fillStyle = 'rgba(0,0,0,.55)'; ectx.fillRect(x, y, cw, r.h); ectx.fillRect(x + r.w - cw * .6, y, cw * .6, r.h); }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.beginPath(); ctx.moveTo(x, y + r.h * .7); ctx.lineTo(x + r.w * .55, y); ctx.lineTo(x + r.w * .8, y); ctx.lineTo(x, y + r.h); ctx.fill();
    }
    if (win.blinds) { ctx.fillStyle = 'rgba(230,220,200,.55)'; for (let k = 0; k < r.h * .5; k += 6) ctx.fillRect(x, y + k, r.w, 3); if (ectx) { ectx.fillStyle = '#000'; for (let k = 0; k < r.h * .5; k += 6) ectx.fillRect(x, y + k, r.w, 3); } }
    ctx.fillStyle = frame; ctx.fillRect(x + r.w / 2 - 2, y, 4, r.h); ctx.fillRect(x, y + r.h * .38, r.w, 4);
    if (style === 'concrete') for (let k = 1; k < 3; k++) ctx.fillRect(x + r.w * k / 3 - 2, y, 4, r.h);
    if (style === 'pastel') { ctx.fillStyle = shade(PALETTE.pastel[(i + tint + 1) % 5], -.15); ctx.fillRect(x - 16, y - 4, 10, r.h + 8); ctx.fillRect(x + r.w + 6, y - 4, 10, r.h + 8); }
    ctx.fillStyle = style === 'concrete' ? '#6b7376' : '#d9d0bb'; ctx.fillRect(x - 8, y + r.h + 3, r.w + 16, 7);
  });
  if (ectx && !emissive) { emissive = texture(ec); facadeCache.set(`${style}/emissive`, emissive); }
  const material = new THREE.MeshStandardMaterial({ map: texture(c), roughness: style === 'glass' ? .25 : .9, metalness: style === 'glass' ? .35 : 0 });
  if (glows) Object.assign(material, { emissiveMap: emissive, emissive: new THREE.Color('#ffffff'), emissiveIntensity: style === 'glass' ? .9 : .7 });
  facadeCache.set(key, material); return material;
}

// ---------------------------------------------------------------- atlas de letreiros
function storefrontMaterial() {
  const [c, ctx] = canvas(256, 128), [ec, ectx] = canvas(256, 128);
  const g = ctx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#ffcf8a'); g.addColorStop(1, '#e88f5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 128); ectx.fillStyle = '#d98a4e'; ectx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(70,40,30,.45)'; for (let i = 0; i < 9; i++) ctx.fillRect(14 + i * 26, 70 + (i % 3) * 8, 16, 58 - (i % 3) * 8);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(0, 90); ctx.lineTo(120, 0); ctx.lineTo(160, 0); ctx.lineTo(0, 128); ctx.fill();
  for (const context of [ctx, ectx]) { context.fillStyle = '#20262a'; context.fillRect(0, 0, 256, 6); context.fillRect(0, 122, 256, 6); for (const x of [0, 84, 168, 250]) context.fillRect(x, 0, 6, 128); context.fillRect(100, 10, 52, 118); }
  ctx.fillStyle = '#5a3a2a'; ctx.fillRect(104, 14, 44, 114);
  return new THREE.MeshStandardMaterial({ map: texture(c, { repeat: false }), emissiveMap: texture(ec, { repeat: false }), emissive: '#ffffff', emissiveIntensity: .8, roughness: .35, metalness: .1 });
}
function shutterMaterial() {
  // Porta de enrolar fechada, com pichação: o comércio do hiato.
  const [c, ctx] = canvas(256, 128); const rng = seeded(1212);
  ctx.fillStyle = '#7d817f'; ctx.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 128; y += 6) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, y, 256, 2); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, y + 2, 256, 1); }
  for (let i = 0; i < 5; i++) { const g = ctx.createRadialGradient(rng() * 256, rng() * 128, 0, rng() * 256, rng() * 128, 50); g.addColorStop(0, 'rgba(120,60,30,.35)'); g.addColorStop(1, 'rgba(120,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 128); }
  ctx.font = 'bold 34px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(30,30,30,.7)'; ctx.save(); ctx.translate(128, 76); ctx.rotate(-.08); ctx.fillText('FECHADO', 0, 0); ctx.restore();
  return new THREE.MeshStandardMaterial({ map: texture(c, { repeat: false }), roughness: .5, metalness: .45 });
}
const SHOP_ROWS = ERA_SHOPS.flat();
function signTexture() {
  const [c, ctx] = canvas(512, 64 * SHOP_ROWS.length);
  SHOP_ROWS.forEach((name, i) => {
    const y = i * 64, era = Math.floor(i / 6), neon = era === 2 ? '#c9c2b4' : NEON[i % NEON.length];
    ctx.fillStyle = era === 2 ? '#3a3a37' : era === 1 ? '#f4efe2' : '#1b1f24'; ctx.fillRect(0, y, 512, 64);
    ctx.strokeStyle = era === 1 ? PLASTIC[i % PLASTIC.length] : neon; ctx.lineWidth = 3; ctx.strokeRect(6, y + 6, 500, 52);
    ctx.font = 'bold 40px "Arial Black", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (era !== 2) { ctx.shadowColor = neon; ctx.shadowBlur = era === 1 ? 0 : 14; }
    ctx.fillStyle = era === 1 ? shade(PLASTIC[i % PLASTIC.length], -.25) : neon; ctx.fillText(name, 256, y + 34, 470); ctx.shadowBlur = 0;
  });
  return texture(c, { repeat: false });
}
const AD_ROWS = ERA_ADS.flat(), AD_H = 192;
function adTexture() {
  const [c, ctx] = canvas(1024, AD_H * AD_ROWS.length); const rng = seeded(31);
  let row = 0;
  ERA_ADS.forEach((ads, era) => ads.forEach((text, k) => {
    const y = row++ * AD_H, [title, line] = text.split('|');
    const bg = [['#1d2a33', '#2a1d2e', '#14303a', '#3a1d1d'], ['#38c2b5', '#ff7eb0', '#f4efe2', '#ffcc4d'], ['#55554f', '#4a4c48', '#5c5650', '#45474a'], ['#0d0f1a', '#1a0d1f', '#081a1f', '#1f0d14', '#141006']][era][k];
    const accent = [NEON[k], '#1d2a33', '#a8a296', NEON[(k + 1) % NEON.length]][era];
    ctx.fillStyle = bg; ctx.fillRect(0, y, 1024, AD_H);
    ctx.fillStyle = accent; ctx.fillRect(0, y + AD_H - 44, 1024, 44);
    ctx.textAlign = 'center'; ctx.fillStyle = era === 1 ? '#1d2a33' : era === 2 ? '#d7d0c2' : '#f4efe2';
    if (era === 3) { ctx.shadowColor = NEON[(k + 1) % NEON.length]; ctx.shadowBlur = 20; }
    ctx.font = 'bold 92px "Arial Black", Arial, sans-serif'; ctx.fillText(title, 512, y + 108, 960); ctx.shadowBlur = 0;
    ctx.font = 'bold 28px monospace'; ctx.fillStyle = era === 2 ? '#2a2a28' : '#111'; ctx.fillText(line, 512, y + AD_H - 13, 960);
    if (era === 2) {
      // Cartaz rasgado e desbotado.
      for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(120,115,105,.85)'; ctx.beginPath(); const x = rng() * 1024, yy = y + rng() * AD_H; ctx.moveTo(x, yy); for (let p = 0; p < 6; p++) ctx.lineTo(x + (rng() - .3) * 120, yy + (rng() - .5) * 90); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,190,170,.18)'; ctx.fillRect(0, y, 1024, AD_H);
    }
  }));
  return texture(c, { repeat: false });
}
function gateTexture() {
  const [c, ctx] = canvas(1024, 256 * CITY_ERAS.length);
  CITY_ERAS.forEach((era, i) => {
    const y = i * 256; ctx.fillStyle = '#161a1e'; ctx.fillRect(0, y, 1024, 256);
    ctx.fillStyle = era.color; ctx.fillRect(0, y, 1024, 18); ctx.fillRect(0, y + 238, 1024, 18); ctx.fillRect(0, y, 150, 256);
    ctx.fillStyle = '#161a1e'; ctx.textAlign = 'center'; ctx.font = 'bold 40px monospace'; ctx.fillText('ATO', 75, y + 110); ctx.font = 'bold 96px "Arial Black", Arial, sans-serif'; ctx.fillText(String(era.act), 75, y + 205);
    ctx.textAlign = 'left'; ctx.fillStyle = '#f4efe2'; ctx.font = 'bold 76px "Arial Black", Arial, sans-serif'; ctx.fillText(era.title.toUpperCase(), 185, y + 110, 810);
    ctx.fillStyle = era.color; ctx.font = 'bold 38px monospace'; ctx.fillText(era.years, 185, y + 160);
    ctx.fillStyle = '#c9c2b4'; ctx.font = '26px monospace'; ctx.fillText(era.albums, 185, y + 205, 810);
  });
  return texture(c, { repeat: false });
}
function muralAtlas() {
  // Quatro murais abstratos autorais (2 x 2): ondas sonoras, sol, olho e estrelas.
  const [c, ctx] = canvas(1024); const rng = seeded(4242);
  const tiles = [['#f2559c', '#ffd166', '#2f7f7a'], ['#3d5a9c', '#ff8a5c', '#f4efe2'], ['#2a2f45', '#6fe3ff', '#f2559c'], ['#e0a43a', '#1f3a3a', '#d9475f']];
  tiles.forEach(([bg, a, b], i) => {
    const ox = (i % 2) * 512, oy = Math.floor(i / 2) * 512; ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, 512, 512); ctx.clip();
    ctx.fillStyle = bg; ctx.fillRect(ox, oy, 512, 512); ctx.lineWidth = 10; ctx.strokeStyle = '#111';
    if (i === 0) for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? a : b; ctx.beginPath(); for (let x = 0; x <= 512; x += 16) ctx.lineTo(ox + x, oy + 80 + k * 60 + Math.sin(x / 40 + k) * 30); ctx.lineTo(ox + 512, oy + 512); ctx.lineTo(ox, oy + 512); ctx.fill(); ctx.stroke(); }
    if (i === 1) { ctx.fillStyle = a; ctx.beginPath(); ctx.arc(ox + 256, oy + 300, 170, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = b; for (let k = 0; k < 6; k++) ctx.fillRect(ox, oy + 330 + k * 30, 512, 12); ctx.fillStyle = '#111'; ctx.fillRect(ox, oy + 470, 512, 42); }
    if (i === 2) { ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(ox + 256, oy + 256, 220, 120, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = a; ctx.beginPath(); ctx.arc(ox + 256, oy + 256, 90, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ox + 256, oy + 256, 40, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox + 236, oy + 236, 14, 0, Math.PI * 2); ctx.fill(); }
    if (i === 3) for (let k = 0; k < 14; k++) { const x = ox + rng() * 512, y = oy + rng() * 512, r = 20 + rng() * 60; ctx.fillStyle = k % 2 ? a : b; ctx.beginPath(); for (let p = 0; p < 10; p++) { const ang = p * Math.PI / 5, rr = p % 2 ? r * .45 : r; ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (let k = 0; k < 120; k++) { ctx.fillStyle = `rgba(${rng() < .5 ? '255,255,255' : '0,0,0'},.25)`; ctx.beginPath(); ctx.arc(ox + rng() * 512, oy + rng() * 512, rng() * 3, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
  return new THREE.MeshStandardMaterial({ map: texture(c, { repeat: false }), roughness: .95 });
}
function stripeMaterial(color) {
  const [c, ctx] = canvas(64); ctx.fillStyle = color; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 0, 16, 64); ctx.fillRect(32, 0, 16, 64);
  return new THREE.MeshStandardMaterial({ map: texture(c), roughness: .85, side: THREE.DoubleSide });
}
function pavingMaterial(color) {
  const [c, ctx] = canvas(256); ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256); const rng = seeded(77);
  for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) { ctx.fillStyle = shade(color, (rng() - .5) * .06); ctx.fillRect(x + 2, y + 2, 60, 60); }
  for (let i = 0; i < 900; i++) { ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(rng() * 256, rng() * 256, 2, 2); }
  return new THREE.MeshStandardMaterial({ map: texture(c), roughness: .95 });
}

// ---------------------------------------------------------------- construção
export function installCity(scene, surfaces) {
  const signs = signTexture(), ads = adTexture();
  const glowing = (color, intensity) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });
  const mat = {
    trim: new THREE.MeshStandardMaterial({ color: '#d6cdb8', roughness: .85 }),
    trimDark: new THREE.MeshStandardMaterial({ color: '#2a3036', roughness: .5, metalness: .4 }),
    stone: new THREE.MeshStandardMaterial({ color: '#5c5f5b', roughness: .95 }),
    roof: new THREE.MeshStandardMaterial({ color: '#4b4f4c', roughness: .98 }),
    metal: new THREE.MeshStandardMaterial({ color: '#2f3437', roughness: .55, metalness: .6 }),
    rust: new THREE.MeshStandardMaterial({ color: '#6a4632', roughness: .9, metalness: .3 }),
    steel: new THREE.MeshStandardMaterial({ color: '#9aa3a6', roughness: .45, metalness: .5 }),
    door: new THREE.MeshStandardMaterial({ color: '#4a2f24', roughness: .8 }),
    plank: new THREE.MeshStandardMaterial({ color: '#8b6a45', roughness: 1 }),
    glow: glowing('#ffd98a', 1.8), dead: new THREE.MeshStandardMaterial({ color: '#3a3d3c', roughness: .6 }),
    red: glowing('#ff2a2a', 2), neonPink: glowing('#ff4fa0', 2.4), neonCyan: glowing('#3fe0ff', 2.4),
    wood: surfaces.get('wood', 2, 1), murals: muralAtlas(), storefront: storefrontMaterial(), shutter: shutterMaterial(),
    signs: new THREE.MeshStandardMaterial({ map: signs, emissiveMap: signs, emissive: '#ffffff', emissiveIntensity: 1.1, roughness: .6 }),
    signsFlat: new THREE.MeshStandardMaterial({ map: signs, roughness: .8 }),
    billboard: new THREE.MeshStandardMaterial({ map: ads, emissiveMap: ads, emissive: '#ffffff', emissiveIntensity: .35, roughness: .7 }),
    billboardFaded: new THREE.MeshStandardMaterial({ map: ads, roughness: .95 }),
    screen: new THREE.MeshStandardMaterial({ map: ads, emissiveMap: ads, emissive: '#ffffff', emissiveIntensity: 1.4, roughness: .3 }),
    gate: (() => { const t = gateTexture(); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: .45, roughness: .6, side: THREE.DoubleSide }); })(),
  };
  const paving = ['#a8a397', '#d9c9a3', '#8f8c85', '#7e8790'].map(pavingMaterial);
  const awnings = ERA_AWNINGS.map(colors => colors.map(stripeMaterial));
  const plastic = PLASTIC.map(color => new THREE.MeshStandardMaterial({ color, roughness: .45 }));
  const batches = new Map(), skyline = new Map();
  const put = (target, material, geometry) => { if (!target.has(material)) target.set(material, []); target.get(material).push(geometry); };
  const local = new THREE.Matrix4(), euler = new THREE.Euler(), quat = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
  const frame = (x, y, z, rotation) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotation), one);

  function place(base, geometry, position, rotation) {
    euler.set(...(rotation || [0, 0, 0])); quat.setFromEuler(euler);
    local.compose(new THREE.Vector3(...position), quat, one);
    return geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(base, local));
  }
  const box = (base, material, size, position, rotation, target = batches) => put(target, material, place(base, new THREE.BoxGeometry(...size), position, rotation));
  const cyl = (base, material, top, bottom, height, position, sides = 12, target = batches, rotation) => put(target, material, place(base, new THREE.CylinderGeometry(top, bottom, height, sides), position, rotation));
  function plane(base, material, width, height, position, rotation, uv) {
    const g = new THREE.PlaneGeometry(width, height);
    if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, uv[0] + a.getX(i) * (uv[2] - uv[0]), uv[1] + a.getY(i) * (uv[3] - uv[1])); }
    put(batches, material, place(base, g, position, rotation));
  }
  // Paredes com UV por vão e andar: as janelas nunca são cortadas nas quinas.
  function walls(base, material, w, d, floors, rng, target = batches) {
    const h = floors * FLOOR, positions = [], normals = [], uvs = [], index = [];
    const u0 = Math.floor(rng() * 4) / 4, v0 = Math.floor(rng() * 4) / 4;
    const faces = [
      [[-w / 2, d / 2], [w / 2, d / 2], [0, 1], w], [[w / 2, d / 2], [w / 2, -d / 2], [1, 0], d],
      [[w / 2, -d / 2], [-w / 2, -d / 2], [0, -1], w], [[-w / 2, -d / 2], [-w / 2, d / 2], [-1, 0], d],
    ];
    for (const [[ax, az], [bx, bz], [nx, nz], width] of faces) {
      const n = positions.length / 3, bays = Math.max(1, Math.round(width / 3.3)) / 4, rise = floors / 4;
      positions.push(ax, 0, az, bx, 0, bz, bx, h, bz, ax, h, az);
      for (let k = 0; k < 4; k++) normals.push(nx, 0, nz);
      uvs.push(u0, v0, u0 + bays, v0, u0 + bays, v0 + rise, u0, v0 + rise);
      index.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(index);
    put(target, material, g.applyMatrix4(base));
  }
  const adIndex = (era, rng) => ERA_ADS.slice(0, era).reduce((n, list) => n + list.length, 0) + Math.floor(rng() * ERA_ADS[era].length);
  function junkPile(base, rng, cx, y, cz, spread, count) {
    for (let k = 0; k < count; k++) {
      const x = cx + (rng() - .5) * spread, z = cz + (rng() - .5) * spread, kind = rng();
      if (kind < .45) box(base, pick(rng, plastic), [.4 + rng() * .7, .3 + rng() * .5, .4 + rng() * .7], [x, y + .3, z], [0, rng() * 3, rng() * .4]);
      else if (kind < .75) cyl(base, pick(rng, plastic), .3, .3, .8, [x, y + .4, z], 10, batches, rng() < .4 ? [Math.PI / 2, rng() * 3, 0] : null);
      else put(batches, pick(rng, plastic), place(base, new THREE.TorusGeometry(.42, .13, 6, 14), [x, y + .14, z], [Math.PI / 2, 0, 0]));
    }
  }

  function building(lot) {
    const rng = seeded(lot.seed); const { w, d, floors, style, era } = lot; const h = floors * FLOOR;
    const base = frame(lot.x, -.3, lot.z, lot.rotation);
    const dark = era === 2, modern = era === 3;
    // Calçada com meio-fio: cimento, areia (Plastic Beach), asfalto gasto ou granito.
    const pave = new THREE.BoxGeometry(w + 2.2, .3, d + 4.6); const uv = pave.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w + 2.2) / 4, uv.getY(i) * (d + 4.6) / 4);
    put(batches, paving[era], place(base, pave, [0, .2, 1.3]));
    box(base, mat.stone, [w + .3, .25, .3], [0, .22, d / 2 + 3.6]);
    // Corpo, embasamento, frisos e platibanda.
    walls(base, facadeMaterial(style, lot.tint), w, d, floors, rng);
    const trim = modern ? mat.trimDark : mat.trim;
    box(base, modern ? mat.trimDark : mat.stone, [w + .24, .9, d + .24], [0, .45, 0]);
    if (style !== 'glass') box(base, trim, [w + .3, .28, d + .3], [0, FLOOR, 0]);
    box(base, trim, [w + .7, .35, d + .7], [0, h - .05, 0]);
    box(base, mat.roof, [w - .1, .2, d - .1], [0, h + .05, 0]);
    for (const s of [-1, 1]) { box(base, trim, [w + .3, .8, .3], [0, h + .4, s * d / 2]); box(base, trim, [.3, .8, d + .3], [s * w / 2, h + .4, 0]); }
    // Térreo por época: loja iluminada, porta de enrolar fechada ou entrada simples.
    if (lot.shop) {
      const row = era * 6 + Math.floor(rng() * 6);
      box(base, dark ? mat.shutter : mat.storefront, [w * .86, 2.3, .3], [0, 1.6, d / 2 + .05]);
      box(base, mat.metal, [w * .94, .8, .4], [0, 3.15, d / 2 + .12]);
      plane(base, dark || era === 1 ? mat.signsFlat : mat.signs, w * .78, .62, [0, 3.15, d / 2 + .33], dark ? [0, 0, (rng() - .5) * .12] : null, atlasUV(row, SHOP_ROWS.length));
      if (!dark) {
        box(base, pick(rng, awnings[era]), [w * .88, .08, 1.7], [0, 2.75, d / 2 + .95], [.3, 0, 0]);
        for (const s of [-1, 1]) box(base, mat.metal, [.06, .06, 1.6], [s * w * .43, 2.75, d / 2 + .9], [.3, 0, 0]);
      }
    } else {
      const x = (rng() - .5) * (w - 3);
      box(base, dark ? mat.plank : modern ? mat.trimDark : mat.door, [1.3, 2.4, .25], [x, 1.5, d / 2 + .02]);
      if (dark) for (const k of [-.5, .5]) box(base, mat.plank, [1.7, .22, .08], [x, 1.5 + k, d / 2 + .18], [0, 0, k * .5]);
      box(base, trim, [1.8, .25, .3], [x, 2.8, d / 2 + .08]);
      box(base, mat.stone, [2, .3, .9], [x, .35, d / 2 + .4]);
      box(base, dark ? mat.dead : modern ? mat.neonCyan : mat.glow, [.3, .3, .3], [x + 1.1, 2.6, d / 2 + .2]);
    }
    // Escada de incêndio (Ato 1) ou enferrujada (Ato 3).
    if (lot.escape && floors >= 3) {
      const x = w / 2 + .6, len = Math.min(d * .7, 4.2), m = dark ? mat.rust : mat.metal;
      for (let f = 1; f < floors; f++) {
        const y = f * FLOOR + .05;
        box(base, m, [1.1, .08, len], [x, y, 0]);
        box(base, m, [.06, .06, len], [x + .52, y + 1, 0]);
        for (const z of [-len / 2, 0, len / 2]) box(base, m, [.05, 1, .05], [x + .52, y + .5, z]);
        if (f < floors - 1) { const dir = f % 2 ? 1 : -1, run = len * .62; box(base, dark ? m : mat.steel, [.5, .04, Math.hypot(FLOOR, run) * .92], [x - .15, y + FLOOR / 2, 0], [dir * Math.atan2(FLOOR, run), 0, 0]); }
      }
    }
    // Mural na empena lateral: grafite no Ato 1, arte de rua contemporânea no Ato 4.
    if (lot.mural && floors >= 2) {
      const tile = era === 3 ? 2 + Math.floor(rng() * 2) : Math.floor(rng() * 4), u = (tile % 2) / 2, v = tile < 2 ? .5 : 0;
      const mh = Math.min(h - 1.8, d * 1.1);
      plane(base, mat.murals, d * .82, mh, [-w / 2 - .04, 1.4 + mh / 2, 0], [0, -Math.PI / 2, 0], [u, v, u + .5, v + .5]);
    }
    // Andaimes de obra parada (Ato 3).
    if (lot.scaffold && floors >= 2) {
      const z = d / 2 + 1.1, cols = Math.max(2, Math.round(w / 2.6));
      for (let k = 0; k <= cols; k++) box(base, mat.steel, [.09, h + .6, .09], [-w / 2 + k * w / cols, h / 2 + .3, z]);
      for (let f = 1; f <= floors; f++) { box(base, mat.plank, [w, .07, 1], [0, f * FLOOR - .1, z - .1]); box(base, mat.steel, [w, .06, .06], [0, f * FLOOR + .9, z + .45]); }
      for (let k = 0; k < cols; k++) box(base, mat.steel, [.06, Math.hypot(w / cols, FLOOR * 2), .06], [-w / 2 + (k + .5) * w / cols, FLOOR * 1.5, z + .05], [0, 0, Math.atan2(w / cols, FLOOR * 2) * (k % 2 ? 1 : -1)]);
    }
    // Telão de LED na fachada (Ato 4): os lançamentos de 2017 a 2026.
    if (lot.screen && floors >= 4) {
      const sw = Math.min(w * .8, 9), sh = sw / (1024 / AD_H), y = h - sh / 2 - 1.2;
      box(base, mat.trimDark, [sw + .4, sh + .4, .3], [0, y, d / 2 + .2]);
      plane(base, mat.screen, sw, sh, [0, y, d / 2 + .36], null, atlasUV(adIndex(3, rng), AD_ROWS.length));
    }
    // Neon nas arestas do telhado e na quina (Ato 4).
    if (lot.neon) {
      const tube = rng() < .5 ? mat.neonPink : mat.neonCyan;
      box(base, tube, [w + .75, .12, .12], [0, h + .82, d / 2 + .16]);
      box(base, tube, [.12, h - 3.4, .12], [w / 2 + .17, 3.4 + (h - 3.4) / 2, d / 2 + .17]);
    }
    // Telhado de cada época.
    const roofSpot = () => [(rng() - .5) * (w - 3.2), (rng() - .5) * (d - 3.2)];
    if (lot.tank && floors >= 3) {
      const [tx, tz] = roofSpot(); const y = h + .15;
      for (const [lx, lz] of [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]]) box(base, mat.metal, [.16, 1.7, .16], [tx + lx, y + .85, tz + lz]);
      box(base, mat.metal, [2.3, .14, 2.3], [tx, y + 1.75, tz]);
      cyl(base, era === 1 ? pick(rng, plastic) : mat.wood, 1.05, 1.1, 2.3, [tx, y + 2.97, tz], 16);
      cyl(base, mat.metal, 0, 1.2, .8, [tx, y + 4.5, tz], 16);
      for (const k of [.5, 1.6]) cyl(base, mat.metal, 1.12, 1.12, .08, [tx, y + 1.82 + k, tz], 16);
    }
    if (era === 0) {
      // Antena de TV dos anos 2000.
      const [ax, az] = roofSpot();
      cyl(base, mat.metal, .04, .05, 3, [ax, h + 1.7, az], 5);
      for (const k of [0, .5, 1]) box(base, mat.metal, [1.6 - k * .5, .04, .04], [ax, h + 2.2 + k * .6, az]);
    }
    if (era === 1) {
      junkPile(base, rng, (rng() - .5) * (w - 4), h + .15, (rng() - .5) * (d - 4), 2.5, 6 + Math.floor(rng() * 6));
      junkPile(base, rng, (rng() < .5 ? -1 : 1) * (w / 2 + .3), .35, d / 2 + 2.6, 1.6, 4);
      const [sx, sz] = roofSpot(); cyl(base, mat.steel, .9, .05, .35, [sx, h + 1.4, sz], 14, batches, [.6, 0, 0]); box(base, mat.metal, [.08, 1.2, .08], [sx, h + .7, sz]);
    }
    if (era === 2) for (let k = 0; k < 3; k++) { const [px, pz] = roofSpot(); box(base, mat.plank, [1.6, .1, .3], [px, h + .3, pz], [0, rng() * 3, .2]); }
    if (!dark) for (let k = 0, n = 1 + Math.floor(rng() * 3); k < n; k++) { const [ax, az] = roofSpot(); box(base, mat.steel, [1.2, .8, 1], [ax, h + .55, az]); cyl(base, mat.metal, .32, .32, .05, [ax, h + .98, az], 10); }
    if (rng() < .5) { const [sx, sz] = roofSpot(); box(base, trim, [2.2, 2.2, 2.4], [sx, h + 1.2, sz]); }
    if (floors >= 8 && !dark) {
      const [ax, az] = roofSpot();
      cyl(base, mat.metal, .07, .12, 7, [ax, h + 3.6, az], 6); box(base, mat.metal, [1.8, .06, .06], [ax, h + 5.5, az]);
      put(batches, mat.red, place(base, new THREE.SphereGeometry(.2, 8, 6), [ax, h + 7.2, az]));
    }
    // Outdoor no telhado com um marco da época.
    if (floors >= 3 && floors < 9 && rng() < (modern ? .2 : .35)) {
      const bw = w * .8, bh = bw / (1024 / AD_H);
      for (const s of [-1, 1]) box(base, dark ? mat.rust : mat.metal, [.15, 2.4 + bh, .15], [s * bw * .4, h + 1.2 + bh / 2, -d / 2 + 1]);
      box(base, dark ? mat.rust : mat.metal, [bw, .15, .8], [0, h + 2.1, -d / 2 + 1.2]);
      plane(base, dark ? mat.billboardFaded : mat.billboard, bw, bh, [0, h + 2.25 + bh / 2, -d / 2 + 1.12], dark ? [0, 0, .05] : null, atlasUV(adIndex(era, rng), AD_ROWS.length));
    }
    // Poste na calçada das lojas (apagado no hiato).
    if (lot.shop) {
      const lx = (rng() < .5 ? -1 : 1) * (w / 2 + .4);
      cyl(base, mat.metal, .09, .14, 5.2, [lx, 2.8, d / 2 + 3.1], 8);
      box(base, mat.metal, [.08, .08, 1.3], [lx, 5.3, d / 2 + 2.5]);
      box(base, dark ? mat.dead : modern ? mat.neonCyan : mat.glow, [.45, .18, .7], [lx, 5.2, d / 2 + 2.1]);
    }
  }
  CITY_LOTS.forEach(building);

  // Portais de entrada de cada bairro, sobre a rua: "ATO n · título · anos · álbuns".
  for (const gate of ERA_GATES) {
    const base = frame(gate.x, -.3, gate.z, gate.heading), span = gate.width + 6, row = gate.era;
    const color = new THREE.MeshStandardMaterial({ color: CITY_ERAS[row].color, roughness: .6 });
    for (const s of [-1, 1]) { cyl(base, mat.metal, .28, .32, 8.4, [s * span / 2, 4.2, 0], 10); box(base, color, [.8, .5, .8], [s * span / 2, .25, 0]); }
    box(base, mat.metal, [span + .6, 2.2, .3], [0, 7.4, 0]);
    box(base, color, [span + .6, .18, .5], [0, 8.6, 0]);
    for (const s of [1, -1]) plane(base, mat.gate, Math.min(span - 1, 8), 2, [0, 7.4, s * .17], s < 0 ? [0, Math.PI, 0] : null, atlasUV(row, CITY_ERAS.length));
  }

  // Skyline distante: a cidade continua além das colinas.
  const rng = seeded(2005);
  for (let i = 0; i < 120; i++) {
    const angle = i / 120 * Math.PI * 2 + rng() * .03, r = 1 + rng() * .25;
    const x = Math.cos(angle) * 300 * r, z = -75 + Math.sin(angle) * 275 * r;
    const style = rng() < .65 ? 'concrete' : 'glass', w = 10 + rng() * 16, d = 10 + rng() * 16;
    const floors = Math.round(9 + rng() * 22 + (rng() < .12 ? 14 : 0));
    const base = frame(x, -14, z, -angle + Math.PI / 2);
    walls(base, facadeMaterial(style, 0), w, d, floors, rng, skyline); rng();
    box(base, mat.roof, [w + .6, .6, d + .6], [0, floors * FLOOR, 0], null, skyline);
    if (rng() < .3) { cyl(base, mat.metal, .2, .3, 10, [0, floors * FLOOR + 5, 0], 6, skyline); put(skyline, mat.red, place(base, new THREE.SphereGeometry(.5, 8, 6), [0, floors * FLOOR + 10.3, 0])); }
  }
  const ground = new THREE.Mesh(new THREE.CircleGeometry(620, 48), new THREE.MeshStandardMaterial({ color: '#33423e', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -7, -75); scene.add(ground);

  const group = new THREE.Group(); group.name = 'city';
  for (const [target, shadows] of [[batches, true], [skyline, false]]) for (const [material, geometries] of target) {
    const mesh = new THREE.Mesh(mergeGeometries(geometries), material); geometries.forEach(g => g.dispose());
    mesh.castShadow = shadows; mesh.receiveShadow = shadows; group.add(mesh);
  }
  scene.add(group);
  return group;
}
