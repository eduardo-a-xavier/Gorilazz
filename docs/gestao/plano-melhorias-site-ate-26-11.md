# Plano — auditoria e melhorias do site inteiro até 26/11/2026

Pedido do Eduardo em 18/11: analisar o site inteiro, não só o carro, com base em dados, e concluir a entrega até **26/11/2026**.
Responsável pela coordenação: Gorilazz Central.

## Mapa do site (`index.html`, 24,7 KB)

| Área | Elementos |
| --- | --- |
| Cabeçalho e navegação | `header`, `nav.header-nav` (#eras, #radio, #band-title, #paradas) |
| Entrada e jogo 3D | `section#jogo`, `aside#journey`, diálogos `#discovery-dialog` e `#journal-dialog` |
| História | `section#eras`, `nav#era-menu`, `section#era-archive` |
| Trilha | `section#radio` (clipes) e a Kong FM do HUD |
| Universo | `section#paradas`, `nav#stop-menu` (“Nove olhares”) |
| Banda | `section.band-section`, `#character-dialog` |
| Bastidores | `details#backstage` (créditos), `section#modelos` e `#model-dialog`, `section#referencias` |
| Rodapé | `footer` |

Primeiro dado da Central: há `<h2>` sem texto acessível no HTML estático, e há 17 links externos.

## Fases

| Data | Fase | Saída |
| --- | --- | --- |
| 18–19/11 | Auditorias em paralelo, sem alterar código | QA: `evidencias/auditoria-site-2026-11-18/qa-ux.md`; Pesquisa: `.../pesquisa-conteudo.md`; Engenharia: `.../engenharia-tecnica.md` |
| 20/11 | Consolidação pela Central | Lista única de melhorias com prioridade, esforço e responsável |
| 20–24/11 | Implementação | Um responsável por arquivo; a Pesquisa entrega os textos e a Engenharia os aplica; check, test e capturas antes/depois |
| 25/11 | Regressão pelo QA | Checklist completo em desktop e em celular emulado |
| 26/11 | Pronto para o Eduardo | Lista de arquivos e comandos de commit; ensaio da URL se o Pages estiver ativo |

## Dependências do Eduardo

1. Fazer o commit e o push do trabalho pendente desde 12/11. As melhorias novas partem dele.
2. Ativar o Pages: Settings → Pages → Source: GitHub Actions.
3. Enviar a rubrica, se existir. Sem ela, “pronto” segue os critérios abaixo.
4. Fazer o teste em celular real e com pessoas novas. Os agentes não têm aparelho.

## Critério de pronto em 26/11

- Nenhum problema de gravidade alta aberto nas três auditorias.
- `npm run check` e `npm test` sem falhas.
- Nenhum 404 nem erro de console na navegação completa.
- Toda afirmação exibida tem fonte ou está marcada como interpretação.
- Créditos coerentes com os assets em uso.

## Regras

Sem commit, push ou publicação; Eduardo é o único autor. Não alterar créditos de contribuição nem licenças sem autorização. Não reiniciar processos que não sejam dos agentes; para teste, cada agente sobe o próprio servidor em porta livre (ex.: `PORT=3100 npm start`) e encerra ao terminar. Não instalar dependências.

## Consolidação das auditorias — 18/11/2026

| Prioridade | Entrega | Responsável | Dependências | Critério de aceite |
| --- | --- | --- | --- | --- |
| P0 acadêmico | Alinhar nove paradas, cinco capítulos, oito eras e cinco descobertas sem rótulos contraditórios | Pesquisa entrega texto; Engenharia aplica; QA valida | PDF A1 e `requisitos-pdf.md` | Cada número tem nome e finalidade consistentes no cabeçalho, cenário, diário e conteúdo editorial |
| P0 acadêmico | Corrigir fatos, separar fato/ficção/interpretação e completar referências | Pesquisa + Engenharia | `pesquisa-conteudo.md` | Sem “Londres” como origem confirmada; 2-D apenas “voz”; interpretações rotuladas; fonte por afirmação |
| P0 legal | Resolver direitos/créditos de capas, capturas e escultura 2-D | Pesquisa + Eduardo | Prova de licença/base de uso | Cada asset distribuído tem origem e licença comprovadas; item sem prova é removido/substituído |
| P1 técnico | Remover overflow horizontal em 320 px | Engenharia | `qa-ux.md`, captura mobile | `scrollWidth === clientWidth` em 320/375/390 sem cortar mapa ou legenda |
| P1 acessibilidade | Eliminar headings dinâmicos vazios | Engenharia | `index.html`, fluxo de boot | Auditoria DOM não encontra heading vazio; nome acessível existe antes e depois do boot |
| P1 navegação | Garantir acesso a Rádio e Banda no mobile e fluxo cenário → conteúdo | UX/Engenharia | inventário UX | Todas as seções alcançáveis por teclado e mobile; convite de transição claro |
| P1 robustez | Tratar prévias e links externos como dependência não crítica | Engenharia + QA | confirmação GET de `gorillaz.com` | Falha externa mostra mensagem recuperável e não quebra navegação; nenhum 404 local |
| P1 cenário | Demonstrar edição de asset no Blender e transformação/colisão no site | Plataforma B + Engenharia + QA | provedor dos agentes disponível | `.blend` reabre; GLB válido; visual e colisor alinhados; rollback documentado |
| P2 leitura | Aumentar microtextos e reduzir densidade de caixas/CTAs | UX/Engenharia | P0 editorial fechado | Textos de apoio legíveis em 320–1920 px; hierarquia de CTA consistente |
| P2 desempenho | Medir e, se necessário, adiar recursos 3D pesados até a entrada | Engenharia + QA | baseline de carregamento | Entrada editorial utilizável antes do 3D; ganho medido sem regressão visual |
| P2 manutenção | Mapear CSS repetido/morto antes de qualquer remoção | Engenharia | cobertura visual | Nenhum seletor removido sem captura/teste; check e testes aprovados |

## Decisão sobre o conteúdo abaixo do cenário

| Seção | Problema identificado | Decisão proposta | Justificativa | Interação prevista | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Transição após o cenário | Convite longo e continuidade fraca | Reformular e integrar | É a ponte entre dirigir e ler | Âncora curta para continuar a viagem | Alta |
| Oito eras | Fontes e recorte 1998–2023 precisam clareza | Manter | Requisito acadêmico da parada cronológica | Menu horizontal com indicação de rolagem | Alta |
| Rádio e clipes | Relação com as eras pouco explícita | Integrar | Música sustenta a narrativa | Ligações entre era e faixa, reprodução manual | Média |
| Nove olhares | Fato, ficção e interpretação se misturam | Reformular | O PDF exige nove paradas | Filtros/rótulos editoriais, sem efeito decorativo | Alta |
| Banda | Crédito repetido e conteúdo denso | Manter e simplificar | Personagens são parte obrigatória do conceito | Fichas acessíveis preservadas | Média |
| Bastidores/modelos/referências | Informação extensa e fragmentada | Manter recolhido e agrupar | Necessário para transparência e licenças | `details` por origem/licença | Média |
| Rodapé | Sem bloqueio identificado | Manter | Fecha autoria e independência acadêmica | Links oficiais e repositório | Baixa |

Nenhuma seção deve ser removida antes de fechar os requisitos acadêmicos e os direitos de uso. O carrinho, a rota, o diário e a reprodução manual de mídia são regressões proibidas.
