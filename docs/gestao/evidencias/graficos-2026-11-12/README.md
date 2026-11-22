# Melhorias gráficas de baixo risco — 12/11/2026

Base: `docs/gestao/evidencias/performance/README.md` e `docs/gestao/evidencias/pesquisa-graficos/melhorias-visuais-threejs.md`. Sem commit, push, publicação ou instalação; servidor da porta 3000 (PID 22696) não foi reiniciado. Medições em cópias estáticas do site servidas em portas efêmeras (`/Gorilazz/`): **antes** (código anterior à mudança) e **depois**. `changes.diff` reúne todas as mudanças gráficas de `src/materials.js` e `src/scene.js` sobre o código com caminhos já relativos. Números brutos em `medicoes.json` e `inventario-malhas.json`.

**Aviso sobre FPS:** o navegador desta sessão entregou de 1 a 3 quadros/s, e o mesmo código variou de **36 a 109 quadros em 35 s** em duas repetições idênticas. Frame time e percentis estão registrados, mas **não provam ganho**. As provas abaixo são contagens que não dependem do ritmo (Sources, texturas na GPU, chamadas, triângulos, perfil, pixel ratio, imagem). O ganho de FPS só pode ser medido no celular: `roteiro-celular.md`.

## Resumo

| # | Mudança | Resultado | Estado |
| --- | --- | --- | --- |
| B1 | Sources de textura compartilhados por URL | Sources 32 → 12 (≈ −26,67 MiB estimados), texturas na GPU 150 → 130, imagem idêntica | Aplicado e mantido |
| B1b | Clone de textura sem imagem não gera mais aviso do Three.js | `version` 1 → 0 até a imagem chegar | Aplicado (correção de B1) |
| B2a | Perfil leve na vista aérea: sombra a cada 4 quadros | Triângulos por quadro −13%, chamadas −5,9% | Aplicado |
| B2b | Perfil leve na vista aérea: banda e escultura não projetam sombra | Quadro de sombra −30% de triângulos; média −10,8% | Aplicado |
| I1 | Perfil e pixel ratio no celular: largura do contêiner era 0 | Celular passa a ter perfil `leve`, teto 1,5 e meta de 30 quadros/s | Aplicado |
| I1b | Teto/ponto de partida do pixel ratio menor | Sem como provar ganho sem GPU de celular | **Não aplicado** |
| I2b | Menor frustum/mapa de sombra, menos luzes | Já há uma só luz com sombra; encurtar o frustum corta sombras visíveis | **Não aplicado** |
| I3 | InstancedMesh e LOD | Sem candidatos relevantes; objetos densos já têm impostor | **Não aplicado** |

## B1 — Sources de textura compartilhados por URL

`src/materials.js` (`createSurfaceLibrary`): cada PNG é carregado uma vez; combinações de repeat usam `texture.clone()`, que compartilha o `Source` (e a textura de GPU) com `repeat` próprio. Clones criados antes do fim do download recebem `needsUpdate` quando a imagem chega. `colorSpace`, `anisotropy`, wrap e `normalScale` seguem como antes.

| Medida (cena parada, perfil padrão) | Antes | Depois | Diferença |
| --- | ---: | ---: | ---: |
| Sources de superfície (`assets/materials`) | 32 | 12 | −20 |
| Estimativa RGBA8 + mipmaps | 42,67 MiB | 16,00 MiB | **−26,67 MiB** (estimativa, não é VRAM) |
| Texturas na GPU (`renderer.info.memory.textures` após `initTexture` em todas) | 150 | 130 | −20 |
| Triângulos (`data-triangles`) | 448.680 | 448.680 | 0 |

Imagem: `texturas-antes.png` × `texturas-depois.png`, mesma câmera: diferença máxima 5/255, 0 de 863.600 pixels acima de 8.

**B1b (correção que apareceu na medição do celular):** o Three.js chama `needsUpdate` dentro de `clone()`. Um clone criado antes de a imagem chegar ficava com `version` 1 e sem dados, o que gera o aviso `Texture marked for update but no image data found` se for desenhado nesse intervalo. Agora ele volta a `version` 0 até a imagem chegar. Verificado na página: clone pré-carga `version` 1 → 0; depois da carga ambos têm dados, `repeat` independente e o mesmo `Source`. A página no celular emulado ficou sem avisos de console.

## B2 — Sombras no perfil leve, vista aérea

`src/scene.js`. Perfil leve (`?qualidade=leve` ou tela < 700 px) **e** vista aérea ("◎ VER MUNDO"):

- B2a: o mapa de sombras é redesenhado a cada 4 quadros em vez de a cada 2.
- B2b: os modelos densos (`heavyCasters`: banda e escultura) não projetam sombra. A 290 m eles ocupam poucos pixels.

Antes de B2, o quadro de sombra custava +196.084 triângulos sobre o quadro normal (279.480 → 475.564), principalmente por esses modelos densos e pelas árvores. Os volumes de sombra da cidade (caixas fundidas) são pequenos.

| Perfil leve, vista aérea, 28 quadros | Original | + B2a | + B2a e B2b |
| --- | ---: | ---: | ---: |
| Quadro sem sombra (chamadas / triângulos) | 327 / 279.480 | 327 / 279.480 | 327 / 279.480 |
| Quadro de sombra (chamadas / triângulos) | 415 / 475.564 | 415 / 475.564 | **383 / 333.276** |
| Frequência do quadro de sombra | 1 em 2 | 1 em 4 | 1 em 4 |
| Média de chamadas por quadro | 371,0 | 349,0 | **341,0** |
| Média de triângulos por quadro | 377.522 | 328.501 | **292.929** (−22,4% vs original) |

