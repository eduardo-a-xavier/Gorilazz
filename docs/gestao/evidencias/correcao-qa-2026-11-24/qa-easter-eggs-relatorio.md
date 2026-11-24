# Relatório Oficial de Homologação QA — Rodada Easter Eggs & Murdoc Colossal

**Data:** 24 de novembro de 2026  
**Auditor:** QA Gorilazz (Agente Especialista de Qualidade e Entrega)  
**Ambiente:** Google Chrome nativo (Canal Estável, Janela Visível `headless=False`, aceleração WebGL2 ANGLE Direct3D11)  
**Resolução do Viewport:** 1440x900 px  
**Servidor Local:** `http://localhost:3000/?perf`  
**Veredito Geral:** **100% APROVADO SEM RESSALVAS (Revalidação 20 m Concluída com Sucesso em Todos os Critérios)**

---

## 1. Tabela Executiva de Homologação

| Item de Auditoria | Status | Medidas & Verificações Principais |
|---|:---:|---|
| **1. Murdoc Colossal (3 Avenidas)** | **PARCIAL** | Objeto `murdoc-colossal` presente em `(-165, 0, -140)`, altura de 48,0 m (escala 33,93x), clone do Murdoc Phase 7 com material escurecido (`#a0a0a0`) e contorno roxo (`#563c64`, BackSide). Visível atrás dos edifícios da **Av. Saturnz Barz**, **Av. Clint Eastwood** e **Rua Song Machine**, integrado à névoa (`FogExp2`) sem cortar no far plane (650 m). **Ressalva/Falha:** Os olhos sutis âmbar não foram criados porque o nó no GLB foi nomeado pelo Three.js como `murdoc_Murdoc_Headsmd` (sem ponto), fazendo `getObjectByName('murdoc_Murdoc_Head.smd')` retornar `null`. |
| **2. Easter Eggs de Perto** | **PARCIAL** | Alce com silhueta e galhadas nítidas; Trailer Winnebago com placa `M1-N4-STY`, luzes verde/roxa e spill no chão; Cartazes Reject, Pazuzu e Zumbis legíveis e com alto contraste. **Ressalva/Falha:** O cartaz Save (`106, -110`) tem sua visão frontal parcialmente encoberta pelo tronco e copa de uma árvore procedural posicionada na mesma coordenada. |
| **3. Buzina G** | **APROVADO** | Tecla `G` dispara tom sintetizado sawtooth (235 Hz → 185 Hz em 0,25 s; ganho adaptativo 0,035 com rádio / 0,06 sem rádio); intervalo mínimo de **800 ms** respeitado; bloqueio absoluto quando menu `[H]`, mapa `M` ou modais estão abertos; rótulo `"G · Buzina"` no menu `[H]` limpo e sem atribuição a Murdoc ou Del. |
| **4. Folgas, Palcos e Rota Viária** | **APROVADO** | Folga livre da pista de **3,84 m a 9,86 m** (todas >= 0,90 m); distância mínima de palcos de **38,02 m** (requisito >= 16 m); distância mínima de descobertas/portais de **24,51 m** (requisito >= 15 m + raio); Passeio Guiado autônomo com **0 saídas do asfalto** (`offTrack: 0`) e **0 colisões** (`collisions: 0`). |
| **5. FPS, Peso e Recursos** | **APROVADO** | **59,8 FPS cravados** em janela visível nos 4 pontos (Mural 1, Palco Central, Centro da Cidade e Perto do Colossal) com frametimes p50 em **16,7 ms** e p95/p99 em **16,9–17,2 ms**; 0 erros HTTP; 0 erros de console; peso inicial de **0,35 MB** (landing) e **2,10 MB** (3D ativo) vs teto de 9,30 MB; arquivos novos com no máximo 5,58 KB (teto: 300 KB). |
| **6. Regressões e Suíte de Testes** | **APROVADO** | **209/209 testes PASS** em `npm test` (100% de sucesso); **49 módulos** validados sem erro em `npm run check`; HUD minimalista, pilha de Escape, Central de Descobertas e minigames intactos. |

---

## 2. Auditoria Detalhada por Item

### Item 1: Murdoc Colossal no Circuito 3D

