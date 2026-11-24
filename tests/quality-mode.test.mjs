import test from 'node:test';
import assert from 'node:assert/strict';
import { qualitySettings } from '../src/scene.js';
test('qualidade limita resolução e simplifica efeitos sem desligar objetos essenciais', () => {
 const low=qualitySettings('performance',2,80,36), high=qualitySettings('ultra',2,80,36);
 assert.equal(low.pixelRatio,1); assert.equal(high.pixelRatio,1.5);
 assert.equal(low.shadows,false); assert.equal(high.shadows,true);
 assert.equal(low.birds,40); assert.equal(low.particles,12); assert.equal(low.dust,false);
 assert.equal(high.birds,80); assert.equal(high.particles,36); assert.ok(low.far<high.far);
 assert.equal(qualitySettings('desconhecido',1,80,36).name,'auto');
});
