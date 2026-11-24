# Mãos e suspensão — validação parcial

## Causas e mudanças

O volante usava `steering × 1,9` diretamente. As mãos da cabine usavam outro filtro, `steering × 1,15`, outro limite e atualizavam apenas em primeira pessoa. Agora volante e alvos das mãos usam o mesmo ângulo amortecido, atualizado também fora da cabine; o passo angular é limitado a 0,75° por atualização. O delta visual é limitado a 0,05 s. A cadeia do piloto continua v5 → v4 → v2 → original e `smoothNormals` permanece ativo.

O movimento anterior do chassi não era uma suspensão com mola: usava uma senoide vertical contínua e interpolação separada de pitch/roll, sendo o roll sem limite explícito. A versão atual usa amortecimento exponencial de primeira ordem para pitch e roll, limitados a 3°, e altura fixa em zero. Não é um modelo físico de mola com compressão de rodas. Retirar a senoide elimina esse ruído vertical artificial, mas também elimina o movimento vertical visual da suspensão.

A cinemática inversa dos braços continua sendo resolvida por quadro em primeira pessoa; foram removidas algumas alocações de vetores e arrays, mas não foi comprovada ausência de alocações nem eliminado o custo da IK. Isso permanece fora do aceite pedido.

## Amostra real e simulação

`amostra-piloto-v5.json` contém 20 atualizações síncronas de `world.update` em passos simulados de 1/60 s: 6 em primeira pessoa, 4 em terceira e retorno. O piloto v5 foi carregado no navegador. Nessa amostra, os maiores passos consecutivos dos ossos da mão projetados no plano do aro foram 0,885° à esquerda e 0,929° à direita. A diferença angular em relação ao volante, descontado o deslocamento inicial, chegou a 0,159° e 0,219°, respectivamente. A distância osso–alvo foi ~0,015 m, correspondente ao deslocamento `PALM` usado pelo solver. Não há amostra dos ossos invisíveis entre os quadros 6–9; portanto isso não prova ausência de salto na troca de câmera nem em todo o passeio.

O jerk angular máximo nessa amostra, calculado pela terceira diferença dos ângulos dos ossos × 60³, foi aproximadamente 26.395°/s³ à esquerda e 37.217°/s³ à direita. É uma amostra curta, sensível à troca de modo, e não há série equivalente real de antes para comparação. Outra varredura sintética de 80 quadros mostrou passos máximos de 0,762° e 0,763° nos dois ossos, com ângulos tratados circularmente; não cobre todos os movimentos possíveis.

`simulacao-antes-depois.json` registra as séries das fórmulas antes/depois para arrancada, frenagem, curva, emenda, alternância e passeio; `simular-movimento.mjs` as reproduz. São entradas artificiais, incluindo mudanças abruptas, não medições do jogo rodando. Exemplos: pitch máximo simulado na frenagem 3,43° → 2,75°; roll na curva 4,58° → 2,29°; RMS vertical na emenda 0,00374 m → 0 m. Os testes unitários verificam retorno monotônico ao repouso, mas a contagem de oscilações em percurso real não foi medida. A igualdade do ângulo do volante com o alvo de mão na simulação decorre da mesma variável e não equivale à medição dos ossos.

`cabine-centro.png`, `cabine-curva-positiva.png` e `cabine-curva-negativa.png` são quadros isolados com o piloto v5; as curvas foram produzidas por chamadas diretas de atualização, não por condução contínua. Não foi feita análise visual completa de fendas em todos os ângulos.

## Pendente de aceite

Faltam medições reais antes/depois em percurso, inclusive partida e retomada do passeio, transições de câmera, ângulo e jerk das duas mãos, oscilação/altura sob as cinco condições, FPS nos três pontos e peso inicial. O navegador em segundo plano limita os quadros. Uma tentativa inicial na porta 3157 usou servidor anterior e deu 404 para o novo módulo; a verificação posterior usou servidor atualizado na porta 3158, carregou v5 e não trouxe novos diagnósticos no trecho observado. Isso não é uma auditoria completa de erros.

`npm run check` passou; `npm test` passou com 217/217. Não houve commit.