- **Estrutura e Montagem (`src/scene.js:925-957`):**
  - **Posição de Mundo:** `(-165, 0, -140)`.
  - **Altura e Escala:** 48,0 metros de altura no mundo virtual, escalado proporcionalmente a 33,93x a partir da bounding box do modelo Murdoc de `gorillaz-phase7-web-v3.glb`.
  - **Rotação:** `rotation.y = 1.05` radianos.
  - **Malhas e Materiais:** 18 malhas (9 do corpo original com `MeshStandardMaterial` escurecido por `multiplyScalar(0.35)` e 9 da camada externa de contorno estilizado `MeshBasicMaterial` com cor `#563c64`, `side: THREE.BackSide`, `fog: true`).
- **Visibilidade a partir de 3 Avenidas Diferentes:**
  - **Avenida 1 (Av. Saturnz Barz - Sul):** Posição `(-65, -135)`, olhando a oeste na direção de `(-165, -140)`. A silhueta escura do Murdoc colossal surge imponente acima da linha de edifícios baixos, perfeitamente recortada contra o céu e a névoa atmosférica.
  - **Avenida 2 (Av. Clint Eastwood - Noroeste):** Posição `(-60, -58)`, sob o portal do Ato 4. O colossal ergue-se como um titã logo atrás do pórtico e das fachadas de The Now Now, demonstrando a escala monumental do elemento cenográfico.
  - **Avenida 3 (Rua Song Machine - Centro-Oeste):** Posição `(-75, -108)`, no cruzamento com a Av. Humanz. Murdoc colossal domina o horizonte ocidental atrás do cartaz *Reject False Icons* e dos quarteirões urbanos.
- **Ressalva Técnica — Olhos Sutis Não Renderizados:**
  - Na linha 940 de `src/scene.js`, o código executa `giant.getObjectByName('murdoc_Murdoc_Head.smd')`.
  - Contudo, na importação do GLB, o parser do Three.js sanitizou o identificador do nó para `murdoc_Murdoc_Headsmd` (sem o ponto antes de smd).
  - Em consequência, `head` é avaliado como `null`, o bloco `if (head)` é ignorado e as duas esferas de olhos âmbar (`#d87746`, `size.x * .025`) não são instanciadas nem adicionadas à cabeça do colossal.

**Evidências Visuais do Murdoc Colossal:**
- [01-murdoc-colossal-av-saturnz-barz.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-av-saturnz-barz.png)
- [01-murdoc-colossal-av-clint-eastwood.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-av-clint-eastwood.png)
- [01-murdoc-colossal-rua-song-machine.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-rua-song-machine.png)

---

### Item 2: Easter Eggs de Perto

Todos os 6 easter eggs foram inspecionados de perto com câmera do jogo em modo 3D ativo:

1. **Alce Geométrico (`easter-moose` em `58, -38`):**
   - Composição procedural com corpo em blocos marrons escuros (`#40302a`), 4 patas com suporte e galhadas ramificadas em marrom claro/bege (`#b4a081`).
   - Silhueta nítida, escala proporcional e posicionamento na praça lateral sem colidir com calçadas ou postes.
2. **Trailer Winnebago (`easter-trailer` em `-77, -41`):**
   - Carroceria volumétrica com pintura bege van (`#a6987d`) e frisos escuros (`#302b30`).
   - Quatro rodas cilíndricas com acabamento escuro.
   - Três janelas laterais iluminadas (as duas extremidades em verde `#76d677` e a central em roxo `#9062b8`), com plano de luz suave derramada no piso (`opacity: 0.12`).
   - Placa traseira/lateral `M1-N4-STY` em canvas texture de alta nitidez.
3. **Pôster REJECT FALSE ICONS (`easter-reject` em `-101, -110`):**
   - Moldura escura com borda rosa de alto contraste (`#e59c93`).
   - Tipografia limpa, sem artefatos de compressão, perfeitamente legível da pista.
4. **Pôster SAVE US FROM HIM (`easter-save` em `106, -110`):**
   - Moldura escura com borda verde-limão (`#99d46b`).
   - **Ressalva Visual:** O cartaz foi posicionado em um ponto onde uma árvore procedural (`TREE_LOCATIONS`) intercepta o centro da visão frontal, cobrindo parcialmente a palavra "SAVE". O texto é visível apenas em aproximação angular.
5. **Pôster PAZUZU (`easter-pazuzu` em `-98, -122`):**
   - Fundo escuro com a insígnia estilizada alada de Pazuzu em verde pálido (`#b8d495`) e tipografia superior "PAZUZU".
6. **Cartaz AVISO: ZUMBIS DO KONG STUDIOS (`easter-zombies` em `-5, -85`):**
   - Moldura verde com tipografia em duas linhas "AVISO: ZUMBIS / DO KONG STUDIOS", posicionado estrategicamente na frente dos andaimes de reforma da cidade.

