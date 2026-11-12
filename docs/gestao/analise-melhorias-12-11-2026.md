# Análise de pontos de melhoria — Gorilazz A3 — 12/11/2026

Pedido: Eduardo, por meio de maricota. Responsável: Gorilazz Central. Prazo registrado: **30/11/2026**.
Modo: **somente leitura**. Nenhum código foi alterado, nenhum teste foi executado, o servidor não foi reiniciado e não houve commit, push ou publicação. O único arquivo escrito é este relatório.

## Legenda

- **[F✔] Fato verificado pela Central hoje**: conferido diretamente no repositório, no Git ou no servidor em 12/11/2026, entre 18h e 19h (BRT).
- **[F↗] Fato relatado**: está registrado na evidência de um especialista, com logs e capturas; a Central leu a evidência, mas não repetiu a medição nem o teste.
- **[I] Interpretação**: julgamento da Central a partir dos fatos acima.

Estado do repositório no momento da leitura [F✔]:
- HEAD `307713b` (GZ-09), em `main`, igual a `origin/main`. O repositório no GitHub `eduardo-a-xavier/Gorilazz` é **público**.
- Há mudanças não commitadas: `src/scene.js` e `docs/gestao/MODELOS.md` modificados; `tests/driver.test.mjs` e `docs/gestao/evidencias/motorista-geep-2026-11-12/` não rastreados. Esse é o trabalho do boneco do Geep, que ainda aguarda o commit de Eduardo.
- O servidor da porta 3000 é o **PID 22696**, iniciado em 12/11/2026 às 15:16:30. O PID 19020, citado em pedidos anteriores, já não existe.

---

## 1. Estado atual

| Item | O que está pronto | Verificado | Só relatado / pendente |
| --- | --- | --- | --- |
| **GZ-03** diário × eras | Uma linha de `src/app.js` faz o diário exibir “Região · Ato espacial” com o mesmo cálculo da ficha. | [F✔] Está no código commitado; o diff tem uma linha. | [F↗] As capturas antes/depois têm resoluções diferentes. Não houve jornada completa nem diário preenchido. A regra editorial entre 8 eras, 4 atos, 3 regiões e 5 descobertas continua sem definição. **Em revisão.** |
| **GZ-04** fatos e fontes | Inventário da **primeira era (1998–2001)**, com fontes diretas, e `src/content.js` revisado: “em Londres” saiu da frase de criação. | [F✔] O documento `evidencias/fontes-e-creditos/gz-04-primeira-era.md` existe. | Faltam as outras **7 eras**. [F✔] `index.html` ainda diz “Londres, 1998” e “criada em Londres, em 1998” nas linhas 19, 30 e 33, inclusive no `<noscript>`. Isso contradiz a decisão de GZ-04. [I] O JavaScript pode substituir parte desse texto em tempo de execução, mas o `<noscript>` e o primeiro quadro exibem a versão antiga. Há uma cópia duplicada e mais antiga em `evidencias/fontes-creditos/`. **Em revisão.** |
| **GZ-05** diorama | O Jardim de frequências, original e sem personagens, substituiu o diorama. Eduardo removeu o GLB e atualizou `CREDITS.txt` e `manifest.json` no commit `181eece`. | [F✔] `assets/environment/noodle-diorama.glb` não está no disco nem no HEAD. [F✔] A URL antiga retorna **404** no PID 22696. [F✔] `CREDITS.txt` registra “REMOVIDO DA DISTRIBUIÇÃO em 12/11/2026”. | [F✔] **Ainda restam pendências:** (a) o texto de créditos visível em `index.html` mantém “O diorama da Noodle vem de uma publicação do Sketchfab… o crédito completo será acrescentado aqui”; (b) o `README.md`, linha 136, ainda cita o diorama em “Modelos densos ao longe”; (c) o GLB continua no **histórico público** do GitHub, nos commits `2c709f7` e `181eece`; (d) `docs/visual/mirante-noodle.jpg`, uma captura do diorama, continua versionada. [F↗] Os registros indicam 45/45 testes. |
| **GZ-08** regiões | Estúdio, costa e mirante ganharam pisos distintos: 538 triângulos, sem texturas e sem aumentar o mapa. | [F✔] As mudanças estão commitadas, com evidência e diff. | [F↗] Seis capturas aéreas de diagnóstico e 46/46 testes. Ninguém verificou se as áreas são reconhecíveis **ao dirigir**, nem se há tremulação no piso (*flicker*) em celular. |
| **GZ-09** Kong FM × clipes | Os rótulos separam o áudio local da Kong FM, o player incorporado, os links externos e a busca. O status de erro da rádio ficou separado. | [F✔] Commit `307713b`. | [F↗] Funcionaram tocar/pausar, abrir/fechar o iframe sem autoplay, a busca em nova aba e o atalho no celular emulado. **Ainda não foram testados:** a reprodução completa no YouTube, porque o DNS falhou no ambiente; a importação de um arquivo real; um arquivo inválido; os controles 3D da cabine; e leitor de tela. |
| **Boneco do Geep** | O ocupante procedural foi refinado: 2.228 triângulos e 11 malhas. Ele reage com a cabeça por 0,8 s a hover ou clique, apenas com o carro parado e sem movimento reduzido. | [F✔] O diff está no disco, **ainda sem commit**. [F✔] `test.log` registra 49/49; a Central leu o log, mas não rodou os testes. | [F↗] O hover no fluxo natural com a preferência de movimento normal **não foi validado**, porque o navegador forçava `reduced-motion`; o teste usou uma fixture de diagnóstico. Falta testar o toque em aparelho físico. |
| **Performance** | Auditoria com 9 GLBs, 19 imagens, gráficos e coletores reproduzíveis. | [F✔] A pasta `evidencias/performance/` existe. | [F↗] O FPS variou de 1 a 15 em um ambiente compartilhado com rAF irregular. Os números **não** servem como medida de celular nem de computador comum. Nenhuma otimização foi aplicada. |
| **QA localhost** | Checklist e resultado de duas rodadas. | [F✔] Os arquivos existem. | [F↗] Abertura, WebGL2, HUD, navegação, passeio guiado e rádio estão OK. Ficaram inconclusivos ou sem teste: segurar W, a tecla E, a linha do tempo, uma descoberta salva após recarregar e qualquer aparelho físico. |

