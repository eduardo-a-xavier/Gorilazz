# Revisão do Gorilazz — história e experiência

Revisão editorial: 29/10/2026. Recorte: **1998–2023**. Esta entrega aprofunda o conteúdo e corrige problemas de interação; não é uma declaração de perfeição ou certificação de acessibilidade.

## O que a história acrescentou ao projeto

A força de Gorillaz está na articulação entre criação musical, desenho, personagens e colaboração. O percurso passou a apresentar essas camadas de forma identificável:

- **História real:** criadores, gravações, lançamentos, convidados e shows.
- **Narrativa virtual:** as histórias de 2-D, Murdoc, Noodle e Russel.
- **Interpretação do projeto:** o circuito, as atmosferas e o moinho provisório.

As oito eras são Gorillaz, Demon Days, Plastic Beach, The Fall, Humanz, The Now Now, Song Machine e Cracker Island. A origem em 1998 e o EP de 2000 aparecem junto da estreia de 2001. O percurso termina em 2023 por escolha editorial; isso não implica ausência de lançamentos posteriores.

## Pontos encontrados e mudanças

| Ponto | Mudança e efeito |
| --- | --- |
| Textos muito curtos e genéricos | Linha do tempo com contexto real, ficção, interpretação e uma escuta para cada era; nove painéis temáticos ampliados. |
| Datas pouco contextualizadas | The Fall apresenta digital em 2010 e edição física em 2011. |
| Personagens e artistas misturados | Fichas identificam os papéis ficcionais e os vínculos com criadores, vozes e músicos reais. |
| Carro e moinho sem contexto musical | Geep relacionado à iconografia de 19-2000; moinho provisório relacionado à ideia visual de Feel Good Inc. |
| Modelos de uma única fase em toda a cronologia | A página informa que usa modelos Phase 7 em todas as eras. |
| Rádio com lacunas entre épocas | Onze sugestões, incluindo The Fall, The Now Now e Song Machine. Sem ID de vídeo cadastrado, abre uma busca explícita pelo clipe oficial. |
| Texto mudava durante o deslocamento | Menu de leitura apenas seleciona conteúdo; deslocamento exige os controles ou um botão explícito. |
| Renderização contínua ao ler outras seções | IntersectionObserver pausa renderização e tour fora da estrada; limite aproximado de 30 fps na tela pequena. |
| Progresso perdido ao recarregar | Posição e personagens únicos persistem localmente, com validação e alternativa sem armazenamento. Botão explícito para reiniciar. |
| Perda de contexto gráfico | Mostra a estrada 2D e reconecta o 3D quando o contexto retorna. |
| Créditos técnicos dominavam a navegação | Downloads e referências 3D ficam em uma seção recolhível, mantendo os créditos e os links da banda visíveis. |

## Fontes e limites da pesquisa

Tentativas reais de consulta nesta revisão:

| Destino | Resultado |
| --- | --- |
| https://www.gorillaz.com/ | Bloqueado pela rede: 403 no túnel do proxy. |
| https://www.britannica.com/topic/Gorillaz | Bloqueado pela rede: 403 no túnel do proxy. |

Os domínios foram adicionados ao rascunho de configuração, preservando os domínios anteriores. O estado observado da máquina continuou sem esses destinos liberados; salvar o rascunho não aplicou nem publicou a configuração.

A revisão usa conhecimento histórico e referências indicadas para conferência. **A checagem documental online não foi concluída.** Não foram inventadas informações sobre lançamentos após 2023 nem apresentados links como páginas efetivamente consultadas. O site e o canal oficial, a página de histórico e a cronologia secundária de The Fall estão indicados em `src/content.js` e `REFERENCES.md`.

Uma revisão acadêmica final deve conferir essas fontes, registrar as referências bibliográficas exigidas pela instituição e decidir se amplia o recorte para lançamentos posteriores. A leitura de temas nas letras e nos clipes está identificada como interpretação, não como intenção definitiva dos autores.

## Validação executada

- `npm run check`: sintaxe do servidor e dos módulos da aplicação.
- `npm test`: **17 testes passaram**, sem falhas ou casos ignorados. Verificam circuito, referências internas, associação entre eras e faixas, rotas de escuta e comportamento do armazenamento. Esses testes não comprovam a exatidão histórica das fontes.
- Chromium real com WebGL por software: carregamento da banda e do Geep, oito eras, onze sugestões e nove paradas; seleção por teclado; texto estável durante deslocamento; progresso após recarga, contagem única e reinicialização.
- Instrumentação real de chamadas WebGL confirmou renderização ativa na estrada e ausência de novas chamadas após sair da seção.
- Perda e restauração de contexto WebGL foram exercitadas no navegador.
- Navegação para Plastic Beach chegou à posição e à escuta correspondentes; fichas dos quatro integrantes mantiveram a associação correta.
- Layout móvel e controles foram testados por emulação, sem substituir testes em aparelhos físicos.
- JavaScript desativado: resumo histórico legível e botões inativos ocultos.
- Armazenamento bloqueado e módulo 3D indisponível: fichas continuaram utilizáveis.
- A incorporação de vídeo foi testada com resposta externa simulada. Não foi validada a reprodução real dos vídeos nem a disponibilidade dos visualizadores Sketchfab.

## O que continua pendente

- Conferência documental online após aplicar a liberação de rede.
- Bibliografia acadêmica formal e eventual ampliação do recorte além de 2023.
- Teste com leitores de tela e em aparelhos físicos; não há afirmação de conformidade de acessibilidade.
- O moinho original escolhido no Sketchfab segue sem download disponível; o circuito usa a versão provisória própria, com essa distinção mantida nos créditos.