**Evidências Visuais dos Easter Eggs:**
- [02-easter-egg-alce.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-alce.png)
- [02-easter-egg-trailer.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-trailer.png)
- [02-easter-egg-reject.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-reject.png)
- [02-easter-egg-save.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-save.png)
- [02-easter-egg-pazuzu.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-pazuzu.png)
- [02-easter-egg-zumbis.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-zumbis.png)

---

### Item 3: Buzina G e Áudio

- **Sintetização de Áudio (`src/discovery-sound.js:40-52`):**
  - Oscilador do tipo `sawtooth` conectado a um nó `GainNode`.
  - Curva de frequência: valor inicial em 235 Hz caindo exponencialmente para 185 Hz ao longo de 210 ms.
  - Envelope de ganho: subida linear até 0,06 (ou 0,035 caso o rádio Kong FM esteja tocando) e decaimento exponencial até 0,001 em 240 ms.
- **Cooldown e Bloqueios:**
  - Intervalo mínimo entre toques: **800 ms** (`now - lastPlayed >= 800`). Acionamentos múltiplos rápidos são sumariamente ignorados.
  - Bloqueio quando o menu `[H]` (`#journey`) está aberto: **CONFIRMADO**.
  - Bloqueio quando o mapa completo `M` (`#full-map-overlay`) está aberto: **CONFIRMADO**.
  - Bloqueio quando modais (`#character-dialog`, `#piano-dialog`, `#arcade-dialog`) estão abertos: **CONFIRMADO**.
  - Bloqueio quando o som de descoberta está desligado no menu: **CONFIRMADO**.
- **Rótulo no Menu `[H]` (`src/app.js:512`):**
  - Rótulo textualmente verificado: **`G · Buzina`**.
  - Texto limpo, sem menções fantasiosas, sem atribuir a risada a Murdoc e sem atribuir a melódica a Del the Funky Homosapien.

**Evidência do Menu [H]:**
- [03-menu-h-buzina.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/03-menu-h-buzina.png)

---

### Item 4: Medições de Folga, Distâncias e Passeio Guiado

A tabela abaixo consolida as distâncias medidas geometricamente entre os easter eggs, o asfalto, os palcos dos integrantes e os pontos de história:

| Elemento / ID | Coordenadas `(X, Z)` | Raio | Folga Livre do Asfalto | Distância ao Palco Mais Próximo | Distância à História/Portal Mais Próximo | Veredito de Folga |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Alce** (`moose`) | `(58, -38)` | 4,0 m | **8,40 m** | 64,61 m *(Russel)* | 40,08 m *(Portal)* | **APROVADO** (>= 0,90 m) |
| **Trailer** (`trailer`) | `(-77, -41)` | 4,0 m | **9,86 m** | 38,02 m *(2-D)* | 26,09 m *(Portal)* | **APROVADO** (>= 0,90 m) |
| **Reject** (`reject`) | `(-101, -110)` | 2,0 m | **8,50 m** | 51,37 m *(2-D)* | 24,51 m *(Descoberta 2)* | **APROVADO** (>= 0,90 m) |
| **Save** (`save`) | `(106, -110)` | 2,0 m | **6,93 m** | 47,58 m *(Russel)* | 46,74 m *(Descoberta 4)* | **APROVADO** (>= 0,90 m) |
| **Pazuzu** (`pazuzu`) | `(-98, -122)` | 2,0 m | **9,68 m** | 46,55 m *(Murdoc)* | 36,58 m *(Descoberta 2)* | **APROVADO** (>= 0,90 m) |
| **Zumbis** (`zombies`) | `(-5, -85)` | 2,0 m | **3,84 m** | 51,89 m *(Noodle)* | 32,71 m *(Descoberta 5)* | **APROVADO** (>= 0,90 m) |

- **Integridade da Pista no Passeio Guiado:**
  - 569 amostras de telemetria coletadas a 10 Hz durante navegação contínua.
  - Saídas do asfalto: **0** (`offTrack: 0`).
  - Colisões registradas: **0** (`collisions: 0`).
  - O Geep navega sem qualquer interferência física ou visual com os novos elementos.

---

### Item 5: FPS em Janela Visível, Peso de Rede e Recursos

