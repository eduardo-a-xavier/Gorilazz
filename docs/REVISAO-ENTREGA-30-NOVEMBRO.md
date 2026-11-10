# Revisão para a entrega de 30 de novembro de 2026

Avaliação em 10/11/2026, a partir do repositório, testes automatizados e capturas do site local em Chromium. Avaliação visual é julgamento de design, não resultado de pesquisa com usuários. Não houve auditoria de uma publicação em produção.

## Diagnóstico

O projeto tem uma proposta reconhecível: conhecer Gorillaz explorando uma cidade com o Geep. O carro, os integrantes e as referências musicais dão personalidade. A entrada com três caminhos — dirigir, passeio guiado e leitura — é uma boa base para diferentes visitantes.

A entrega ainda parece um protótipo avançado. Há mais funcionalidade do que orientação; o cenário tem repetição de fachadas e materiais; a página alterna linguagem de exposição musical, jogo e documentação técnica. O próximo ganho de qualidade vem de consolidar essa experiência, não de aumentar o mapa.

O objetivo recomendado para a apresentação é: **uma exposição musical interativa que qualquer visitante consegue começar, entender e concluir**, com direção como diferencial. A leitura direta precisa continuar sendo uma experiência completa.

## O que existe

| Área | Recursos encontrados | Limite atual |
| --- | --- | --- |
| Exploração | Direção arcade, ré, colisões, recuperação e passeio guiado | Não é um simulador; passeios longos precisam de teste com pessoas |
| Mundo | Três regiões de navegação, quatro bairros temáticos, marcos e câmera interna | As duas divisões não são explicadas claramente ao visitante |
| Descobertas | Cinco histórias, encontros com quatro integrantes e diário local | Não há sincronização entre aparelhos |
| História | Oito eras até 2023, nove temas, fatos reais separados de ficção | Cidade traz referências até 2026; revisão documental final pendente |
| Música | Onze sugestões editoriais com clipes externos, dois instrumentais e importação de áudio | Rádio local e repertório da banda são experiências diferentes |
| Acesso | Leitura sem dirigir, mapa alternativo sem 3D, movimento reduzido, diálogos nativos | Acessibilidade completa ainda requer leitor de tela e navegação manual |
| Técnica | Three.js local, perfis gráficos, resolução adaptativa e persistência tolerante a falhas | Não há medição de desempenho em aparelhos físicos nesta revisão |

## Interface e direção de arte

### O que preservar

- Mundo 3D como peça principal: é o diferencial mais forte.
- Geep e personagens como referências reconhecíveis; evitar trocar por elementos genéricos.
- Alternativa de leitura desde a entrada, sem obrigar o visitante a aprender controles.
- Base escura, creme, rosa e verde já presentes; ajustes devem formar uma composição, sem acrescentar outra identidade.
- Separação entre história real e ficção, importante para a entrega acadêmica.

### O que enfraquece o acabamento

1. **Entrada visualmente carregada.** Na captura inicial, a parede de tijolos ocupa o centro e os integrantes se misturam com o texto e o veículo. Compor uma câmera de abertura que mostre o Geep, um marco reconhecível e uma área de respiro para o título.
2. **Cidade repetitiva.** Muitos prédios usam estruturas semelhantes. Aumentar a identidade de três pontos principais com silhueta, iluminação, cartazes e composição próprios. Não é necessário refazer todos os prédios.
3. **Hierarquia de ações.** Antes desta revisão, até a ação principal do roteiro ficava dentro do menu. Configurações podem ficar recolhidas; destino e próxima ação precisam permanecer visíveis.
4. **Leitura pequena.** Diversos textos editoriais tinham 9–12 px, inclusive em celular. O conteúdo precisa ser confortável de ler, não funcionar apenas como textura visual.
5. **Vocabulário fragmentado.** “Kong Studios”, “Gorilazz Studios”, “Kong Radio”, “Kong FM”, três regiões e quatro bairros competem entre si. Usar Kong Studios para o lugar, Kong FM para a estação e nomes funcionais para menus.
6. **Excesso de camadas editoriais.** Eras, nove temas, cinco descobertas e quatro arquivos de bairro precisam de uma relação simples. Proposta: eras contam a cronologia; descobertas são o percurso; temas aprofundam o assunto.
7. **Bastidores com linguagem de desenvolvimento.** Expressões como “enviado pelo usuário”, “14 texturas” e “provisório” deixam a entrega com cara de processo interno. Manter créditos e limitações com linguagem editorial; detalhes técnicos ficam na documentação.

## Primeira alteração aplicada