[I] O backlog (`BACKLOG.md`) está defasado: GZ-05 aparece como “A fazer”, e GZ-08/GZ-09 aparecem sem estado. Recomenda-se atualizar os estados assim que Eduardo validar este relatório.

---

## 2. Riscos para a entrega

| Risco | Situação | Gravidade [I] |
| --- | --- | --- |
| **Desempenho em celular** | [F↗] Não há nenhuma medição em aparelho real. A emulação no desktop registrou 1,1 FPS parado e 15 FPS no passeio, mas esses números não representam um celular. A vista aérea chega a 415 chamadas de desenho e 520 mil triângulos por quadro; as texturas da cena inicial ocupam cerca de 210 MiB na estimativa RGBA8, valor que não corresponde à VRAM real. [I] Esse é o maior risco técnico desconhecido: um Android intermediário pode ficar abaixo de 20 FPS na vista aérea ou perder o contexto WebGL. | **Alta** até haver medição |
| **Primeiro uso com pessoa nova (GZ-02)** | [F↗] Os três caminhos de entrada, o roteiro e a tela final existem no código, mas **ninguém de fora** testou. GZ-09 e GZ-03 mudaram textos de orientação sem teste de compreensão. | **Alta**: é o critério central de “exposição que qualquer visitante conclui” |
| **Créditos desatualizados** | [F✔] O texto visível em `index.html` promete um crédito do diorama que não será acrescentado, e o README, linha 136, ainda cita o diorama. O aviso “Exposição atualizada” convive com o texto antigo na mesma seção. [I] Um avaliador pode ler isso como inconsistência ou como uso de um asset sem licença. | **Média**, com correção barata |
| **Rota antiga do diorama no processo em execução** | [F✔] **Resolvido**: o PID 22696 responde 404. O servidor relê arquivos alterados pela data de modificação, então o código atual é servido sem reinício. | Baixa |
| **GLB arquivado na árvore** | [F✔] **Resolvido na árvore**: o arquivo foi removido do disco e do HEAD. [F✔] **Ainda existe no histórico público** do GitHub e pode ser recuperado por quem clonar o repositório. Uma captura do diorama, `docs/visual/mirante-noodle.jpg`, continua versionada. [I] Reescrever o histórico é destrutivo e afeta clones, então só Eduardo pode decidir. A alternativa barata é registrar a remoção e excluir a imagem. | **Média** (licença) |
| **Teste físico pendente (GZ-06)** | [F✔] Não há evidência física em `evidencias/testes/`. Pela [DECISOES](DECISOES.md) e pelo plano, o teste com três pessoas e Android deve acontecer de 19 a 23/11. | **Alta**: bloqueia a conclusão sobre celular e primeiro uso |
| **Rubrica, formato e hospedagem desconhecidos (GZ-01)** | [F✔] Seguem como perguntas abertas em `DECISOES.md`. GZ-07, o ensaio da URL publicada, fica bloqueado por isso. | **Alta**: pode mudar prioridades a 18 dias da entrega |
| **Trabalho do Geep sem commit** | [F✔] `src/scene.js` e o teste novo estão apenas no disco. [I] Há risco de perda, ou de conflito se outra tarefa editar `scene.js`. | Baixa/média |

