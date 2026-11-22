# Rodada final — evidências de engenharia (front-end)

Medido no Chrome real (`localhost:3000/?perf`). Sem commit, push ou Co-authored-by: quem faz o commit é o Eduardo.

Resultados e status por item: `engenharia-resultados.md`. Resumo de alterações por arquivo: `resumo-diff-por-arquivo.md`.

## Limite do player local da Kong FM (troca por era)

Só há **2 faixas liberadas** no player local: *Concreto* e *Maré de plástico*. O passeio troca de faixa assim: parada da era plástico → *Maré de plástico*; demais paradas → *Concreto*. Não há troca por era além disso até existirem mais áudios liberados.

## Medidas de aceite (rodada 3)

| item | resultado | aceite |
|---|---|---|
| FPS (rAF 3 s): mural / palco / centro | 59,8 / 60 / 60 | ≥ 55 |
| erros HTTP, console e página | 0 | 0 |
| peso inicial (antes de entrar no 3D) | 4,34 MB | ≤ 9,3 MB |
| peso acumulado ao final | 8,10 MB | ≤ 9,3 MB |
| `npm run check` | OK | verde |
| `npm test` | 174/174 | verde |

## Arquivos desta pasta

- Piano em 4 tamanhos com erro vermelho: `piano-erro-desktop-1440x900.png`, `piano-erro-notebook-1346x680.png`, `piano-erro-retrato-390x844.png`, `piano-erro-pequeno-320x568.png`.
- Fliperama antes/depois: `antes-fliperama-*`, `depois-fliperama-*` (o objetivo agora mostra o total de pontos, não "Restam 0").
- Contador 9/9 pelo E: `mapa-9-de-9-1440x900.png`, `hud-9-de-9-1440x900.png`.
- Câmera cinematográfica na parada: `cinematica-parada-1440x900.png`.
- Piloto v4 (1ª pessoa, antes/depois): `antes-piloto-*`, `depois-piloto-*`.
- Integrantes de frente (diagnóstico, enquadramento ainda ruim): `antes-integrante-*`.
- Copas de árvore em direção manual: `copas-arvore/` (JSON com e sem bloqueio e o script do teste).
- Frame time em passeio: `frametime-*.json`.

## Limite aceito: copas de árvore (câmera normal)

Em direção manual, com 16 árvores e curvas em zigue-zague, a câmera atravessava copa em 9 de 576 amostras sem bloqueio. Com o bloqueio de copas e o piso de altura de 7,5 m, caiu para 4 de 576. Os 4 restantes estão a 7,2–7,9 m do carro, na distância mínima do braço da câmera (7,5 m). Aceito como limite: zerar exigiria mudar o braço mínimo da câmera.

## Item 5 — cena (integrantes, palcos, placas)

Pasta: `item5/`.

- **Câmera de depuração por coordenadas explícitas:** `world.frameAt(olho, alvo)`. Os integrantes têm 6,2 m de altura (escala do pacote), então a câmera fica a **12 m** à frente, olho 3,2 m, alvo 3,4 m, para caber o corpo inteiro. A 4 m (pedido) só aparecem pernas. Coordenadas: 2-D (-72,92; 3,2; -70,34), Murdoc (-60,21; 3,2; -136,27), Noodle (42,67; 3,2; -109,24), Russel (52,45; 3,2; -112,66).
- **Vitrine desligada para o print:** com a vitrine ligada (padrão), os integrantes são reposicionados ao redor do carro; por isso as primeiras câmeras não os encontravam.
- **Pose do Murdoc** (`src/band-pose.js`, SPECS): recebeu contato de mão no instrumento (mesmo padrão do Noodle), inclinação do tronco −0,03 e olhar `[.06, .1]`. Resultado visível: baixo com o traste mais alto e corpo encostado no peito. **Ainda não resolvido:** o braço do corpo continua escondido atrás do instrumento.
- **Prédio na frente de Noodle e Russel (câmera normal, ao chegar):** nenhum prédio bloqueou. O que tapava eram **árvores de cenário** em volta do palco (o anel de props de rua colocava 45% de árvores). Corrigido: sem árvores no anel do palco (`src/street-props-plan.js`) e sem árvores a menos de 16 m de um palco (`src/world-data.js`). Folga da pista: os palcos ficam a 8,5 m da borda (ver `settle` em `world-data.js`).
- **Placa "RUA SONG MACHINE":** existe como nome de rua (índice 9 de `ROAD_NAMES`). Postes com 4,2 m, base no chão, placa a 3,85 m, legível de frente (print em `item5/`).
- **Caixas de som, bancas e totens das 9 descobertas:** não revisados um a um. Verificado por geometria que os elementos elevados estão apoiados (ex.: rádio sobre a base); nada foi corrigido.
- **LOD dos props instanciados:** **não feito**. Não há medição de ganho ainda; sem medição, não há o que justificar.

## Aceite desta rodada (item 5)

- FPS 59,9 / 60 / 59,9 (≥ 55); 0 erros; peso inicial 4,34 MB, acumulado 8,10 MB.
- `npm run check` OK; `npm test` 174/174 (ajuste na tabela de olhar do Murdoc em `tests/band-pose.test.mjs`).