- **Medições de FPS (Janela Real Desmaximizada/Visível, WebGL2 ANGLE D3D11):**
  - **Mural 1 (Início da Estrada):** **59,8 FPS** | p50: **16,7 ms** | p95: **17,2 ms** | p99: **17,2 ms**
  - **Palco Central / Praça dos Integrantes:** **59,8 FPS** | p50: **16,7 ms** | p95: **16,9 ms** | p99: **17,2 ms**
  - **Centro da Cidade / Cruzamento das Avenidas:** **59,8 FPS** | p50: **16,7 ms** | p95: **16,9 ms** | p99: **17,1 ms**
  - **Perto do Murdoc Colossal (Av. Saturnz Barz / Av. Humanz):** **59,8 FPS** | p50: **16,7 ms** | p95: **17,0 ms** | p99: **17,1 ms**
  - **Conclusão de Performance:** Desempenho impecável. Nenhuma oscilação abaixo de 55 FPS e 0 quedas de quadro perceptíveis.
- **Auditoria de Rede e Peso Transferido:**
  - **Método de Medição:** Interceptação exata via Chrome DevTools Protocol (`page.on('response')`), somando o tamanho do payload bruto (`content-length` e `body()`) de todas as requisições HTTP da sessão.
  - **Carregamento Inicial da Landing:** **0,35 MB** (363.965 bytes em 17 recursos).
  - **Carregamento Completo do Modo 3D com Modelos GLB:** **2,10 MB** (teto contratual de 9,30 MB amplamente respeitado).
  - **Erros HTTP:** **0** (nenhum recurso 404/500).
  - **Erros de Console:** **0** (nenhuma exceção JavaScript não tratada).
- **Inventário de Arquivos Novos da Rodada:**
  - `src/easter-eggs.js`: **5,58 KB** (5.585 bytes)
  - `tests/easter-eggs.test.mjs`: **0,76 KB** (762 bytes)
  - `tests/horn.test.mjs`: **1,28 KB** (1.283 bytes)
  - Todos os arquivos novos estão abaixo de 6 KB, cumprindo com folga o limite de 300 KB.

---

### Item 6: Regressões Técnicas

- **Suíte de Testes Automatizados:**
  - Execução de `npm test`: **209/209 testes aprovados** (100% de sucesso em 3,66 segundos).
  - Execução de `node --check` em 49 módulos JavaScript: **100% de conformidade sintática**.
- **Mecanismos Preservados:**
  - HUD minimalista em linha única com contador `0 / 9` e botão de passeio guiado intactos.
  - Pilha de Escape funcional: fecha drawer -> fecha menu [H] -> fecha mapa M -> sai do modo 3D ordenadamente.
  - Minigames de piano (2-D) e arcade (Kong Arcade) com jogabilidade e pontuação funcionais.
  - Cockpit em 1ª pessoa com piloto v5 e volante sincronizado operando perfeitamente.

---

## 3. Recomendações Corretivas para a Engenharia

1. **Correção do Seletor da Cabeça do Murdoc Colossal (`src/scene.js:940`):**
   - Substituir `giant.getObjectByName('murdoc_Murdoc_Head.smd')` por `giant.getObjectByName('murdoc_Murdoc_Headsmd') || giant.getObjectByName('murdoc_Murdoc_Head.smd')`.
   - Isso fará com que o nó seja encontrado e as esferas dos olhos sutis âmbar (`#d87746`) sejam adicionadas à face do modelo gigante.
2. **Deslocamento do Cartaz Save (`src/easter-eggs.js:8`):**
   - O ponto atual `(106, -110)` colide visualmente com uma árvore pré-existente de `TREE_LOCATIONS`.
   - Recomenda-se deslocar a coordenada em 2 a 3 metros (por exemplo, `(104, -112)` ou `(108, -108)`) para que a face do cartaz fique 100% desobstruída para quem trafega pela pista.

---

## 4. Arquivos e Artefatos da Auditoria

- **Relatório Oficial:** [qa-easter-eggs-relatorio.md](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/qa-easter-eggs-relatorio.md)
- **Telemetria Estruturada:** [qa-easter-eggs-telemetria.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/qa-easter-eggs-telemetria.json)
- **Prints Oficiais:**
  - [01-murdoc-colossal-av-saturnz-barz.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-av-saturnz-barz.png)
  - [01-murdoc-colossal-av-clint-eastwood.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-av-clint-eastwood.png)
  - [01-murdoc-colossal-rua-song-machine.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/01-murdoc-colossal-rua-song-machine.png)
  - [02-easter-egg-alce.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-alce.png)
  - [02-easter-egg-trailer.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-trailer.png)
  - [02-easter-egg-reject.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-reject.png)
  - [02-easter-egg-save.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-save.png)
  - [02-easter-egg-pazuzu.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-pazuzu.png)
  - [02-easter-egg-zumbis.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/02-easter-egg-zumbis.png)
  - [03-menu-h-buzina.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/03-menu-h-buzina.png)

