import test from 'node:test';
import assert from 'node:assert/strict';
import {loadJourney,saveJourney} from '../src/progress.js';
const memory = (value = null) => ({value,getItem(){return this.value;},setItem(key,next){this.value=next;}});
test('uma viagem nova ou um registro inválido não quebra a página',()=>{
  for(const value of [null,'broken','{}','{"version":2}'])assert.deepEqual(loadJourney(memory(value)),{position:0,discovered:[]});
});
test('o progresso restaura posição e apenas integrantes únicos válidos',()=>{
 const storage=memory(JSON.stringify({version:1,position:-.25,discovered:[0,0,3,-1,4,'1',null]}));
 assert.deepEqual(loadJourney(storage),{position:.75,discovered:[0,3]});
});
test('salvar uma volta preserva o progresso sem depender da quantidade de voltas',()=>{
 const storage=memory();assert.equal(saveJourney(storage,3.25,new Set([1,2])),true);
 assert.deepEqual(loadJourney(storage),{position:.25,discovered:[1,2]});
});
test('uma posição inválida não contamina o movimento',()=>{
 assert.equal(loadJourney(memory(JSON.stringify({version:1,position:'bad',discovered:[]}))).position,0);
});
test('bloqueio do armazenamento mantém a experiência utilizável',()=>{
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.deepEqual(loadJourney(blocked),{position:0,discovered:[]});assert.equal(saveJourney(blocked,0,new Set()),false);
});
