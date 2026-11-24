# Relatório de QA — Validação de Publicação Estática sob Subcaminho `/Gorilazz/`
**Data:** 24/11/2026  
**Ambiente:** Google Chrome Real (`headless=False`, 1440x900)  
**Servidor de Subcaminho:** `servidor-subcaminho.mjs` sob `http://127.0.0.1:8338/Gorilazz/`  
**Destino de Evidências:** `docs\gestao\evidencias\validacao-publicacao-subcaminho-2026-11-24\`  
**Auditor:** QA Gorilazz (Qualidade e Entrega)  
**Status Geral:** **100% HOMOLOGADO (ZERO 404 / ZERO ERROS NO CONSOLE)**

---

## 1. Resumo Executivo

A Engenharia Gorilazz realizou a conversão sistemática de caminhos absolutos (`/assets/...`) para caminhos relativos (`./assets/...`, `../assets/...`) em:
- `src/content.js` (referências às capas de álbuns e descobertas)
- `src/editorial.css` (fontes Anton)
- `assets/art/manifest.json` (19 artes WebP do manifesto e murais)
- `server.mjs` (declaração literal das 8 capas de álbuns para inclusão na montagem estática)

A montagem estática via `docs/gestao/evidencias/hospedagem-pages-2026-11-12/montar-site-estatico.mjs` empacotou **152 arquivos** (anteriormente ~62 arquivos em 12/11/2026). A suíte de validação automatizada navegou em todos os subsistemas interativos via Google Chrome servido estritamente pelo prefixo `/Gorilazz/`.

---

## 2. Matriz de Resultados por Cenário Testado

| Cenário de Teste | Critério de Aceite | Resultado Medido | Veredito | Detalhes Técnicos |
|---|:---:|:---:|:---:|---|
| **Redirecionamento `/Gorilazz`** | 301 para `/Gorilazz/` | 301 Moved Permanently | ✔ **APROVADO** | Redirecionamento canônico preservado pelo servidor de subcaminho. |
| **Erros HTTP (404 / 5xx)** | **0 erros** | **0 erros (107/107 OK)** | ✔ **APROVADO** | 106 requisições com status 200 e 1 com 301. Nenhuma requisição 404 registrada no log do servidor. |
| **Erros de Console** | **0 erros** | **0 erros** | ✔ **APROVADO** | Nenhuma mensagem de erro de runtime, carregador Three.js ou CSS. |
| **Carga Inicial e Vitrine** | $\le 12$ MB inicial | **11,5 MB** (59,9 FPS) | ✔ **APROVADO** | Vitrine rotacionando suavemente a 60 FPS; carga inicial dentro do orçamento. |
| **Mundo 3D em Tempo Real** | $\ge 50$ FPS sem falhas | **59,8 FPS** | ✔ **APROVADO** | Geep, cenário Kong Studios, shaders e texturas carregados perfeitamente sob `./assets/...`. |
| **4 Cards da Banda (`#band-grid`)** | 4/4 imagens e modais | **4/4 carregados** | ✔ **APROVADO** | Imagens com largura natural de 384 px (`phase7-*.png`), diálogos modais `#character-dialog` abrindo para 2-D, Murdoc, Noodle e Russel com som e bio. |
| **Linha do Tempo das 8 Eras (`#eras`)**| 8/8 capas de álbuns | **8/8 carregadas** | ✔ **APROVADO** | Capas oficiais (600x600 px) carregadas via `./assets/covers/*.jpg` sem 404; alternância fato/ficção ativa. |
| **Central de Descobertas / Diário** | Diário e Manifesto OK | **Modal e 19 artes OK** | ✔ **APROVADO** | `#journal-dialog` abrindo com arquivos dos 4 bairros; fetch de `./assets/art/manifest.json` com status 200 e 19 assets válidos. |
| **Minigames (Fliperama e Piano)** | Canvas e controles ativos| **Ambos funcionais** | ✔ **APROVADO** | Fliperama Pac-Man (`#arcade-dialog`) com canvas e HUD; Teclado do 2-D (`#piano-dialog`) com as 4 colunas D, F, J e K operacionais. |

---

## 3. Comparativo de Payload e Tráfego com a Versão Anterior

| Métrica | Referência Anterior (12/11/2026) | Versão Atual Homologada (24/11/2026) | Análise Técnica |
|---|:---:|:---:|---|
| **Arquivos no Build Estático** | 62 arquivos | **152 arquivos** | Inclusão de todas as 19 artes WebP, 8 capas de álbuns, assets dos minigames e modelos GLB. |
| **Requisições de Rede (Navegação Completa)**| 64 requisições | **107 requisições** | Cobertura integral de minigames, timeline e galeria editorial. |
| **Payload Inicial da Vitrine** | ~9,0 MB | **11,5 MB** | Carga inicial compacta e eficiente para carregamento móvel e desktop. |
| **Payload Total Transferido (Toda a Sessão)**| ~24,0 MB | **20,32 MB** | Redução líquida de tráfego mesmo com o acréscimo de 90 novos arquivos, decorrente da compressão e uso de formato WebP otimizado. |

---

## 4. Evidências Digitais e Arquivos Gerados

1. **Relatório Estruturado em JSON:**  
   [publicacao-subcaminho-relatorio.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/publicacao-subcaminho-relatorio.json)
2. **Log Completo de Requisições do Servidor:**  
   [requests-subcaminho.log](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/requests-subcaminho.log) (107 requisições registradas).
3. **Capturas Visuais no Subcaminho `/Gorilazz/`:**  
   - [subcaminho-vitrine-inicial.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-vitrine-inicial.png)
   - [subcaminho-mundo-3d.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-mundo-3d.png)
   - [subcaminho-cards-banda.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-cards-banda.png)
   - [subcaminho-eras.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-eras.png)
   - [subcaminho-central-descobertas.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-central-descobertas.png)
   - [subcaminho-minigame-fliperama.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-minigame-fliperama.png)
   - [subcaminho-minigame-piano.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/subcaminho-minigame-piano.png)
4. **Script de Auditoria Executado:**  
   `docs/gestao/evidencias/validacao-publicacao-subcaminho-2026-11-24/executar_auditoria_subcaminho.py`.

---

## 5. Parecer de QA

A publicação estática sob o subcaminho `/Gorilazz/` (GitHub Pages) está **HOMOLOGADA** e pronta para deploy em produção. A substituição dos caminhos absolutos resolveu em definitivo os riscos de 404 em subdiretórios, garantindo total portabilidade do projeto.
