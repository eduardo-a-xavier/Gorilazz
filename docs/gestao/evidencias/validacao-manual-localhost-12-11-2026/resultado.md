# Validação manual — http://localhost:3000 (12/11/2026)

Status: **parcial**. Emulação/navegador local apenas. Nenhum teste em aparelho físico. Rodada 2 incluída (passeio, rádio, persistência).

## Ambiente
- Servidor: já ativo, não foi parado nem reiniciado. `curl` retornou HTTP 200 em ~0,21 s.
- Navegador: navegador embutido do OpenBot (Chromium), viewport 1345×635, DPR 1. WebGL2 disponível.
- Código: não alterado. Nenhuma dependência instalada. Nenhum commit/push/publicação.
- Limite: não foi possível trocar para viewport de celular nem simular toque/orientação nesta ferramenta.
- Limite de entrada: a ferramenta só dá toque (`press`) ou eventos sintéticos de teclado; não há segurar tecla real.

## Resultados — rodada 1 (boot e modo 3D)

| # | Verificação | Tipo | Resultado |
|---|---|---|---|
| 1 | Página abre com título "Gorilazz — Um mundo para descobrir" | Emulação | OK |
| 2 | Canvas 3D presente e WebGL2 disponível | Emulação | OK (1 canvas) |
| 3 | Botão "Quero dirigir" entra no modo 3D; HUD (velocidade, minimapa, ←/→/FREIO/ACELERAR) aparece | Emulação | OK |
| 4 | Navegação por "01 INÍCIO", "05 ÁLBUNS", "09 FONTES" sem travar | Emulação | OK |
| 5 | Erros de JS após carregamento (`error` / `unhandledrejection`) | Emulação | Nenhum. Limite: gancho instalado após o boot; erros de boot não capturados. |
| 6 | Carro acelera com W (toque) | Emulação | Inconclusivo: 00 KM/H. Toque não é segurar. |
| 7 | Conteúdo informativo, créditos e licenças CC BY 4.0 no texto | Emulação | OK (leitura do texto) |

## Resultados — rodada 2 (segurar W, passeio, rádio, persistência)

| # | Verificação | Tipo | Resultado |
|---|---|---|---|
| 8 | Segurar W por `keydown` sintético por 2,5 s | Emulação | **Não moveu o carro**: 00 KM/H antes, durante e após soltar. Falha ou limite do injetor de teclado, não comprovada como bug do jogo. Segurar W real ainda precisa de teste no navegador do Eduardo. |
| 9 | Botão "Tocar rádio" | Emulação | OK: rótulo mudou para "Pausar rádio"; sem erro capturado. |
| 10 | "Fazer um passeio guiado" a partir da tela inicial | Emulação | **OK**: após recarregar, o botão apareceu; ao clicar, o texto mostrou "Passeio até Duas mentes, um universo" com botão "Parar passeio", e o HUD marcou 16 km/h (ASFALTO) em 3 s. Mostra que o carro se move sem input manual. |
| 11 | Persistência de progresso | Emulação | **Parcial**: a chave `gorilazz.world.v1` existe no `localStorage` com `vehicle` (x 0, z 0, heading 0) e `discovered: []`. Após recarregar, a chave ficou igual. Não houve descoberta a registrar, então não se prova que o progresso é salvo. Teste pendente: explorar um local (E) e conferir se `discovered` muda e persiste. |
| 12 | Erros capturados durante rádio e passeio | Emulação | Nenhum (gancho ainda instalado; recarregar zerou o gancho, então a leitura da rodada 2 após recarregar vale só para o passeio). |

Não testado: "Prefiro conhecer a história", tecla E em locais, linha do tempo (oito eras), downloads de GLB e prévias Sketchfab (dependem de internet), botão "reiniciar" da estrada.

## Lacunas (não comprovado)
- Aparelho físico (celular/tablet, toque, orientação, desempenho de GPU): **não testado**.
- URL publicada: **não testada**; esta rodada foi só localhost.
- Segurar W real: **não comprovado** (ferramenta só injeta eventos sintéticos).
- Captura de tela: a ferramenta não devolveu imagem; não há PNG nesta pasta.
- Nenhum arquivo do projeto foi modificado; esta pasta contém só este `resultado.md` e o `checklist-teste-manual.md`.

## Arquivos desta pasta
- `resultado.md` (este arquivo)
- `checklist-teste-manual.md` (roteiro para Eduardo repetir em aparelho físico e na URL publicada)
