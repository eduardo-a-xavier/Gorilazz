import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { installStreetProps, limitStreetProps } from '../src/street-props.js';
test('props distantes são ocultados em desempenho e restaurados ao trocar qualidade', () => {
 const scene=new THREE.Scene(), {group}=installStreetProps(scene);
 const totals=group.children.map(m=>m.count);
 limitStreetProps(group,0,0,35);
 assert.ok(group.children.some((m,i)=>m.count<totals[i]));
 limitStreetProps(group,0,0,Infinity);
 assert.deepEqual(group.children.map(m=>m.count),totals);
});
