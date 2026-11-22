# Roteiro curto: medir no celular Android (Eduardo)

Tempo: cerca de 15 minutos. Precisa de um Android com Chrome, cabo USB e o computador com Chrome. A emulação do computador não mede GPU de celular; este roteiro mede o aparelho real.

## Preparar

1. No celular: Opções do desenvolvedor → Depuração USB. No computador: abra `chrome://inspect/#devices` e autorize o celular.
2. Para comparar **antes × depois**, tenha dois endereços:
   - **depois** = versão atual (Pages publicado ou `PORT=3000 node server.mjs` no computador, aberto no celular pelo IP da rede, ex.: `http://192.168.0.10:3000/`);
   - **antes** = commit anterior: `git worktree add ../Gorilazz-antes d366ed3`, depois `cd ../Gorilazz-antes && PORT=3100 node server.mjs` e `http://192.168.0.10:3100/`.
3. Feche outros apps, deixe a tela ligada, brilho fixo, modo avião desligado, carregador desligado e anote a bateria. Deixe o celular esfriar 2 minutos entre medidas.

## Medir (repita em antes e depois, mesma ordem)

1. No celular, abra `ENDEREÇO/?perf` (sem `qualidade`: é a seleção automática do perfil). Toque em "Quero dirigir" só se quiser medir em condução; para a medida padrão, **não toque em nada** e espere 15 s.
2. No computador, em `chrome://inspect`, clique em *inspect* na página, abra o Console e cole o conteúdo de `docs/gestao/evidencias/performance/collect-console.js`.
3. Rode (20 s por amostra, câmera parada):

```js
const r = await collectPerformance('parado', 20);
const media = k => Math.round(r.samples.reduce((a, s) => a + s[k], 0) / r.samples.length);
console.table({ rotulo: r.label, fps: +r.fps.toFixed(1), p50_ms: Math.round(r.p50), p95_ms: Math.round(r.p95),
  chamadas: media('calls'), triangulos: media('triangles'), perfil: r.quality, canvas: r.canvas.join('x'),
  pixelRatio: r.samples.at(-1).ratio, dpr: devicePixelRatio, largura: innerWidth });
```

4. Repita para a vista aérea: toque em "Quero dirigir", depois em "◎ VER MUNDO", espere 10 s e rode `await collectPerformance('aerea', 20)` com o mesmo bloco acima.
5. Repita uma vez com `?perf&qualidade=leve` e uma com `?perf&qualidade=alta` para ver o efeito do perfil.

## O que esperar e o que registrar

- Na versão **antes** o perfil inicial no celular é `alta` (bug de largura do contêiner); na **depois** deve ser `leve` desde o começo. O campo `perfil` mostra isso. A `pixelRatio` inicial deve ser menor (1,5 contra 1,75) e depois cai com a adaptação.
- Registre por cenário: fps, p50 e p95 (ms), chamadas, triângulos, perfil e pixelRatio final, mais a temperatura/bateria no início e no fim.
- Interprete: p95 menor e fps maior na versão depois = ganho; sem diferença = ganho não comprovado. Qualquer piora visual (sombras sumindo, imagem mole) deve ser anotada com uma captura.
- Se o celular ficar abaixo de 20 fps no perfil leve, o próximo passo seria reduzir a distância das sombras ou desligá-las no leve; não foi aplicado sem medida em aparelho real.

## Atenção

- A medida do computador (emulação) variou de 36 a 109 quadros em 35 s com o mesmo código; por isso só a medida no aparelho decide o resultado de FPS.
- `collect-console.js` conta renders publicados pelo app (`data-triangles`); mantenha a aba visível e não mude a câmera durante a amostra.
