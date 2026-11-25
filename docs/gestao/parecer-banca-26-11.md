# Parecer da Banca Avaliadora simulada — Gorilazz A3

Base: commit `16ab193` (publicado, CI e Pages verdes). Auditoria feita por Engenharia, QA, Pesquisa e Gorila Central, só leitura, sem alterar código.

Dados de referência (auditados): `assets/` 28,91 MB; pacote publicado 30,53 MB; carga inicial 3D 8,58 MB em Chrome real; 275/275 testes; ~60 FPS em Chrome real desktop (~30 FPS limite mobile); Fliperama KONG ARCADE = labirinto (117 pts + Top 5); Teclado do 2-D = minigame de ritmo D/F/J/K; áudio dos palcos com atenuação por distância (raio 34 m, sem HRTF) e ducking do Kong FM até 35%.

## Notas por pilar (0 a 10)

| Pilar | Nota | Origem | Síntese |
|---|---|---|---|
| Arquitetura de Código | 6,0 | Engenharia | Lógica pura bem separada e testada em Node, mas `app.js` (1358 linhas) e `createWorld` em `scene.js` (~900 linhas) são monólitos; câmera sem máquina de estados única; sem lint nem tipos. |
| Performance / Otimização | 8,5 | QA | Carga inicial de 8,58 MB, pacote de 30,53 MB, ~60 FPS desktop. Desconto: MP3s inteiros (11,41 MB sob demanda), sem teste em celular físico. |
| Experiência 3D / Interação | 7,5 | Gorila Central (Engenharia avaliou junto com arquitetura) | Passeio medido: 9/9 paradas, 0 fora do asfalto, 0 colisões; cockpit, Pausar/Pular, Fliperama e fichas validados em Chrome real. Desconto: física arcade, sem micro-vibração ao RPM, bug de câmera que só o teste em navegador pegou. |
| Áudio Procedural / Espacial | 7,8 | Pesquisa | Motor procedural de 4 marchas, pombos e ducking em duas camadas. Desconto: espacial é atenuação por distância, sem PannerNode/HRTF; risco de copyright dos MP3. |
| Qualidade / Testes | 8,0 | Gorila Central (QA deu 8,5 incluindo performance) | 275/275 testes, CI, simulação E2E sob `/Gorilazz/` sem 404. Desconto: nenhum teste de navegador roda no CI; teste de telemetria lê JSON commitado. |

Média simples: 7,6. Notas 3D e Testes são ajuste do Gorila Central sobre pareceres combinados; as demais são das especialistas.

## Pontos fortes para destacar

1. **Lógica pura testada fora do navegador:** `guided-tour.js`, `street-props-plan.js`, `ambient-particles.js`, `world-data.js` rodam em Node sem DOM nem Three.
2. **Passeio Guiado medido de forma reproduzível:** script `analisar_telemetria.mjs` gera métricas por câmera (9/9 paradas, 0 fora do asfalto, 0 colisões).
3. **Publicação sob subcaminho provada:** simulação E2E sob `/Gorilazz/` com 0 respostas 4xx, 0 erros de console; carga inicial de 8,58 MB.
4. **Áudio sintetizado, sem WAV:** motor em 3 camadas harmônicas com 4 marchas virtuais, pombos (raio 30 m), pulso nos palcos (raio 34 m) e ducking do Kong FM até 35%.
5. **Rigor de curadoria e licenças:** fichas e easter eggs com fontes citadas, sem Wikipédia; 22 GLBs próprios CC0 com SHA-256; remoção documentada de dois modelos sem procedência.
6. **275 testes** e cadeia de fallback de modelos com testes (`model-chain.test.mjs`).

## Perguntas difíceis e respostas prontas

**1. "Por que `app.js` tem 1358 linhas e `createWorld` uma closure de 900 linhas?"**
O estado de câmera, HUD, veículo e rádio é compartilhado entre mundo 3D e interface; separar sem regressão exigia tempo que não tivemos. Extraímos primeiro o que era puro (passeio, rádio, descobertas). O restante é dívida técnica registrada.

