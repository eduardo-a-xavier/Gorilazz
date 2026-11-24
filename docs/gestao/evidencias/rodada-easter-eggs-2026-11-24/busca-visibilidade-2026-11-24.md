# Busca preliminar de visibilidade do colossal

Não foi escolhida nem implementada uma nova posição. A busca usou a câmera de terceira pessoa calculada por `createTravelCamera`, com carro parado e alinhado ao sentido da avenida. Os pontos são coordenadas do veículo; os ângulos são em radianos.

| Vista | X | Z | Direção |
|---|---:|---:|---:|
| Av. Clint Eastwood | -37 | -54 | 1,430 |
| Av. Saturnz Barz | -57 | -144 | 2,151 |
| Rua Song Machine | -36 | -101 | 1,399 |

A grade teve centro em (0, -75), raios de 120 a 260 m em passos de 10 m, ângulos de 5° e alturas de 50 a 120 m em passos de 5 m. Foram 886 posições de centro fora dos limites do mundo, ou 13.290 combinações posição/altura. Foram projetados sete pontos aproximados da silhueta: cabeça, dois ombros, três pontos de torso e pés, com margem de 4% por borda. Nenhuma combinação projetou os seis pontos de cabeça/ombros/torso dentro do quadro de qualquer uma das três vistas; portanto nenhuma chegou ao mínimo de duas vistas antes mesmo de medir obstrução. A cabeça foi amostrada a 90% da altura.

O candidato com mais pontos projetados na soma das vistas foi (-244,3; 13,9), altura 50 m. Para ele foram lançados raios contra as malhas de `city` e `street-props`:

| Vista | Pontos dentro do quadro / 7 | Pontos dentro do quadro e sem interseção / 7 | Cabeça |
|---|---:|---:|---|
| Clint Eastwood | 3 | 0 | Acima do quadro |
| Saturnz Barz | 4 | 2 | Acima do quadro |
| Song Machine | 3 | 0 | Acima do quadro |

São proporções de pontos amostrados, não porcentagens da área real da malha. Os raios deste candidato não incluem todos os demais grupos da cena. A busca usa uma aproximação bidimensional da silhueta voltada para cada câmera; não testou rotações reais, inclinação ou vértices completos. Assim, o resultado demonstra a limitação da grade e das amostras, não prova impossibilidade para qualquer pose ou ponto de avenida. O far plane é 650 m; a névoa observada tinha densidade 0,003.

## Alternativa para avaliação

Uma busca adicional de alturas entre 15 e 45 m encontrou 410 combinações com cabeça/torso aproximados dentro do quadro em pelo menos duas vistas, antes das obstruções. Entre 18 candidatos de 20 m verificados com os mesmos raios, (-150; -75) teve 5/6 pontos livres em Clint e 5/6 em Saturnz; Song Machine teve 0/6. Em (-147,7; -101), Clint teve 5/6, Saturnz 0/6 e Song Machine 6/6. Esses resultados são apenas triagem: exigem testar a malha completa, rotação, os demais obstáculos, limites físicos, aparência e desempenho antes de decidir. Pode-se explorar uma segunda figura menor na borda, mantendo o colossal original, ou alterar o enquadramento da câmera; nenhuma alternativa foi implementada nesta rodada.

Não houve alteração no código do projeto. Não foram repetidos FPS, p95/p99, passeio ou testes, pois nenhuma nova configuração foi aplicada. As medições de desempenho anteriores pertencem à versão anterior e não validam uma alternativa futura.
