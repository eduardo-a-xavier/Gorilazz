# Auditoria QA — UX, funcionamento e acessibilidade

**Data:** 18/11/2026. **Escopo:** árvore atual servida por servidor próprio em `http://localhost:3100/`, leitura e interação manual em desktop/celular emulado. Não houve alteração de código, instalação, commit, push ou publicação.

## Resultado executivo

O site carrega e expõe todas as áreas previstas. A navegação principal, eras, rádio, nove olhares, fichas da banda, bastidores, diálogos e diário são alcançáveis por teclado/semântica HTML. O diário registrou uma descoberta e o foco retornou ao controle que abriu os diálogos; a persistência permanece limitada ao armazenamento disponível no navegador. Foram encontrados dois problemas prioritários: overflow horizontal observável em 320 px e semântica vazia em títulos dinâmicos. A captura do Sketchfab gerou dois erros de rede `ERR_CACHE_MISS` de fontes de terceiro; não são 404 do produto.

**Fato** = observado no DOM, runtime, captura ou resposta HTTP. **Interpretação** = impacto provável para uma pessoa usuária; validar com teste de pessoas.

## Achados

| Área | Problema | Gravidade | Evidência com captura/dado | Sugestão |
|---|---|---:|---|---|
| Entrada / header | A entrada é clara e tem “Quero dirigir”, passeio guiado e leitura sem 3D. **Fato.** | baixa | Snapshot semântico revision 8: três ações e link de salto. | Manter; considerar microtexto explicando que o passeio é opcional. |
| Jogo / HUD | O canvas 3D recebe `role=img`, `aria-label`, mapa e controles HTML. **Fato.** | baixa | `index.html:21-27`; runtime mostrou canvas `251×536` em viewport CSS 375×829. | Manter mapa/diário como rota equivalente; testar com leitor de tela real antes da entrega. |
| Passeio / diário | Passeio guiado, descoberta, diário e recarregamento foram executados; diálogo abriu com contador `1/5`, mensagem de salvo e quatro itens ainda não descobertos. **Fato.** | baixa | Snapshot e capturas históricas na pasta; chave `gorilazz.world.v1` não refletiu `discovered` nessa sessão, portanto a persistência não ficou provada. | Registrar/mostrar claramente quando o progresso foi salvo e testar em perfil limpo e após reload. |
| Diálogos | Esc fecha o diálogo de descoberta e a ficha de personagem; foco retorna ao acionador. O modelo Sketchfab abre iframe de terceiro e captura seus erros de fonte. **Fato.** | média | Snapshot: `discovery-dialog`, `character-dialog`, `model-dialog`; diagnósticos: 2 `GET ...sketchfab...woff/woff2` com `net::ERR_CACHE_MISS`. | Incluir fallback textual/visual para prévia externa e monitorar falha de terceiro sem tratá-la como erro do produto. |
| Eras / navegação | As oito eras e nove olhares aparecem no DOM e foram alcançados por links/botões. **Fato.** | baixa | Snapshot semântico: botões `1998–2001` até `2023 Cracker Island`; `01`–`09` no `#stop-menu`. | Manter; revisar consistência editorial entre “4 épocas”, “8 eras”, “5 histórias” e “9 olhares”. |
| Rádio / clipes | Rádio local informa claramente que os clipes abrem YouTube; botão de vídeo e link externo estão presentes. **Fato.** | baixa | `desktop-radio.png`; `index.html:31`. | Manter aviso de internet/reprodução manual; considerar estado de bloqueio/autoplay explícito. |
| Contraste | A composição escura usa creme/acid/pink e foco de teclado foi visível nos controles observados. **Fato parcial.** | média | Capturas `desktop-radio.png` e `mobile-320-overflow.png`; contraste não foi medido por ferramenta WCAG. | Medir contraste automatizado/manual em todos os estados, inclusive foco, links e diálogos. |
| Celular 320 px | Há overflow horizontal real: `innerWidth=320`, `clientWidth=305`, `scrollWidth=308`; a captura mostra barra horizontal. O mapa SVG termina em `right=307.7` e uma legenda em `right=308.3`. **Fato.** | média | `mobile-320-overflow.png`; avaliação DOM. | Ajustar largura/box-sizing do mini-mapa e legenda para `max-width:100%`; repetir em 320/375. |
| Celular 375/390 px | Em 375 px foi medido `scrollWidth=361` contra `clientWidth=360` (1 px); em 390 px não houve diferença na amostra. **Fato.** | baixa | Avaliações DOM das revisões 9 e 11. | Eliminar também o pixel residual e confirmar em Safari/Android real. |
| Celular / textos | O conteúdo é longo e a timeline horizontal exige rolagem interna; não foi observado texto truncado no DOM, mas o screenshot 320 evidencia área estreita e barra. **Fato + interpretação.** | média | `mobile-320-overflow.png`; oito cards de era excedem o viewport por desenho de carrossel. | Dar indicação de rolagem e garantir que a rolagem interna não seja confundida com overflow da página. |
| Títulos | `#journey-title` (`h3`) e `#discovery-title` (`h2`) estão vazios no HTML inicial e são preenchidos por JS. **Fato.** | média | `index.html:24,43`; avaliação DOM: `emptyHeadings=[journey-title, discovery-title]`. Impacto interpretativo: leitor de tela pode anunciar região sem nome antes do boot/estado dinâmico. | Usar texto inicial acessível, ou remover o heading até haver conteúdo; garantir anúncio após atualização. |
| Foco / Tab | A ordem observada foi coerente e fechou o ciclo; controles ocultos não apareceram no snapshot semântico. **Fato.** | baixa | Execução anterior registrou 50 paradas e ciclo; snapshot atual lista controles nomeados. | Repetir com teclado físico e leitor de tela; verificar foco em carrosséis, `details` e iframe. |
| Sem JavaScript | Há fallback `noscript` com história, papéis, álbuns e autoria; botões e indicadores são ocultados no bloco `noscript`. **Fato.** | baixa | `index.html:9,33`. | Testar visualmente com JS realmente desativado em navegador dedicado; garantir que o fallback seja o primeiro conteúdo útil. |
| Clareza inicial | A página explica que é um projeto acadêmico independente e separa fatos/narrativa em várias áreas. **Fato.** | baixa | Texto de `index.html:30,40-45`; snapshot completo. **Interpretação:** primeira visita ainda precisa descobrir que “A história”, “A trilha” e “O universo” são âncoras. | Manter âncoras; considerar uma linha “comece por aqui” junto à entrada. |
| Links externos | 14 URLs externas únicas em `index.html` responderam: 12×200, YouTube×204, `gorillaz.com` com erro no HEAD. Os links locais consultados responderam 12×200. **Fato.** | média | `Invoke-WebRequest -Method Head` em 18/11; o plano menciona 17 links, mas a página atual contém 14 destinos externos únicos. | Repetir com GET/browser para `gorillaz.com`, registrar redirecionamentos e cobrir os 17 elementos declarados individualmente. |
| Rodapé / créditos | Rodapé, GitHub e crédito/licença aparecem; o conteúdo não foi cortado no DOM. **Fato.** | baixa | Snapshot semântico e `index.html:45`. | Manter; conferir licença da escultura 2-D conforme auditoria editorial. |

