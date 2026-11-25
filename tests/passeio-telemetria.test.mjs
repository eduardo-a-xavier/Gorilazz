import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Aceite do passeio guiado: métricas geradas por docs/gestao/evidencias/passeio-cinematografico-2026-11-26/analisar_telemetria.mjs
// a partir das gravações headless sob /Gorilazz/ (1ª e 3ª pessoa).
for (const mode of ['3a', '1a']) {
  test(`passeio ${mode} sob /Gorilazz/: 9/9 paradas, 0 fora do asfalto, 0 colisões com carros, 0 erros`, async () => {
    const m = JSON.parse(await readFile(new URL(`../docs/gestao/evidencias/passeio-cinematografico-2026-11-26/metricas-${mode}-subcaminho.json`, import.meta.url), 'utf8'));
    assert.equal(m.stopsReached, 9, 'paradas atingidas');
    assert.equal(m.offAsphaltSamplesMoving, 0, 'amostras com o centro do Geep fora do asfalto');
    assert.equal(m.parkedCarCollisionSamples, 0, 'colisões com carros estacionados');
    assert.equal(m.consoleErrors, 0, 'erros de console');
    assert.ok(m.maxSpeedKmh <= 65, `velocidade máxima ${m.maxSpeedKmh} km/h`);
  });
}