Imagem: B2a idêntica (diferença 0). B2b: `casters-aerea-leve-antes.png` × `casters-aerea-leve-depois.png`, mesma câmera: diferença máxima 23/255, 204 de 863.600 pixels acima de 8, todos numa região de 68 × 38 px (sombras da banda perto do jipe). Visualmente imperceptível a essa altura.

## I1 — Perfil e pixel ratio no celular (achado principal)

**Defeito encontrado:** `createWorld` decide o perfil por `container.clientWidth`, mas o contêiner ainda tem largura 0 quando o mundo é criado (confirmado com uma sonda temporária em cópia de teste: `clientWidth = 0`, `innerWidth = 390`, `compact = false`). Resultado em qualquer celular: perfil **alto** no início (bloom, sombras de 2048, teto de pixel ratio 1,75 e meta de 60 quadros/s), até a adaptação derrubar o bloom e a resolução. Isso também explica a nota "alta → padrao" do relatório de performance. Correção: `(container.clientWidth || innerWidth) < 700`.

Celular emulado (375 × 844, DPR 3), primeiros 35 s:

| Medida | Antes | Depois |
| --- | --- | --- |
| Perfil no início → após 35 s | `alta` → `padrao` (bloom descartado) | `leve` → `leve` |
| Pixel ratio inicial / buffer | 1,75 / 656 × 1477 (0,97 MP) | 1,5 / 562 × 1266 (0,71 MP, **−27%**) |
| Mapa de sombras | 2048 | 1024 |
| Meta de quadros da adaptação | 60/s | 30/s |
| Trajetória do pixel ratio | 1,75 ×4, 1,49, 1,26, 1,07, 0,91, 0,78, 0,7 | 1,5 ×3, 1,27, 1,08, 0,92, 0,78, 0,7 |
| Chamadas / triângulos médios por quadro | 173,9 / 317.598 | 171,0 / 317.595 |
| Carregamento (load / mundo pronto / recursos / MiB decodificados) | 272 ms / 1,70 s / 54 / 13,22 | 275 ms / 1,73 s / 54 / 13,22 |

Ambos terminam em 0,7 neste ambiente. Imagem estável: `celular-emulado-antes.png` × `celular-emulado-depois.png`: diferença máxima 12/255, 0 de 329.160 pixels acima de 16. O ganho esperado em aparelho real está em **não começar** com bloom, sombras de 2048 e 0,97 MP; isso precisa de medição no celular (`roteiro-celular.md`). Em tela larga a mudança não altera nada (`clientWidth` ≥ 700).

**Não aplicado (I1b):** começar o perfil leve em pixel ratio 1,0 e deixar a adaptação subir, ou baixar o teto de 1,5. Sem GPU de celular não há como provar que ajuda, e custaria nitidez nos primeiros segundos. A lógica atual de adaptação (descer até 0,7, subir com folga) foi reaproveitada sem duplicação; a única mudança é a detecção correta do perfil.

## I2 — Sombras mais baratas: o que foi e o que não foi feito

- **Luzes com sombra:** já há uma só (`DirectionalLight`), sem `PointLight`. Nada a cortar.
- **Casters seletivos:** aplicado em B2b. Fora da vista aérea os modelos densos já só projetam sombra a menos de 55 m do jipe.
- **Mapa menor:** o perfil leve já usa 1024 (e agora o celular entra nele de fato).
- **Frustum menor** (`SHADOW_SPAN` = 90 m): não aplicado. Câmeras de 29 a 46 m no celular fariam sombras sumirem numa linha visível atrás do jipe; exige teste visual em movimento.

## I3 — Inventário de malhas repetidas

`inventario-malhas.json`: 364 objetos de desenho, 3 `InstancedMesh` (árvores e arbustos). O maior grupo repetido não instanciado tem 5–6 objetos e no máximo 2.400 triângulos; **não há candidato a `InstancedMesh`**. Para LOD, os objetos densos distantes (banda, escultura) **já têm impostor** (`heavyCaster`, a mais de 88 m). Sobram sem LOD árvores e arbustos (33.216 triângulos, ~12% do quadro) e o estúdio (8,7 mil); um LOD exigiria geometrias simplificadas novas, com risco de saltos visuais. Não aplicado.

## Validação

- `npm run check`: saída 0. `npm test`: 49 de 49 (`check.log`, `test.log`) após cada mudança (B1, B2a, B2b e I1; as duas últimas foram revisadas no mesmo arquivo e verificadas juntas).
- Nada foi revertido por piorar a imagem; I1b, frustum e LOD ficaram de fora por falta de prova, não por regressão.

## Limitações e riscos

- Sem Android real: nenhuma medida de FPS, temperatura ou bateria. A emulação (viewport 375 × 844, DPR 3) usa a mesma GPU do computador.
- B2 e I1 medidos com o jipe parado; a atualização de sombra a cada 4 quadros e a ausência de sombra dos modelos densos na vista aérea não foram testadas com o jipe em movimento.
- O perfil é escolhido uma vez, na criação do mundo (como antes): girar o celular depois não muda o perfil, e uma tela em paisagem com ≥ 700 px continua no perfil alto.
- Risco de I1: celulares agora começam sem bloom e com sombras de 1024; se Eduardo preferir bloom em celulares potentes, o caminho é `?qualidade=alta`.
- Medição do "depois" de B2 foi repetida em porta nova porque o navegador guardou arquivos em cache na primeira tentativa.
