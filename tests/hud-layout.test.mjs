import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isControlsKey, isHelpKey } from '../src/onboarding.js';

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('tecla H abre e fecha o menu de controles; B e F1 abrem a ajuda; H não abre a ajuda', () => {
  assert.equal(isControlsKey('h'), true);
  assert.equal(isControlsKey('H'), true);
  assert.equal(isHelpKey('h'), false);
  assert.equal(isHelpKey('b'), true);
  assert.equal(isHelpKey('f1'), true);
  assert.equal(isControlsKey('b'), false);
});

test('botão do menu de controles mostra [H] e declara o atalho H', async () => {
  const html = await read('index.html');
  assert.match(html, /id="controls-toggle"[^>]*aria-keyshortcuts="H"[^>]*>\[H\] Controles</);
});

test('botões de direção/freio só aparecem em tela de toque (any-pointer:coarse), nunca em desktop estreito', async () => {
  const css = await read('src/world.css');
  // A regra que mostra o bloco de toque é o oposto: esconde quando NÃO há ponteiro grosso.
  assert.match(css, /@media \(not \(any-pointer:coarse\)\) \{ #jogo \.drive-buttons \{ display:none; \} \}/);
  // A antiga condição por largura (max-width:700px) não pode mais mostrar os botões de toque no desktop.
  assert.doesNotMatch(css, /#jogo \.drive-buttons \{ display:(flex|block)/);
});

test('desktop (ponteiro fino): faixa de instruções sai, atalhos vão para o menu, Kong FM encosta na base em 16 px', async () => {
  const css = await read('src/landing-fixes.css');
  assert.match(css, /@media \(min-width:701px\) and \(any-pointer:fine\) \{[\s\S]*?#jogo \.controls \{ display:none; \}/);
  assert.match(css, /@media \(min-width:701px\) and \(any-pointer:fine\) \{[\s\S]*?#jogo #road-radio \{ bottom:16px; \}/);
  assert.match(css, /#jogo \.journey \.quick-view \{ position:static/);
});

test('no desktop só o botão do passeio aparece no topo (sem texto grande de faixa)', async () => {
  const css = await read('src/landing-fixes.css');
  assert.match(css, /#jogo \.guided-bar #guided-text \{ display:none; \}/);
});

test('títulos das fichas e do cabeçalho do drawer não colam as letras (letter-spacing e word-spacing normais)', async () => {
  const css = await read('src/landing-fixes.css');
  assert.match(css, /\.discovery-card h3, \.discoveries-drawer h2 \{ letter-spacing:\.02em; word-spacing:\.14em; \}/);
});

test('exploration-hud fica oculto quando #jogo está com data-entered=true (evita cartão duplicado no canto superior esquerdo)', async () => {
  const css = await read('src/world.css');
  assert.match(css, /#jogo\[data-entered=true\] \.exploration-hud \{ display:none !important; \}/);
});