**2. "Como vocês pegam um nome de propriedade errado? O `check` só roda `node --check`."**
Pelos testes unitários e pelos testes manuais em Chrome real. O bug do cockpit no Passeio Guiado não foi pego pelo `check` e apareceu no teste de navegador. Lint e tipos são o próximo passo.

**3. "O que impede uma regressão visual de chegar à publicação?"**
Nada automatizado: os testes de Chrome real (smoke, telemetria, cockpit, palcos) são executados manualmente e guardados como evidência. Lacuna declarada; o CI cobre sintaxe e 275 testes.

**4. "O teste de telemetria verifica o jogo ou um arquivo?"**
Verifica o JSON gerado na última execução; quem gera é um script rodado manualmente em Chrome real. Não é teste de regressão ao vivo.

**5. "Vocês hospedam 3 MP3s comerciais inteiros no GitHub Pages. Como justificam?"**
A documentação antiga ainda diz que o site não distribui gravações comerciais, e isso precisa de errata. Os arquivos carregam sob demanda (`preload='none'`), para demonstração acadêmica fechada, sem fins comerciais. Para publicação pública definitiva, o caminho seguro é remover os MP3s comerciais e manter os instrumentais próprios e o carregamento de arquivos locais do usuário, já implementado no Kong FM.

**6. "Os instrumentais `concreto.mp3` e `mare.mp3` não têm autor nem licença no repositório."**
Registramos a lacuna em `REFERENCES.md` em vez de inventar uma licença. Os arquivos têm SHA-256; falta formalizar autoria e termo (CC0/CC BY) num `LICENSE.txt` de áudio antes de redistribuir.

**7. "Chamam de áudio espacial, mas é atenuação por distância, sem HRTF."**
Escolha pragmática de estabilidade: atenuação quadrática por distância (raio 34 m) evita artefatos de orientação ao alternar 1ª pessoa, 3ª pessoa e órbita, com custo de CPU baixo. Não é binaural; evoluir para `PannerNode` é o passo seguinte sobre a mesma arquitetura. A micro-vibração ao RPM ficou fora do congelamento.

**8. "O relatório de entrega não bate com o código (40 módulos, 174 testes, Piloto v4)."**
As rodadas finais de 24 e 25/11 elevaram o projeto a 53 arquivos checados, 275 testes e Piloto v6, e foram registradas no README e no relatório de congelamento final. O corpo antigo de `conclusao-entrega-26-11.md` e linhas removidas de `REFERENCES.md` não foram atualizados. Os números válidos são os do commit `16ab193`.

**9. "Funciona em celular físico? E com leitor de tela?"**
Não testamos em celular físico nem com leitor de tela real. Há perfil adaptativo e limite de ~30 FPS no mobile, validados só em emulação/Chrome desktop. Declaramos como limitação.

**10. "Por que 11,4 MB de MP3 num site que carrega 8,58 MB no início?"**
Os MP3 não entram na carga inicial: carregam só quando o usuário aperta play (`preload='none'`). A carga inicial medida é 8,58 MB; o pacote publicado inteiro é 30,53 MB.

**11. "Por que física arcade e não simulação rígida?"**
O objetivo é uma experiência guiada estável a 60 FPS no navegador, com 0 colisões e paradas alinhadas nos 9 pontos. Simulação rígida custaria desempenho e previsibilidade sem ganho para o conceito.

## Limitações a admitir sem rodeio

- Micro-vibração ligada ao RPM não implementada.
- Sem teste em celular físico e sem auditoria com leitor de tela real.
- MP3s comerciais inteiros sem licença de redistribuição verificada; instrumentais próprios sem licença formal.
- Documentação antiga (`conclusao-entrega-26-11.md`, parte de `REFERENCES.md`) defasada em relação ao commit congelado.
- Testes de navegador não rodam no CI.