## Sequência reproduzível

1. Abrir `http://localhost:3100/` em 1366×768; verificar entrada, `A HISTÓRIA`, `A TRILHA`, `A BANDA`, `O UNIVERSO`.
2. Tabular da entrada ao botão “Quero dirigir”; confirmar foco; abrir e fechar o HUD/diário com Esc.
3. Iniciar passeio, esperar uma parada, usar “explorar”, conferir diálogo, foco de retorno e contador.
4. Recarregar; abrir diário; registrar se a descoberta permanece.
5. Ativar cada uma das oito eras e nove olhares; abrir rádio, ficha de personagem, bastidores e prévias 3D.
6. Repetir em 390×844 e 320×844; em 320 registrar barra horizontal.
7. Repetir com teclado real e leitor de tela; medir contraste WCAG; abrir a URL publicada quando existir.

## Limitações

Não foi possível validar aparelho físico, URL publicada, leitor de tela real, contraste por analisador, JS desativado em navegador dedicado, reprodução efetiva do YouTube, upload de áudio, fullscreen, todas as teclas mantidas pressionadas e a intenção de pessoas novas. O teste foi em emulação e em servidor local próprio na porta 3100; não foi reiniciado o servidor compartilhado da porta 3000.

## Evidências

- `desktop-radio.png`
- `mobile-320-overflow.png`
- `pesquisa-conteudo.md` (auditoria editorial correlata)
- Dados de runtime/HTTP registrados nesta auditoria; nenhum código do produto foi alterado.
