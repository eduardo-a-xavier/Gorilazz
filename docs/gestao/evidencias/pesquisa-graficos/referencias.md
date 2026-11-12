# Referências para métricas de performance

Consulta: 12/11/2026. Pesquisa documental; não são medições do projeto.

## Fatos e fontes

- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer): `renderer.info` expõe contagens de renderização e de geometrias e texturas ativas. Essas contagens não são memória em bytes. Com múltiplos passes, a documentação orienta desativar `autoReset` e zerar ao final do quadro para agregar os dados.
- [Chrome DevTools: análise de desempenho](https://developer.chrome.com/docs/devtools/performance/): o painel Performance permite registrar e inspecionar uma execução para investigar carregamento e trabalho de renderização.
- [web.dev: tarefas longas](https://web.dev/articles/optimize-long-tasks): tarefas da thread principal superiores a 50 ms são classificadas como longas e podem prejudicar a responsividade.
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame): o callback recebe timestamp; a frequência acompanha geralmente a atualização da tela e pode ser reduzida em abas em segundo plano. Intervalos observados não são tempo isolado de GPU.
- [Three.js: otimização de objetos](https://threejs.org/manual/en/optimize-lots-of-objects.html): agrupar objetos pode reduzir chamadas de desenho, mas a escolha depende das características da cena.

## Interpretação e proposta de gráficos

- Série temporal de duração entre quadros em ms, com linhas de referência de 16,67 ms (60 Hz) e 33,33 ms (30 Hz). São orçamentos ilustrativos, não garantia de taxa nem padrão universal.
- Histograma ou percentis dos intervalos de quadro complementam FPS médio e mostram oscilações; anotar duração da coleta, cena, câmera, navegador, dispositivo, resolução e estado de carregamento.
- Barras para tamanho transferido de GLBs/texturas e tempo de carregamento; distinguir tamanho em disco, transferência e memória descompactada. Para draw calls, usar a mesma cena e percurso; não interpretar contagem de texturas como bytes de VRAM.
- Comparar antes/depois sob condições equivalentes; investigar picos no trace antes de atribuir causa. Não apresentar os valores de referência como benchmarks medidos do Gorilazz.

## Limites

Não foi estabelecido benchmark universal para jogos web nem coletada amostra neste documento. A validação dos links e da metodologia deve acompanhar a medição de Engenharia; dispositivos e taxas de atualização diferentes exigem comparações contextualizadas.
