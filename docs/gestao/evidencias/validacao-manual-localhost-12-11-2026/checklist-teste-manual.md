# Checklist de teste manual — Gorilazz

Marque cada item: [x] OK · [!] falhou (anote o que viu) · [-] não aplicável. Preencha data, aparelho e navegador no topo de cada rodada.

Rodada: data ____ · aparelho ____ · navegador/versão ____ · URL ____

## A. Emulação no desktop (DevTools, F12 → ícone de celular)
- [ ] A1. Página carrega sem tela branca; título correto.
- [ ] A2. Console (F12) sem erros vermelhos após carregar.
- [ ] A3. Botão "Quero dirigir" abre o mundo 3D; HUD aparece.
- [ ] A4. Segurar W acelera (velocidade sobe acima de 0 km/h); soltar e segurar S freia.
- [ ] A5. A/D viram; botões ←/→/FREIO/ACELERAR na tela respondem ao toque ou clique mantido.
- [ ] A6. Tecla E perto de um local abre a descoberta; Esc/fechar volta.
- [ ] A7. Botão "Ir até lá" e minimapa funcionam.
- [ ] A8. Redimensionar a janela não quebra o layout.

## B. Conteúdo e navegação (qualquer dispositivo)
- [ ] B1. Menu 01–09 leva a cada seção sem travar.
- [ ] B2. Linha do tempo: trocar entre as oito eras atualiza o texto.
- [ ] B3. Links externos abrem em nova aba (ícone ↗).
- [ ] B4. Botão "ABRIR CLIPE" mostra o clipe só após clique; nada toca sozinho.
- [ ] B5. Créditos (CC BY 4.0, Phase 7, Geep/shabaev) aparecem nas seções de fontes.
- [ ] B6. Downloads de GLB/ESCULTURA iniciam download (requer internet).
- [ ] B7. Recarregar a página mantém o progresso; botão "reiniciar" da estrada zera.

## C. Aparelho físico (obrigatório antes de entregar)
- [ ] C1. Celular: abrir pela URL publicada; layout legível em retrato.
- [ ] C2. Celular: botões de direção respondem ao toque (sem atraso perceptível).
- [ ] C3. Celular: girar para paisagem; cena continua ocupando a tela.
- [ ] C4. Celular: fluxo de conteúdo (sem dirigir) funciona com rolagem por toque.
- [ ] C5. Tablet ou segundo aparelho, se houver: repetir C1–C2.
- [ ] C6. Desempenho: anotar FPS aproximado ou se a cena trava (aparelho antigo é o caso crítico).
- [ ] C7. Testar com bateria baixa/modo economia, se possível.

## D. URL publicada
- [ ] D1. Abrir a URL publicada; confirmar que é a mesma versão a validar (anotar commit ou data).
- [ ] D2. Repetir A1–A3 e B1 na URL publicada.
- [ ] D3. Verificar que os modelos 3D e as imagens carregam (sem 404 no console).

## Observações da rodada desktop (12/11/2026, localhost)
- A2/A4 (segurar W): não comprovado; o injetor da ferramenta não moveu o carro. Repetir com teclado real.
- B7 (persistência): chave `gorilazz.world.v1` gravada e intacta após recarregar; falta confirmar que uma descoberta é salva.
- Passeio guiado (sem item próprio): OK, o carro se move sozinho e o botão "Parar passeio" aparece.
- Rádio (sem item próprio): OK, o botão alterna entre "Tocar rádio" e "Pausar rádio".

## Como registrar
Salve capturas em esta mesma pasta (`validacao-manual-localhost-12-11-2026/` ou uma nova por rodada), com nome `YYYY-MM-DD_aparelho_item.png`, e anote o resultado no `resultado.md` ou em uma cópia nova.
