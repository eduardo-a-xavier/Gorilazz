# Roteiro de Apresentação para a Banca — Gorilazz A3 (26/11/2026)

- **Projeto:** *Gorilazz — Um mundo para descobrir* (experiência web interativa 3D acadêmica, sem vínculo oficial com os autores da obra original)
- **Equipe:** Eduardo Alves Xavier, Gedson de Souza Mancio Júnior e Rafael Machado Colnaghi
- **Universo original:** criado por Jamie Hewlett e Damon Albarn ([gorillaz.com](https://www.gorillaz.com/))
- **Duração planejada:** **13 minutos** (faixa exigida: 10 a 15 minutos — sobram 2 minutos de margem para imprevistos ou transições ao vivo)
- **Data da verificação dos dados:** 25/11/2026 (`HEAD` local em `E:\Gorilazz-Relatorio`, `npm run check` com 52 arquivos OK e `npm test` com `275/275 PASS`)

---

## Preparação 5 minutos antes da banca (Checklist)

1. Abrir o site publicado no GitHub Pages (ou localmente com `npm run dev` em `http://localhost:3000` como plano B se o Wi-Fi da sala oscilar — a cena 3D, o mapa, a Kong FM e os dois minigames funcionam 100% locais; apenas clipes do YouTube e prévias do Sketchfab dependem de internet).
2. Abrir em janela anônima ou limpar `localStorage` para o contador começar em `DESCOBERTAS: 0 / 9` e mostrar o onboarding inicial limpo.
3. Deixar o zoom do navegador em **100%**, volume do sistema em ~**50%** (o áudio só inicia após clique/interação, sem autoplay) e fechar abas pesadas para garantir fluidez.
4. Deixar uma segunda aba pronta no repositório/terminal (ou no `REFERENCES.md`) caso a banca peça para ver código, `npm test` ou tabela de licenças e hashes SHA-256.

---

## Cronograma Geral (13 min)

| Bloco | Responsável | Tempo | Duração | Foco principal |
| :--- | :--- | :---: | :---: | :--- |
| **Abertura** | Integrante 1 | `00:00 – 00:45` | 45 s | Apresentação da equipe, proposta acadêmica e recorte 1998–2023 |
| **Bloco 1** | **Integrante 1** | `00:45 – 04:45` | 4 min | Visão do projeto, UX, HUD, 9 descobertas, Kong FM, Fliperama + Piano do 2-D, responsividade |
| **Bloco 2** | **Integrante 2** | `04:45 – 08:45` | 4 min | Arquitetura web (ES Modules + Three.js), GitHub Pages, câmeras, física arcade do Geep, Passeio Guiado |
| **Bloco 3** | **Integrante 3** | `08:45 – 12:15` | 3 min 30 s | Áudio Web Audio (motor 4 marchas, pombos, palcos, ducking), pipeline de assets (Blender/Kenney/WebP/InstancedMesh/SHA-256) e dificuldades reais + QA |
| **Fechamento** | Integrante 3 (com 1 e 2) | `12:15 – 13:00` | 45 s | Síntese dos resultados, limites honestos e abertura para perguntas |

---

## Roteiro Detalhado e Cronometrado

### Abertura (`00:00 – 00:45` · Integrante 1)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `00:00 – 00:45` | Manter a **tela inicial (Hero)** aberta (`NÃO É SÓ UMA BANDA. É UM UNIVERSO.`), sem clicar ainda, deixando visíveis os dois botões principais (*Quero dirigir* e *Fazer um passeio guiado*) e o link *Prefiro conhecer a história*. | “Bom dia / boa tarde, banca. Nós somos Eduardo Alves Xavier, Gedson de Souza Mancio Júnior e Rafael Machado Colnaghi, e este é o nosso projeto da A3: **Gorilazz — Um mundo para descobrir**. Em vez de fazer um site estático tradicional sobre a banda virtual criada por Jamie Hewlett e Damon Albarn, nós construímos uma experiência web interativa em 3D que une exploração livre de carro e curadoria editorial, cobrindo o recorte histórico de **1998 a 2023**. Vamos dividir a apresentação em três partes: eu mostro a experiência do usuário e os recursos interativos; em seguida o [Integrante 2] explica a arquitetura web, câmeras, física e o passeio guiado; e o [Integrante 3] fecha com áudio procedural, pipeline de assets 3D e os desafios reais de engenharia e qualidade.” |

---

### Integrante 1 — Visão do Projeto, UX e HUD (`00:45 – 04:45` · 4 min)

#### 1.1 Entrada, conceito por eras e HUD limpa (`00:45 – 01:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `00:45 – 01:15` | Clicar em **`Quero dirigir ↗`** (`#enter-world`). Se aparecer o diálogo *Você está no volante*, mostrar rapidamente os atalhos e clicar em **`Começar a dirigir`**. Acelerar um pouco com **`W`** e virar com **`A` / `D`** na saída de Kong Studios. | “Logo na entrada, quem prefere só ler pode descer direto para a seção editorial, sem precisar jogar. Clicando em *Quero dirigir*, entramos no mundo aberto compacto inspirado nas fases do Gorillaz. A cidade organiza a história em quatro bairros/atos visuais — da explosão inicial em Kong Studios até Plastic Beach, o hiato e a reinvenção — e a HUD foi desenhada para ficar limpa: velocímetro, minimapa no canto, contador de descobertas e o menu **`[H] Controles`** recolhido para não poluir a tela.” |
| `01:15 – 01:45` | Pressionar **`V`** para entrar na **cabine em 1ª pessoa**, mover o mouse/arrastar para olhar e pressionar **`C`** para centralizar; depois pressionar **`V`** novamente para voltar à 3ª pessoa. | “Com a tecla **`V`**, alternamos instantaneamente entre 3ª pessoa e a cabine em 1ª pessoa dentro do próprio Geep, com retrovisor funcional e volante animado. Se eu arrastar a visão, **`C`** centraliza de volta. Também há **`F`** para tela cheia e uma pilha de prioridade na tecla **`Esc`** que fecha modais, minigames e mapa sem derrubar a tela cheia.” |

#### 1.2 Mapa (`M`), 9 pontos de descoberta e Central de Descobertas (`01:45 – 02:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `01:45 – 02:15` | Pressionar **`M`** para abrir o **Mapa Tático completo**. Passar o mouse pela legenda (4 portais de ato, 5 histórias, 4 integrantes) e fechar com **`M`** ou **`Esc`**. | “Pressionando **`M`**, abrimos o mapa completo da ilha. O progresso do site funciona em torno de **9 descobertas**: são **4 portais de era** e **5 pontos de história** espalhados pelas ruas, marcados no contador **`DESCOBERTAS: X / 9`** e salvos em `localStorage`. Os **4 palcos dos integrantes** — 2-D, Murdoc, Noodle e Russel — ficam sinalizados como losangos no mapa e abrem fichas biográficas com visualizador 360°, separando sempre o que é fato histórico real do que é ficção da banda.” |
| `02:15 – 02:45` | Dirigir até a primeira parada próxima (*Duas mentes, um universo*, à frente em Kong Studios), parar e pressionar **`E`** para abrir a ficha; mostrar rapidamente o crédito/fonte e fechar com **`Esc`**. Em seguida, clicar no contador **`DESCOBERTAS: 1 / 9`** para abrir a **Central de Descobertas** (mostrar filtros/busca) e fechar com **`Esc`**. | “Ao parar perto de um ponto luminoso e apertar **`E`**, abrimos a ficha da descoberta — nada abre sozinho só por passar correndo. E clicando no contador de descobertas, o usuário acessa a **Central de Descobertas**, com as 9 fichas verificadas em fontes jornalísticas e oficiais, com busca e filtros por tema, podendo traçar rota até qualquer ponto.” |

#### 1.3 Rádio Kong FM, Fliperama e Minigame Rítmico do 2-D (`02:45 – 04:05`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `02:45 – 03:15` | Clicar no botão **`▶`** da **Kong FM** no HUD (ou entrar em 1ª pessoa `V` e apertar **`R`** para focar o console do rádio) e usar **`]`** para trocar de faixa. Pausar ou deixar em volume baixo. | “A trilha sonora fica na **Kong FM**, que sempre começa pausada por respeito ao usuário. Ela reúne **5 faixas**: 3 gravações completas do Gorillaz mantidas sob demanda para uso acadêmico ilustrativo (*Clint Eastwood*, *Feel Good Inc.* e *On Melancholy Hill*) e 2 instrumentais originais do projeto (*Concreto* e *Maré de plástico*), além da opção de carregar arquivos de áudio do próprio aparelho. As teclas **`[` e `]`** trocam de faixa sem tirar a mão do volante.” |
| `03:15 – 03:40` | Parar diante do gabinete **KONG ARCADE** (ao lado de Kong Studios, ponto `(-13.5, -10)` com anel rosa no chão) e apertar **`E`**. Mostrar a tela do **Fliperama (*Coletor do labirinto*)**, clicar em **`Jogar`** por ~5 segundos (setas/`WASD`), apontar a meta de 117 pontos e o **Top 5** local, e fechar com **`Esc`**. | “Para enriquecer a exploração, criamos **dois minigames** distintos dentro do mapa. Aqui ao lado de Kong Studios fica o **Fliperama Kong Arcade**: um jogo de labirinto com 117 pontos e placar **Top 5** salvo localmente no navegador.” |
| `03:40 – 04:05` | Abrir a ficha do **2-D** (pelo palco ou clicando no card do 2-D na seção *A Banda* / mapa) e clicar em **`TOCAR PIANO (MINIGAME RÍTMICO)`**. Clicar em **`Começar`**, tocar algumas notas nas teclas **`D`, `F`, `J`, `K`** por ~10 segundos e fechar com **`Esc`**. | “Já na ficha do **2-D**, abrimos o segundo minigame: o **Teclado do 2-D**, um jogo rítmico em 4 pistas (`D`, `F`, `J`, `K` ou toque na tela). Ele usa áudio 100% sintetizado em Web Audio nos BPMs de referência pesquisados de *Tomorrow Comes Today* (93 BPM), *Clint Eastwood* (84 BPM) e *On Melancholy Hill* (120 BPM) — e, reparem, ele pausa automaticamente a Kong FM enquanto tocamos e devolve o rádio ao sair.” |

#### 1.4 Responsividade, acessibilidade e transição (`04:05 – 04:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `04:05 – 04:45` | Rolar rapidamente para baixo (ou clicar em *A História* / *A Banda*) mostrando a seção editorial (8 eras com abas Fato vs. Ficção e cartões dos integrantes) e, opcionalmente, citar os controles móveis (sem precisar abrir DevTools se o tempo estiver justo; ou mostrar rapidamente a barra de pedais de toque). | “Abaixo do cenário 3D, toda a camada editorial — 8 eras musicais, 9 olhares e a garagem de créditos — continua acessível sem depender do 3D. No celular, testamos em emulação de `390×844` e `320×568` com pedais simultâneos multitoque, perfil gráfico leve automático e fallback 2D caso o navegador não tenha WebGL. Agora passo para o **[Integrante 2]**, que vai explicar como montamos a arquitetura web, as câmeras, a física do Geep e o Passeio Guiado.” |

---

### Integrante 2 — Arquitetura Web e Motor 3D (`04:45 – 08:45` · 4 min)

#### 2.1 Arquitetura ES Modules, Three.js local e Deploy Estático (`04:45 – 05:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `04:45 – 05:45` | Voltar ao topo (`#jogo`) ou abrir rapidamente a aba do repositório mostrando `index.html`, `src/` e `.github/workflows/pages.yml` (ou permanecer no site 3D em movimento suave). | “Obrigado, [Integrante 1]. Do ponto de vista de arquitetura, fizemos uma escolha deliberada: **JavaScript moderno em ES Modules nativos**, HTML5 e CSS3, sem framework pesado e sem etapa de bundler. O motor 3D é o **Three.js 0.180.0** versionado localmente em `src/vendor/` sob licença MIT. O projeto hoje é organizado em **52 módulos JavaScript** verificados no `npm run check`, separando claramente lógica pura testável em Node — como `driving.js`, `navigation.js`, `guided-tour.js` e `world-data.js` — da camada visual em `scene.js` e `app.js`. Para publicar no **GitHub Pages**, criamos um workflow em `.github/workflows/pages.yml` que primeiro roda toda a verificação de sintaxe e os testes automatizados, depois lê a lista explícita de rotas do `server.mjs` e empacota exatamente **161 arquivos estáticos** em `_site` com `.nojekyll` — garantindo que `docs/`, relatórios de QA e testes nunca sejam publicados no site final.” |

#### 2.2 Máquina de estados das câmeras (`05:45 – 06:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `05:45 – 06:45` | No 3D, demonstrar em sequência: (1) **3ª pessoa** passando próximo a um prédio para mostrar o braço da câmera encurtando sem atravessar paredes; (2) clicar no botão **`↻ CÂMERA ORBITAL`** (ou menu `◉` → **`◎ VER MUNDO`** e **`✦ VER MOINHO`**); (3) pressionar **`V`** para **1ª pessoa (cockpit)**, virar o volante com `A/D` e segurar **`L`** por 2 s para olhar para o céu (Murdoc Lunar); (4) voltar com **`V`**. | “Um dos pontos mais sensíveis de um mundo 3D urbano é a câmera. Em `src/scene.js`, implementamos uma máquina de modos de câmera que cobre: **3ª pessoa de viagem** com detecção antecipada de obstáculos — o braço mede o corredor à frente do carro em ~0,45 s, encurta rápido antes de encostar em prédios e recua suavemente sem oscilação; **1ª pessoa no cockpit (`V`)**, posicionada dentro do próprio modelo do Geep com volante real, braços por cinemática inversa e retrovisor renderizado em `256×96 px` a cada três quadros; além dos modos **Câmera Orbital**, **Vista Aérea (*Ver mundo*)**, **Foco no Moinho** e **olhar para o céu (`L`)**. Também garantimos persistência de modo: se o jogador está em 1ª pessoa e escolhe um destino no mapa, a câmera respeita essa escolha sem forçar a volta para 3ª pessoa.” |

#### 2.3 Física arcade do Geep (`06:45 – 07:35`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `06:45 – 07:35` | Em 3ª pessoa, acelerar com **`W`**, fazer uma curva segurando **`Espaço`** (drift no asfalto), sair brevemente para a grama/terra para mostrar a perda de velocidade, parar com **`S`**, soltar e apertar **`S`** de novo para engatar a **marcha à ré**. | “A física do Geep em `src/driving.js` roda em **passos fixos determinísticos de 1/120 de segundo**, desacoplados da taxa de quadros do monitor — assim o carro se comporta igual a 30 ou 60 FPS. Ela é arcade por escolha de jogabilidade: tem inércia ao soltar o acelerador, diferença real de atrito e teto de velocidade entre **asfalto** (até ~108 km/h) e **terra** (~61 km/h), **drift controlado** com `Espaço` no asfalto, **ré deliberada** limitada a 15 km/h — só engata depois de parar, soltar e apertar o freio de novo — e **suspensão vertical independente** nas quatro rodas em `src/scene.js` compensando inclinação lateral (*roll*) e longitudinal (*pitch*) nas curvas.” |

#### 2.4 Passeio Guiado (Catmull-Rom, look-ahead e paradas) e transição (`07:35 – 08:45`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `07:35 – 08:45` | Clicar em **`▶ Fazer passeio guiado`** (ou no botão `#tour-toggle` na barra superior). Deixar o Geep percorrer uma curva e chegar à próxima parada (mostrando a câmera cinematográfica e o card de parada por ~4,5 s). Em seguida, apertar **`W`** ou **`A`** para mostrar a retomada imediata do volante pelo jogador. | “Por fim, para quem quer conhecer o universo sem precisar dirigir o tempo todo, construímos o **Passeio Guiado** (`src/navigation.js` e `src/guided-tour.js`). A malha viária tem 8 nós e 11 ruas; o sistema calcula a menor rota por grafo e suaviza cada curva com **spline Catmull-Rom**, validando que 100% dos pontos permanecem sobre o asfalto. Durante o trajeto, o carro segue um ponto de **look-ahead dinâmico** entre `6,0` e `10,5 m`, lê a curvatura dos próximos `24 m` para frear antes de curvas fechadas e mantém cruzeiro entre `55` e `65 km/h` nas retas. Ao chegar em cada uma das **9 paradas**, ele desacelera suavemente, exibe o card editorial por `4,5 s` com câmera em órbita — e basta tocar em qualquer tecla de direção (`WASD` ou setas) para assumir o controle imediatamente. Agora passo para o **[Integrante 3]**, que cuida do áudio, dos assets 3D e da nossa bateria de testes e QA.” |

---

### Integrante 3 — Áudio, Pipeline de Assets e QA (`08:45 – 12:15` · 3 min 30 s)

#### 3.1 Áudio procedural, espacialização e ducking (`08:45 – 09:50`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `08:45 – 09:50` | Com a Kong FM ligada em volume moderado, acelerar o Geep em linha reta para a banca ouvir o ronco do motor subindo de giro/marcha; passar próximo a um **palco de integrante** (ex.: 2-D ou Murdoc) para demonstrar o volume da Kong FM abaixando suavemente e o pulso grave das caixas aparecendo; opcionalmente dar um toque em **`G`** (buzina). | “Obrigado, [Integrante 2]. Toda a camada sonora interativa foi sintetizada no navegador via **Web Audio API** (`src/discovery-sound.js`), sem pesar o site com dezenas de WAVs. O motor do Geep combina três camadas harmônicas — onda *sawtooth* fundamental, *triangle* sub-harmônica e *square* de combustão — passando por um filtro passa-baixas com simulação de **4 marchas virtuais** (de 850 a 4.000 RPM) conforme a velocidade. Nas praças, sintetizamos o arrulho ambiente de pombos em raio de `30 m`; e nos palcos dos integrantes, aplicamos **atenuação espacial quadrática por distância** (raio de `34 m`) para o grave das caixas de som. Para nada brigar no ouvido, implementamos **ducking em duas frentes**: ao se aproximar de um palco (entre `18 m` e `9 m`), a Kong FM reduz suavemente até 35% sem alterar o volume escolhido pelo usuário; e, quando o Teclado do 2-D abre, `radio-duck.js` pausa a rádio e a retoma automaticamente ao sair.” |

#### 3.2 Pipeline de assets 3D, otimização e licenças (`09:50 – 11:00`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `09:50 – 11:00` | Parar perto de um palco (ex.: Murdoc ou Noodle com baixo/guitarra novos) e girar a câmera mostrando árvores, bancos, postes, carros estacionados e outdoors. Se a aba de `REFERENCES.md` estiver aberta, mostrar rapidamente a tabela de licenças e hashes SHA-256 (ou abrir a seção *Garagem 3D / Créditos* no rodapé do site). | “No pipeline de assets, combinamos autoria própria, curadoria aberta e otimização agressiva para rodar liso no navegador. O Geep (shabaev) e a banda Phase 7 (Redtricity) são creditados sob **CC BY 4.0**, com a banda otimizada via `gltf-transform` para `3,41 MB` com texturas WebP de `1024 px`; o SUV da **Kenney** (`CC0`) entra como fallback automático caso o Geep falhe; e o piloto deriva da base **Quaternius** (`CC0`) com acessórios autorais. Além disso, modelamos **22 modelos `.glb` originais em Blender** sob licença **CC0 1.0** em `assets/models/scenery/` — árvores, arbustos, rochas, bancos, postes, carros estacionados, pombos, caixas de som, fliperama e instrumentos — carregados de forma *lazy* após entrar no 3D usando **`InstancedMesh`** para economizar *draw calls*. Também convertemos artes de murais/outdoors (`19` arquivos em `assets/art/`) e materiais de superfície (`15` arquivos em `assets/materials/`) para **`.webp`**, e registramos **origem, licença e hash SHA-256** de cada arquivo em `REFERENCES.md` — inclusive removendo dois modelos antigos cuja procedência não era comprovável.” |

#### 3.3 Dificuldades reais superadas e QA (`11:00 – 12:15`)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `11:00 – 12:15` | Mostrar rapidamente o cockpit em 1ª pessoa (`V`) girando o volante para a esquerda e direita (evidenciando as mãos do Piloto v6 no aro) e, se desejado, exibir o terminal ou o resumo dos testes (`275/275 PASS`). | “Quero destacar quatro dificuldades reais que enfrentamos e como resolvemos cada uma com engenharia:  
1. **Subcaminho `/Gorilazz/` no GitHub Pages:** caminhos absolutos funcionavam em `localhost`, mas quebravam em produção; padronizamos tudo para caminhos relativos (`./`), criamos o teste `tests/pages-paths.test.mjs` e validamos localmente sob `/Gorilazz/` com **146/146 requisições HTTP 200/304 e zero 404**.  
2. **Peso do projeto:** chegamos a ter **56,35 MB** só em `assets/` (e mais de **81 MB** rastreados no repositório com evidências). Na faxina final, removemos PNGs duplicados e GLBs legados, reduzindo `assets/` para **28,91 MB** — e o pacote estático inteiro publicado no Pages ficou em **30,53 MB** (sendo `11,41 MB` os três MP3s completos mantidos sob demanda por decisão editorial, sem impactar a carga inicial do 3D, que ficou em **8,58 MB**, abaixo do teto de `9,3 MB`).  
3. **Cockpit e mãos no volante:** foi a parte visual mais trabalhosa; passamos por seis iterações do piloto até o **`driver-pilot-v6.glb`**, ajustando simetria nas curvas (`<= 0,36 cm` de diferença palma-aro), acabamento fosco e deslocamento do rádio no painel.  
4. **Qualidade e desempenho:** mantivemos **275 de 275 testes automatizados passando** em Node puro (`npm test`) e validação em Chrome real WebGL2 batendo **60 FPS** estáveis (`60,0–60,1 FPS` nos três pontos principais, com zero erros de console e resolução adaptativa para máquinas mais simples).” |

---

### Fechamento (`12:15 – 13:00` · Integrante 3, com abertura para Integrantes 1 e 2)

| Tempo | Ação exata na tela ao vivo | Fala-guia natural |
| :---: | :--- | :--- |
| `12:15 – 13:00` | Deixar o carro parado em um enquadramento bonito (ex.: Mirante do Moinho ou vista de Kong Studios em 3ª pessoa, ou voltar à tela inicial). | “Para fechar com transparência acadêmica: o projeto está entregue, testado e publicado como site estático leve, mas também documentamos com honestidade o que ficou fora do escopo ou pendente — como artes de livros fechados (*Rise of the Ogre* e *Gorillaz Almanac*), LOD avançado para props instanciados e testes em aparelhos celulares físicos além da emulação em Chromium. Obrigado pela atenção da banca; estamos à disposição para perguntas e podemos navegar ao vivo em qualquer parte do sistema que vocês quiserem ver.” |

---

## Tabela de Verificação Factual (Pedido vs. Repositório Real)

Cada afirmação técnica presente no pedido original foi conferida diretamente nos arquivos, no histórico Git e nos relatórios de evidências em **25/11/2026**. Use na apresentação **apenas** os valores da coluna **"Valor verificado para falar na banca"**.

| Afirmação do pedido | Status | Valor verificado para falar na banca | Fonte real no repositório |
| :--- | :---: | :--- | :--- |
| **9 pontos de descoberta / eras** | **Confirmado (com detalhe)** | O contador `DESCOBERTAS: X / 9` soma **4 portais de era** + **5 pontos de história**. Os 4 palcos dos integrantes abrem ficha biográfica 360° e **não** somam no `X/9`. | `src/guided-tour.js` (`TOUR_TOTAL = 9`), `src/world-data.js`, `src/discoveries-lore.js`, `README.md` |
| **Minigame de ritmo do Fliperama** | **Ajustado (são 2 jogos)** | São **dois minigames distintos**: (1) **Fliperama KONG ARCADE** (*Coletor do labirinto*, 117 pts, Top 5 local) perto de Kong Studios; (2) **Teclado do 2-D** (minigame rítmico em 4 pistas `D/F/J/K`, áudio Web Audio) aberto pela ficha do 2-D. | `src/arcade.js`, `src/arcade-screen.js`, `src/piano-game.js`, `src/piano-screen.js`, `index.html` |
| **Rádio Kong FM e MP3s inteiros** | **Confirmado** | 5 faixas: 3 MP3s completos do Gorillaz em `assets/audio/` (`11,41 MB` no total, carregados sob demanda com `preload='none'`, mantidos por decisão do Eduardo para uso acadêmico) + 2 instrumentais originais em `assets/radio/` (`0,15 MB`) + importação local. | `src/local-radio.js`, `REFERENCES.md`, `docs/gestao/evidencias/fechamento-final-2026-11-26/relatorio_congelamento_final.md` |
| **JS moderno (ES Modules) + Three.js + GitHub Pages** | **Confirmado** | ES Modules nativos (`"type": "module"`), sem bundler; **Three.js 0.180.0** local (`src/vendor/`, MIT); **52 arquivos** verificados em `npm run check`; deploy estático em `.github/workflows/pages.yml` copiando **161 arquivos** de `server.mjs` para `_site` (sem `docs/`). | `package.json`, `REFERENCES.md`, `.github/workflows/pages.yml`, `server.mjs` |
| **Máquina de estados das câmeras** | **Confirmado (com detalhe)** | 3ª pessoa (`follow` com detecção antecipada de paredes), 1ª pessoa (`V`, cockpit real do Geep + retrovisor `256×96`), Câmera Orbital, Vista Aérea (*Ver mundo*), Foco no Moinho, Olhar pro céu (`L`) e órbita do Passeio Guiado; modo 1ª/3ª preservado ao navegar pelo mapa. | `src/scene.js`, `src/cabin.js`, `src/app.js`, `README.md` |
| **Física arcade do Geep** | **Confirmado** | Passo fixo `1/120 s`, inércia, asfalto (`30 m/s` ≈ `108 km/h`) vs. terra (`17 m/s` ≈ `61 km/h`), ré deliberada (`15 km/h`), drift no asfalto (`Espaço`), colisões simplificadas e suspensão vertical independente nas 4 rodas (*roll*/*pitch*). | `src/driving.js`, `src/vehicle-motion.js`, `src/scene.js`, `README.md` |
| **Passeio Guiado (Catmull-Rom, look-ahead, paradas)** | **Confirmado** | Grafo de 8 nós / 11 ruas, spline **Catmull-Rom** 100% no asfalto, **look-ahead dinâmico** (`6,0–10,5 m`), leitura de curva em `24 m`, cruzeiro `~55–65 km/h` (`16,5 m/s`), pausa de `4,5 s` nas 9 paradas e retomada imediata no `WASD`/setas. | `src/navigation.js`, `src/guided-tour.js` |
| **Motor de 4 marchas via Web Audio** | **Confirmado** | `engineRpmForSpeed(kph)` modela **4 marchas virtuais** (`1ª–4ª`, `850–4000 RPM`) com 3 camadas (*sawtooth*, *triangle*, *square*) e filtro passa-baixas. | `src/discovery-sound.js` (linhas 54–126) |
| **Pombos via Web Audio e áudio posicional nos palcos** | **Confirmado (detalhe técnico)** | Pombos: arrulho senoidal com atenuação quadrática em raio de `30 m` das praças. Palcos: pulso grave filtrado com **atenuação espacial quadrática por distância** (raio `34 m`) — não usa `PannerNode` HRTF 3D, e sim ganho por distância. | `src/discovery-sound.js` (linhas 66–72, 128–148) |
| **Ducking do Kong FM** | **Confirmado** | Em 2 camadas: (1) perto dos palcos (`18 m` a `9 m`), reduz volume suavemente até `35%` (`DUCK_LEVEL = 0.35`) via `setDuck()`; (2) no Teclado do 2-D, `createRadioDuck` pausa o rádio e retoma ao sair. | `src/guided-tour.js` (linhas 82–94), `src/local-radio.js`, `src/radio-duck.js` |
| **Assets CC0 próprios no Blender + InstancedMesh** | **Confirmado** | **22 modelos `.glb` originais** em `assets/models/scenery/` (`1,42 MB`), criados em Blender sob **CC0 1.0 Universal**, carregados de forma *lazy* com `InstancedMesh` e fallback automático. | `assets/models/scenery/REFERENCES-scenery.md`, `REFERENCES.md`, `README.md` |
| **Kenney** | **Confirmado** | `kenney-suv.glb` (Kenney Car Kit 3.1, CC0 1.0) mantido como veículo alternativo/fallback do Geep. (`kenney-suv-luxury.glb` foi removido na faxina final.) | `REFERENCES.md`, `git show --stat 9e2f1a7` |
| **Conversão para `.webp`** | **Confirmado (parcial, especificar)** | **19 artes** em `assets/art/*.webp` (`1,41 MB`), **15 texturas/normal maps** em `assets/materials/*.webp` (`3,43 MB`, PNGs antigos removidos) e texturas WebP embutidas em `gorillaz-phase7-web-v3.glb`. *(Capas em `assets/covers/` seguem JPG e retratos em `assets/portraits/` seguem PNG.)* | `assets/art/`, `assets/materials/`, `REFERENCES.md`, `git show --stat 9e2f1a7` |
| **Hashes SHA-256** | **Confirmado** | Hashes SHA-256 documentados para modelos, piloto v6, banda, artes WebP, capas, fontes, áudios e os 22 GLBs de cenário. | `REFERENCES.md`, `assets/models/scenery/REFERENCES-scenery.md` |
| **Redução de peso (`>85 MB para ~30 MB`)** | **Ajustado** | **Não usar ">85 MB"**: no histórico Git, a pasta `assets/` caiu de **56,35 MB** (131 arquivos) para **28,91 MB** (103 arquivos; `30,31 MB` decimais). O site estático completo (`_site`, 161 arquivos) tem **30,53 MB**; o repo rastreado inteiro (com `docs/` que não vai ao Pages) caiu de **81,38 MB** para **63,67 MB**; e a carga inicial real no 3D foi medida em **8,58 MB**. | `git ls-tree` em `9e2f1a7~1` vs. `HEAD`, `relatorio_congelamento_final.md`, `qa-rodada-final-relatorio.md` |
| **275 testes** | **Confirmado** | `npm test` executado em 25/11/2026: **`275/275 PASS`** (`0` falhas, `~5,6 s`). `npm run check`: **52 arquivos OK**. | Execução direta `npm test` e `npm run check` em 25/11/2026 |
| **60 FPS** | **Confirmado (com contexto)** | Medido em Chrome real WebGL2 desktop (`60,0–60,1 FPS`, `p95 17,0 ms`, `0` quadros `> 33 ms`). No celular há limite intencional de ~30 FPS e perfil adaptativo (`Auto`/`Desempenho`/`Ultra`). | `docs/gestao/evidencias/correcao-qa-2026-11-23/qa-rodada-final-relatorio.md`, `README.md` |

### O que não pôde ser confirmado (manter transparência se a banca perguntar)

- **Desempenho e toque em aparelho físico (Android/iOS):** validado em Chrome real desktop e emulação móvel (`390×844` e `320×568`), sem medição em smartphone físico.
- **Leitor de tela real:** marcações ARIA e acessibilidade por teclado foram implementadas e revisadas, mas sem teste auditado com NVDA/VoiceOver real.
- **Licença formal separada dos 2 instrumentais em `assets/radio/`** (`concreto.mp3`, `mare.mp3`) e **permissão de redistribuição pública dos 3 MP3s comerciais** fornecidos para uso acadêmico ilustrativo em `assets/audio/` — ambos registrados com transparência em `REFERENCES.md`.
- **Origem do número ">85 MB":** o máximo rastreado encontrado no Git foi `81,38 MB` no repositório inteiro (incluindo `docs/`) e `56,35 MB` em `assets/`; provavelmente `>85 MB` incluía pastas locais não versionadas ou arquivos temporários, por isso o roteiro cita apenas os números comprováveis no Git.

---

## Respostas Rápidas para Possíveis Perguntas da Banca

- **“Por que não usaram React ou Vite?”** — Para manter zero dependências de build/runtime, carregamento direto via ES Modules nativos no navegador e testes rápidos em Node puro (`257` testes em ~5,6 s), facilitando o deploy estático reproduzível no GitHub Pages.
- **“Como garantiram a parte de direitos autorais e créditos?”** — Todo asset externo tem autor, link, licença e hash SHA-256 em `REFERENCES.md` e nos arquivos `*-CREDITS.txt`; removemos dois modelos cuja licença não comprovava autorização; as 9 fichas e os easter eggs distinguem fatos reais de ficção sem usar Wikipédia; e os 3 MP3s são de uso estritamente acadêmico/ilustrativo, carregados sob demanda.
- **“E se o computador do usuário for fraco ou não tiver WebGL?”** — O site tem 3 perfis de qualidade (`Auto`, `Desempenho`, `Ultra`) com ajuste dinâmico de resolução conforme o tempo de quadro; e, se o WebGL falhar, o mapa 2D, o diário, a Kong FM e todo o conteúdo editorial continuam funcionando.