---

## 3. Melhorias por impacto e esforço

Ordenadas por **ganho ÷ custo**, priorizando o que cabe antes de 30/11. Custo: B = até 2 h, M = meio dia a 1 dia, A = mais de 1 dia.

| # | Item | Ganho esperado [I] | Custo | Risco | Evidência que falta |
| --- | --- | --- | --- | --- | --- |
| 1 | **Responder GZ-01** (rubrica, formato, hospedagem e horário) | Destrava GZ-07 e evita trabalho fora da avaliação | B (Eduardo) | Nenhum | O próprio brief |
| 2 | **Teste físico em Android intermediário + computador** com o [checklist](evidencias/validacao-manual-localhost-12-11-2026/checklist-teste-manual.md) e `performance/collect-console.js` no modo `?perf` | Transforma o maior risco desconhecido em dado: FPS, aquecimento e travamentos | M | Nenhum (só leitura) | Modelo do aparelho, FPS parado, no passeio e na vista aérea, e capturas |
| 3 | **Teste de primeiro uso com 3 pessoas** sem explicação prévia (GZ-02) | Mede se a exposição se explica sozinha; é o centro da entrega | M | Nenhum | Roteiro de observação e registro de onde cada pessoa travou |
| 4 | **Atualizar créditos visíveis** em `index.html` e na linha 136 do README; tratar `docs/visual/mirante-noodle.jpg` | Remove uma inconsistência visível e o risco de licença | B | Baixo (texto); exige **autorização de Eduardo** porque mexe em créditos | Diff, captura da seção de créditos e confirmação de que os créditos do README não mudaram |
| 5 | **Harmonizar “Londres, 1998”** em `index.html` (linhas 19, 30 e 33) com GZ-04 | Mantém a coerência factual, inclusive no modo sem JavaScript | B | Baixo | Confirmação da Pesquisa sobre a redação e captura com e sem JavaScript |
| 6 | **Perfil leve automático no celular**: sombras mais baratas ou ausentes no perfil `leve` e limite na vista aérea | Pode reduzir de 268 para 174 chamadas por quadro (medido sem sombras); o ganho de FPS não foi provado | M | Médio: muda a imagem | Medição antes e depois **no aparelho** do item 2. Implementar só se o item 2 mostrar lentidão |
| 7 | **Revisar a quinta descoberta e a persistência** (GZ-11): descobrir, recarregar e conferir o diário | Garante que o percurso fecha | B | Nenhum | Sequência de capturas com `discovered` preenchido antes e depois de recarregar |
| 8 | **GZ-04 nas eras restantes** (7 eras), ao menos nas datas e afirmações exibidas nas fichas | Aumenta a credibilidade acadêmica | M/A | Baixo | Inventário afirmação por afirmação. A norma bibliográfica depende da rubrica |
| 9 | **Compartilhar Sources de textura** em `src/materials.js` | Cerca de 26,7 MiB a menos na estimativa de memória de textura; ajuda celulares | M | Baixo/médio: carregamento assíncrono e `needsUpdate` | Teste específico e contagem de texturas antes e depois |
| 10 | **Commit do trabalho do Geep** (Eduardo) | Evita perda e conflito | B | Nenhum | Revisão do diff por Eduardo |
| 11 | **Ensaio da URL publicada** (GZ-07) | Pega erros de HTTPS, caminhos e cache antes do dia 30 | B/M | Nenhum | Depende do item 1 |
| 12 | Limpeza de CSS (GZ-10) | Baixo para o avaliador | M | Médio: regressão visual | Comparação visual completa. **Adiar** |
| 13 | KTX2/compressão de malha e carregamento por proximidade | Alto em memória e carga | A | Alto: novo pipeline e risco nas licenças dos derivados | **Pós-entrega (P2)** |
| 14 | Reescrever o histórico Git para apagar o GLB | Elimina a cópia pública | M | **Alto**: destrutivo e quebra clones | Decisão exclusiva de Eduardo. [I] Não recomendado antes da entrega; documentar a remoção basta, salvo exigência da disciplina |

