# Evolução da experiência

## Direção

A referência visual é o vídeo de 51 segundos fornecido em 04/11/2026. Os quadros mostram uma entrada editorial, os integrantes e uma estrada que apresenta as eras. A leitura feita nesta etapa é visual, sem transcrição do áudio.

O projeto existente é um mundo aberto com cinco descobertas, e não o circuito linear do vídeo. A direção adotada preserva esse mundo e usa a viagem para orientar a leitura: escolher como entrar, saber aonde ir, chegar, explorar e continuar.

## Sistema visual desta etapa

Preservar o creme #e9e4d4, o verde #d2e2a8 e o rosa #f5a9c6 existentes; usar verde escuro #172822 no roteiro e #d5dcd7 no texto secundário. Manter a tipografia de título do projeto; usar Arial nos novos controles e textos de orientação para legibilidade. Alinhar texto à esquerda. A cena e os personagens continuam sendo o destaque, com ferramentas ocultas antes da entrada.

Entrada: título → contexto → dirigir / passeio guiado → leitura direta.
Exploração: região → destino e ação → mapa → controles.

## Implementado

- Entrada com três caminhos explícitos: dirigir, passeio guiado e leitura.
- Roteiro com as cinco histórias reais do mapa, escolha de destino e indicação de descobertas.
- Orientação durante a viagem e ação de explorar ao chegar. Distância identificada como linha reta, não extensão do percurso.
- Controle manual cancela o passeio. As setas deixam de dirigir antes da entrada ou quando a seção do mundo não está visível.
- Conteúdo da entrada fica inerte depois de entrar, evitando foco em ações invisíveis.
- Apresentação do roteiro isolada em `src/journey-guide.js`; física, conteúdo e persistência permanecem nos módulos próprios.

## Ciclo de trabalho

1. Definir um problema observável e um critério de aceitação. Exemplo: uma pessoa deve conseguir escolher um destino sem entender os controles do carro.
2. Alterar uma parte da experiência. Usar `world-data.js` para lugares, `content.js` para narrativa, `navigation.js` para caminhos e `journey-guide.js` para apresentação do roteiro.
3. Executar `npm run check` e `npm test`.
4. Com `npm run dev` ativo, executar `python scripts/smoke-browser.py`. O teste usa Python Playwright e Chromium; a aplicação continua sem dependências adicionais. Configurar `TEST_URL` e `SCREENSHOT_DIR` se necessário.
5. Revisar as capturas em desktop, 390 px e 320 px, além do modo sem 3D. Conferir cliques, foco, ausência de rolagem horizontal e erros de JavaScript.
6. Descrever resultado, evidências e limitações antes de integrar a mudança.

## Próximas entregas, em ordem

1. **Câmera e composição:** enquadrar o destino e reduzir obstruções por árvores e prédios. Aceitação: destino reconhecível e carro visível nos cinco percursos.
2. **Narrativa das eras:** aproximar a viagem da sequência editorial do vídeo, com oito paradas coerentes com o conteúdo. Exige novos lugares e trajetos; não apresentar as cinco descobertas atuais como oito eras.
3. **Cenário:** dar identidade a cada região e substituir o moinho provisório por um asset com permissão adequada. Registrar licença, tamanho e custo de renderização.
4. **Desempenho:** medir carregamento, memória e tempo de quadro em celular real antes de aumentar a quantidade de modelos. A emulação de viewport não comprova desempenho em aparelho físico.
5. **Conteúdo:** conferir fontes e atualizar o recorte histórico em uma entrega editorial própria.

Uma etapa está pronta quando seu fluxo funciona, os testes passam e as capturas foram inspecionadas. Mudanças visuais não devem introduzir reprodução automática de áudio nem coletar descobertas sem ação da pessoa.
