# Correção 2026-11-21 — evidências (Engenharia Gorilazz)

Medido no Chrome real (channel chrome, headless), `http://localhost:3000/?perf`.

## Prints
- **Rodapé:** `rodape-antes-1440x900.png` (antes: pílula do fliperama visível perto da máquina, rádio em 824–882 px) · `rodape-depois-dentro-carro-*` (1ª pessoa, barra de Sintonizar/Centralizar/Controles e rádio inteiros) · `rodape-depois-longe-fliperama-*` (3ª pessoa, longe da máquina: sem pílula; rádio e velocímetro inteiros).
- **Mural:** `mural-antes-1440x900.png` / `mural-depois-1440x900.png` (mesmo ponto, 1440x900). Saiu o disco rosa na frente da arte (era o farol, na frente do painel) e a foto deixou de ser esticada.
- **Palco da Noodle:** `palco-noodle-antes-1440x900.png` / `palco-noodle-depois-1440x900.png` (guitarra v2 + amplificador e pedaleira).
- **Fliperama:** `fliperama-pilula-perto-1440x900.png` (2 m da máquina), `fliperama-inicio-top5-1440x900.png` (tela inicial com Top 5), `fliperama-vitoria-1440x900.png` (tela VITÓRIA!).
- **Cenário:** `cenario-props-1440x900.png` (palco com árvores, bancos e canteiros; sem "antes" capturado).

## Medidas
- FPS (rAF em 3 s, 1440x900): mural 60 · palco Noodle 60 · centro 59,8–60.
- Peso transferido: 4,32 MB até o carregamento inicial; 8,06 MB depois de entrar no 3D (inclui `gorillaz-phase7-web-v2.glb` de 2,83 MB). Teto: 9,3 MB.
- Erros: 0 de console, 0 HTTP ≥ 400, 0 erros de página no fluxo normal; nenhum aviso de fallback (guitarra v2 carregou).
- Rodapé dentro da viewport (scrollY alinhado e 1ª pessoa): 1440x900, 1346x680, 390x844, 320x568.
- `npm run check` OK; `npm test` 139/139.

## Ajustes de 2026-11-21 (tarde)
- **Rodapé (linha rosa):** `.trip-meter` oculto em 3D (`html.mode-3d .trip-meter`); no 3D o contorno de foco do canvas também saiu (era a linha fina). Em 2D a captura bate com o ruído (média 0,12 contra 1,16 de ruído entre duas capturas iguais). Arquivos: `rodape-trip-*`.
- **Pose da banda:** ver `pose/README.md` (2-D, Noodle e Russel).

## Limitações
- Sem "antes" do fliperama (não foi capturado antes da mudança) nem do cenário.
- Fenda/encaixe das mãos da Noodle não foi avaliado de perto: a câmera do jogo fica longe demais para isso.
- ESC em tela cheia foi testado com Playwright (tecla enviada à página); o comportamento real do Chrome em tela cheia precisa de teste manual.
- Placa "RUA SONG MACHINE" não foi alterada; a diagonal da placa de esquina continua.