---

## 4. Lacunas de validação

**Exigem QA físico** (Eduardo ou uma pessoa com o aparelho):
- FPS e estabilidade em Android intermediário: parado, no passeio guiado e na vista aérea; também aquecimento e perda de contexto em sessões acima de 10 min.
- Toque: aceleração e freio na tela, arrastar a câmera, toque no boneco do Geep e menu da rádio.
- Teclado real no computador: **segurar W**, tecla **E** em um local, linha do tempo e botão de reiniciar.
- Áudio real: Kong FM tocando no alto-falante, importação de um arquivo do aparelho e de um arquivo inválido.
- Primeiro uso com pessoa nova, no desktop e no celular.
- URL publicada em sessão limpa (GZ-07), depois de GZ-01.

**Sem evidência, mas verificáveis em navegador local por QA:**
- Uma descoberta salva que persiste após recarregar, e o fluxo da quinta descoberta (GZ-11).
- Reprodução completa do clipe no YouTube em uma rede sem bloqueio de DNS.
- Modo sem WebGL e `<noscript>` (fallback citado em GZ-02).
- Hover do Geep com `prefers-reduced-motion: no-preference` no navegador normal de Eduardo.
- Leitor de tela nos controles novos da rádio.
- Firefox e Safari: nenhum teste registrado.
- Reconhecimento das regiões de GZ-08 com a câmera normal de condução.

---

## 5. Recomendação final — próximos 10 dias (13/11 a 22/11)

| Ordem | Quando | Ação | Quem |
| --- | --- | --- | --- |
| 1 | 13/11 | Eduardo envia rubrica, formato, hospedagem e horário (GZ-01) e revisa e commita o trabalho do Geep. | Eduardo |
| 2 | 13/11 | Eduardo autoriza a atualização dos créditos visíveis, da linha 136 do README e da imagem `docs/visual/mirante-noodle.jpg` (item 4). A Engenharia aplica, e a Central atualiza os estados do backlog. | Eduardo → Engenharia + Central |
| 3 | 13–14/11 | A Pesquisa confirma a redação sobre Londres, e a Engenharia ajusta `index.html` (item 5). | Pesquisa → Engenharia |
| 4 | 14/11 | QA local: persistência, quinta descoberta, `<noscript>`/sem WebGL e clipe completo (item 7 e lacunas locais). | QA |
| 5 | 15–16/11 | **Teste físico** em Android intermediário e computador com o checklist e `collect-console.js` (item 2). | Eduardo + QA |
| 6 | 17–18/11 | Se o celular ficar abaixo de cerca de 25 FPS: perfil leve com sombras reduzidas (item 6) e, se sobrar tempo, compartilhamento de Sources (item 9), com medição antes e depois **no mesmo aparelho**. Se o desempenho estiver aceitável, não mexer. | Engenharia |
| 7 | 17–20/11 | GZ-04 das eras restantes, começando pelas afirmações exibidas nas fichas (item 8). | Pesquisa |
| 8 | 19–21/11 | **Teste com 3 pessoas novas** (GZ-02), com correções de texto e fluxo apenas onde alguém travou. | Eduardo + QA → Engenharia |
| 9 | 22/11 | Ensaio da URL publicada (GZ-07), se GZ-01 tiver sido respondido. Depois, rodada de regressão com `npm run check` e `npm test` e congelamento do escopo de novos recursos. | QA + Eduardo |

Ficam fora deste período: KTX2/compressão, limpeza de CSS, expansão do mapa e reescrita do histórico Git (itens 12 a 14), salvo decisão contrária de Eduardo.

## Limites desta análise

- Nenhum teste, build ou medição foi executado pela Central; os números de FPS e de testes vêm dos logs dos especialistas [F↗].
- As verificações [F✔] foram: `git status`/`log`/`ls-files`/`ls-remote`, HEAD HTTP em `/` e na rota antiga, visibilidade do repositório via `gh`, e leitura de `index.html`, `README.md`, `CREDITS.txt`, `server.mjs` e dos testes.
- As estimativas de custo e ganho são [I] e não têm medição.
