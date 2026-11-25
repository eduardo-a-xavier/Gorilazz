import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Auditoria real no Chrome (raycast para baixo no centro e nos 4 cantos de cada veículo instanciado na cena),
// gerada por docs/gestao/evidencias/veiculos-auditoria-2026-11-26/veiculos_prints.py.
const audit = JSON.parse(await readFile(new URL('../docs/gestao/evidencias/veiculos-auditoria-2026-11-26/prints_depois.json', import.meta.url), 'utf8'));

// Asfalto: malha de pista ou pátio escuro (cor do asfalto). Faixas pintadas e objetos claros NÃO contam.
const isAsphalt = hit => hit.name === 'road-asphalt' || (hit.name === 'studio-ground' && Array.isArray(hit.color) && hit.color.reduce((a, b) => a + b, 0) < 120);

test('veículos: a auditoria real cobre todos os veículos da cena (nenhum fora da varredura)', () => {
  assert.ok(Array.isArray(audit.veiculos), 'auditoria de veículos presente');
  assert.equal(audit.http_4xx.length, 0, 'sem respostas 4xx');
  assert.equal(audit.console_errors.length, 0, 'sem erros de console');
});

test('veículos: centro e 4 cantos de cada carro estacionado estão sobre asfalto (raycast real, não contagem)', () => {
  for (const v of audit.veiculos) {
    const pts = [v.centro, ...v.cantos];
    assert.ok(pts.every(isAsphalt), `veículo em ${v.x},${v.z}: pontos fora do asfalto (${pts.map(p => p.name).join(', ')})`);
  }
});

test('veículos: sem inclinação nem flutuação (base no asfalto, rotação paralela ao eixo da vaga)', () => {
  for (const v of audit.veiculos) {
    assert.ok(v.y >= -0.2 && v.y <= 0, `altura do veículo em ${v.x},${v.z}: y=${v.y}`);
    const bay = Math.abs(Math.abs(v.yaw) - Math.PI / 2) < 0.01 || Math.abs(v.yaw) < 0.01;
    assert.ok(bay, `rotação do veículo em ${v.x},${v.z} não está paralela à vaga (yaw=${v.yaw})`);
  }
});

test('veículos: o furgão do Easter egg não entra na cena (ficava sobre grama/terra); o gatilho continua', async () => {
  const src = await readFile(new URL('../src/easter-eggs.js', import.meta.url), 'utf8');
  assert.ok(!/^\s*scene\.add\(trailer\);/m.test(src), 'malha do trailer não é adicionada à cena');
  assert.match(src, /id: 'trailer', x: -77, z: -41, radius: 4/, 'gatilho do Easter egg preservado');
});