- Destino, estado e ação principal do passeio permanecem visíveis com o menu fechado.
- Menu “Gorilazz Studios” passou a “Mapa e controles”.
- Importação de músicas passou de rótulo não focável para botão operável por teclado.
- Velocímetro deixou de ser uma região de anúncio contínuo para leitores de tela.
- Textos editoriais ganharam tamanho e entrelinha; notas e créditos ganharam legibilidade.
- Campos, seletores e resumos têm foco explícito; diálogos contêm a rolagem.
- Retratos têm dimensões declaradas; navegador recebe a cor de tema.
- Pedais permanecem disponíveis em telas estreitas mesmo com ponteiro de mouse.
- No modo sem 3D em celular, roteiro e mapa usam os cantos superiores: o painel deixou de bloquear o rádio em 320 px.
- Opções do rádio usam uma linha com quebra, evitando uma coluna excessivamente alta.

Direção desta etapa: preservar a paleta e as fontes existentes, alinhar o painel à esquerda e manter o mundo como protagonista. O painel deve responder “onde vou e o que faço agora”; ajustes de câmera e opções continuam no menu.

## Prioridades até a entrega

| Prioridade | Trabalho | Aceitação |
| --- | --- | --- |
| P0 | Consolidar entrada e roteiro | Uma pessoa nova inicia e abre a primeira história sem explicação do apresentador |
| P0 | Unificar o recorte editorial | Datas, cidade, diário e página explicam o mesmo recorte ou distinguem explicitamente os recortes |
| P0 | Conferir textos e fontes | Afirmações de datas, lançamentos e desempenho comercial têm fonte registrada; links são abertos e conferidos |
| P0 | Fechar atribuições das peças | A origem do diorama Noodle deixa de estar “em identificação”; se não for resolvida, substituir a peça por arte autoral |
| P0 | Validar aparelhos reais | Fluxos principais utilizáveis em um computador e um Android intermediário; iPhone se fizer parte do público |
| P0 | Ensaiar versão publicada | URL final abre em sessão limpa; modelos, áudio, links, HTTPS e retorno de erro conferidos |
| P1 | Melhorar câmera inicial e três marcos | Capturas distinguem estúdio, região costeira e moinho sem depender dos rótulos |
| P1 | Explicar rádio e clipes | Visitante entende quais faixas tocam no mundo e quais abrem conteúdo externo |
| P1 | Conclusão do percurso | Quinta descoberta oferece resumo, diário e convite à leitura, com progresso preservado |
| P1 | Limpar CSS acumulado | Consolidar regras sobrepostas de HUD após aprovação visual, com comparação antes/depois |
| P2 | Expandir mapa, rigs e animações | Adiar para depois da entrega; dependem de novos assets e validação extensa |

## Calendário proposto

| Datas | Entrega de trabalho |
| --- | --- |
| 10–13/11 | Fechar escopo, consolidar navegação e confirmar critérios exigidos pela avaliação |
| 14–18/11 | Polir enquadramento inicial, marcos, rádio e consistência editorial |
| 19–23/11 | Testar com pelo menos três pessoas; medir carga e fluidez em aparelhos reais; corrigir os bloqueios encontrados |
| 24–26/11 | Revisar fontes, créditos, links e comportamento da versão publicada |
| 27–29/11 | Congelar funcionalidades, corrigir regressões e ensaiar apresentação com cópia local disponível |
| 30/11 | Entregar versão identificada, endereço final, documentação e demonstração |

Esse calendário é uma proposta de escopo, não uma promessa de execução automática futura. A rubrica acadêmica e a hospedagem ainda não estão identificadas nesta revisão.

## Verificação e limites

- Verificação de sintaxe e 41 testes de lógica passaram após as alterações de código.
- O smoke existente cobre entrada, passeio, escolha de destino, interrupção manual, pausa fora da cena, diário e ausência de transbordamento horizontal em 1440, 390 e 320 px, além do modo sem 3D.
- Smoke de navegador concluído em desktop, 390 px, 320 px e sem 3D, incluindo chegada e diário. Capturas finais de direção, menu, leitura móvel e cabine examinadas em `artifacts/delivery`.
- `python scripts/audit-delivery.py` acrescenta verificação da ação principal fora do menu, importação de áudio com Enter, retorno do foco com Escape, pedais em emulação de toque e leitura em 1440, 390 e 320 px. Esse fluxo encontrou a sobreposição do roteiro com o rádio no modo sem 3D em 320 px, corrigida nesta revisão.
- A repetição final dessa auditoria passou nas três larguras, incluindo abertura do seletor de arquivos pelo teclado.
- Emulação de largura de tela não equivale a celular físico. Não foi atribuído FPS, nota Lighthouse ou tempo de carregamento a aparelhos que não foram medidos.
- Fontes históricas externas e licenças não foram revalidadas nesta etapa; menções acima apontam pendências explícitas do repositório, sem concluir irregularidade.
- O arquivo RTK.md referenciado nas instruções não foi encontrado no workspace.

Referência de interface consultada: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Os critérios de legibilidade, foco, semântica e interação foram usados como apoio; o diagnóstico de arte é específico deste projeto.