---

## 5. Revalidação 20 m (Rodada de Correção de 24/11/2026)

Após a refatoração entregue pela Engenharia (`src/scene.js`, `src/easter-eggs.js`, `src/street-props.js`, `src/street-props-plan.js` e novos testes automatizados), realizou-se uma **nova rodada de homologação técnica minuciosa** com foco no reposicionamento do landmark monumental para 20 m e na resolução das ressalvas apontadas anteriormente.

### Tabela de Homologação da Revalidação 20 m

| Item Auditado | Status | Especificação & Evidências |
|---|:---:|---|
| **Landmark 20 m — Posição e Altura** | **APROVADO** | Reposicionado de `(-165, 0, -140)` para `(-150, 0, -75)`; altura ajustada de 48,0 m para **20,0 m** (`MURDOC_LANDMARK = { x: -150, z: -75, height: 20, radius: 5 }`), fora dos limites dirigíveis (`p.x + p.radius < WORLD_BOUNDS.minX`). |
| **Landmark 20 m — Olhos Âmbar e Contorno** | **APROVADO** | Identificação robusta do nó da cabeça via regex `isMurdocHead` compatível com variações de nomenclatura do Three.js (`murdoc_Murdoc_Head.smd` e `murdoc_Murdoc_Headsmd`). **2 olhos esféricos âmbar (`#d87746`) instanciados com sucesso**; contorno externo roxo (`#563c64`, `BackSide`, `fog: true`) ativo e integração à névoa atmosférica confirmada. |
| **Landmark 20 m — Visibilidade (3 Vistas)** | **APROVADO** | Três pontos de vista reais capturados em 1440x900 com marcação visual por anotação gráfica (círculo e seta) e classificação de visibilidade: **Av. Clint Eastwood** (*claramente visível*), **Av. Saturnz Barz** (*claramente visível*) e **Rua Song Machine** (*sutil*). |
| **Cartaz Save — Desobstrução Visual** | **APROVADO** | Aplicação da função `excludeTreesNear` em `street-props-plan.js`: árvores a menos de 4,5 m do cartaz `(106, -110)` foram suprimidas do plano de instanciamento. Linha de visão frontal 100% desobstruída e legível da pista. |
| **Folgas, Palcos e Histórias** | **APROVADO** | Folga livre da pista >= 5,9 m (exigência: >= 0,90 m); distância de todos os palcos >= 21 m (exigência: >= 16 m); distância a portais e descobertas >= 15 m; 0 obstruções visuais dos palcos ou dos 9 pontos de história. |
| **Passeio Guiado Autônomo** | **APROVADO** | Condução pelo asfalto: 100 amostras a 10 Hz com **0 saídas de pista** (`offTrack: 0`) e **0 colisões** (`collisions: 0`). |
| **Telemetria de FPS e Percentis (Janela Visível)** | **APROVADO** | Amostragem de quadros em 4 pontos críticos: **Mural 1** (60 FPS médio, p95: 58 FPS, p99: 58 FPS), **Palco Central** (60 FPS médio, p95: 58 FPS, p99: 58 FPS), **Centro da Cidade** (60 FPS médio, p95: 59 FPS, p99: 59 FPS) e **Perto do Landmark 20 m** (60 FPS médio, p95: 58 FPS, p99: 57 FPS). |
| **Peso Inicial de Rede e Console** | **APROVADO** | Peso transferido de **8,86 MB** (dentro do teto de 9,30 MB); **0 erros HTTP** (0 recursos 4xx/5xx); **0 erros no console do navegador**. |
| **Referências Editoriais e Licença Criativa** | **APROVADO** | `docs/gestao/easter-eggs-referencias.md` conferido (0 fontes da Wikipédia). Placa `M1-N4-STY` no Winnebago e `AVISO: ZUMBIS DO KONG STUDIOS` explicitamente sinalizadas como **licença criativa autoral do projeto** no código (`src/easter-eggs.js:46, 54`) e na documentação. |
| **Suíte de Testes Automatizados** | **APROVADO** | **212/212 testes PASS** em `npm test` (0 falhas); **50 módulos** validados com 100% de conformidade em `npm run check`. |

---

### Detalhamento das Evidências da Revalidação 20 m

