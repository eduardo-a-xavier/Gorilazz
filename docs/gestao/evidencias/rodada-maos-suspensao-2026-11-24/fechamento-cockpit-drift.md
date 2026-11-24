# Fechamento — cockpit, drift e helicópteros

Implementação parcial pendente de validação visual e em condução real. O volante e a suspensão usam a calibração anterior; os dedos do piloto v5 não foram alterados. O rádio preserva a lista dinâmica de faixas locais, com botão LISTA no widget e no painel. O mostrador analógico usa canvas estático e ponteiro separado; o painel do rádio recebeu nova cor e moldura.

Amostra determinística (`simetria-drift-helicoptero.json`): A e D têm diferença máxima zero no esterço, pico 23,08° em ambos; drift atingiu slip de 14,03° e caiu para 0,035° após um segundo solto. Condições controladas, com posição e velocidade fixadas por quadro, não são direção real. A órbita calculada avançou 183,35° em 10 s nos dois modos; ainda falta confirmar a posição real com emulação de movimento reduzido.

Não foram feitas capturas 1440x900 nem medidos FPS, erros completos, peso, sensação da condução, posição dos dedos ao esterçar ou lista com três faixas no navegador; solicitada validação à QA. Em movimento reduzido, os helicópteros seguem sua órbita intencionalmente; outras animações continuam respeitando a preferência. Nenhum áudio novo foi adicionado.

Testes: npm run check e npm test 223/223.