#### 1. Três Pontos de Vista de Jogo do Landmark 20 m (com Anotação e Classificação)

As imagens a seguir foram capturadas na resolução de 1440x900 px em janela visível (`headless=False`) com aceleração WebGL2 ANGLE D3D11, simulando a condução real do jogador pela malha viária urbana:

1. **Av. Clint Eastwood (`x: -37.0, z: -54.0`, Heading: 1,43 rad):**
   - **Classificação:** **Claramente visível**
   - **Descrição:** O landmark monumental de 20 m projeta-se no quadrante superior esquerdo do campo visual, recortando a silhueta da cabeça e ombros contra o céu e a névoa, visível por cima dos telhados e vãos da avenida.
   - **Evidência:** [04-revalidacao-landmark-clint-eastwood-20m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/04-revalidacao-landmark-clint-eastwood-20m.png)

2. **Av. Saturnz Barz (`x: -57.0, z: -144.0`, Heading: 2,151 rad):**
   - **Classificação:** **Claramente visível**
   - **Descrição:** Olhando a noroeste em direção ao limite do mapa, o landmark de 20 m ergue-se com grande nitidez no centro-direita do enquadramento, com seu contorno roxo perfeitamente distinguível através da névoa.
   - **Evidência:** [04-revalidacao-landmark-saturnz-barz-20m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/04-revalidacao-landmark-saturnz-barz-20m.png)

3. **Rua Song Machine (`x: -36.0, z: -101.0`, Heading: 1,399 rad):**
   - **Classificação:** **Sutil**
   - **Descrição:** Entre as fachadas urbanas do cruzamento, o topo e a cabeça do landmark surgem sutilmente sobre o horizonte ao fundo, funcionando como um elemento instigante de exploração visual.
   - **Evidência:** [04-revalidacao-landmark-song-machine-20m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/04-revalidacao-landmark-song-machine-20m.png)

#### 2. Close-up de Depuração dos Olhos Âmbar, Contorno e Névoa

- Utilizando a câmera de depuração com `world.frameSpot({ x: -150, z: -75, dirX: 0.7, dirZ: 0.7, distance: 7.5, height: 17.5, target: 16.2 })`, inspecionou-se a face do Murdoc monumental a 7,5 metros de distância.
- **Resultado:** Os dois olhos esféricos em tom âmbar suave (`#d87746`, material `MeshBasicMaterial` com `fog: true`) estão perfeitamente posicionados nas órbitas faciais. A camada externa de contorno (`#563c64`, `THREE.BackSide`) cria o traço cartunesco escuro de Jamie Hewlett, mesclando-se harmoniosamente à névoa de cor `#202631`.
- **Evidência:** [04-revalidacao-murdoc-olhos-ambar-debug.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/04-revalidacao-murdoc-olhos-ambar-debug.png)

#### 3. Desobstrução do Cartaz Save US FROM HIM

- Inspecionado de frente com `world.frameSpot({ x: 106, z: -110, dirX: 0.65, dirZ: 0.75, distance: 6.2, height: 2.2, target: 1.8 })`.
- **Resultado:** Nenhuma árvore obstrui o enquadramento. A tipografia *"SAVE US / FROM HIM"* com borda verde-limão (`#99d46b`) apresenta contraste e leitura imediatos para quem trafega pela pista.
- **Evidência:** [04-revalidacao-cartaz-save-sem-arvore.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/04-revalidacao-cartaz-save-sem-arvore.png)

#### 4. Telemetria Estruturada da Revalidação

Os dados brutos coletados durante a execução do Chrome real foram persistidos em:
- [qa-revalidacao-20m-telemetria.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-24/qa-revalidacao-20m-telemetria.json)

---

## 6. Veredito Final de Homologação

A revalidação técnica de 20 m comprova que a Engenharia sanou 100% das ressalvas apontadas:
1. O landmark monumental de 20 m em `(-150, 0, -75)` está geometricamente equilibrado, visualmente marcante nas 3 vias principais e possui os olhos âmbar e contorno roxo plenamente renderizados.
2. O cartaz Save está desobstruído e legível.
3. As referências editoriais e licenças criativas estão documentadas e rotuladas de acordo com as diretrizes do projeto.
4. A performance mantém taxa de 57–60 FPS em janela visível, com 0 erros de console, 0 erros HTTP, 0 saídas do asfalto no passeio guiado e 212/212 testes unitários aprovados.

**HOMOLOGAÇÃO CONCLUÍDA: APROVADO PARA PRODUÇÃO (SHIP).**
