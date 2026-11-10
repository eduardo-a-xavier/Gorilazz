# Personagens e condução — vídeo de 10/11/2026

Referência: `20261110-2112-27.4021780.mp4`, 78,8 segundos. Inspeção de 24 quadros distribuídos pelo vídeo, comparada com o código atual. Não foram inferidos FPS do aplicativo a partir da gravação.

## Decisões confirmadas

- Velocidade máxima de ré: **15 km/h**.
- Preservar e articular os personagens atuais, sem recriá-los do zero.
- Quantidade de linhas de código não é um critério de qualidade do personagem. Malha, esqueleto, pesos, texturas e movimentos precisam funcionar juntos.

## Alterações desta etapa

`src/driving.js`: limite explícito de 15 km/h convertido para unidades físicas internas. Antes, −6 m/s correspondiam a 21,6 km/h, arredondados para 22 no painel. A aceleração de ré e a sequência de parar, soltar e pressionar novamente foram preservadas.

`src/band-pose.js`: substituição da deformação de posições e normais na CPU por `SkinnedMesh` e esqueleto de cinco ossos por malha: base do corpo, dois braços e dois antebraços. A malha e suas texturas permanecem; ombros e cotovelos passam a ser articulados por hierarquia. Os pesos são calculados na carga. O renderizador transforma os vértices na GPU; o loop de animação modifica os ossos. Instrumentos e baquetas continuam associados às poses existentes.

O limite desta entrega é importante: isso organiza a articulação dos braços, mas não equivale a um rig artístico completo. Os pesos ainda usam aproximação espacial; dedos, expressões, olhos, coluna e pernas ainda não receberam controles independentes. Os GLBs originais continuam estáticos, sem skins ou animações: o esqueleto é criado em execução. Nenhum arquivo de modelo foi substituído.

## Próxima etapa recomendada: rig artístico no Blender

1. Localizar os arquivos de autoria/FBX originais, se ainda disponíveis, para recuperar um eventual esqueleto antes de reconstruí-lo. Os dois GLBs atuais foram inspecionados: ambos têm zero skins e zero animações.
2. Trabalhar em cópias e preservar a autoria e as texturas. Corrigir pesos de ombro e cotovelo manualmente, principalmente na roupa, para que a deformação não puxe o tronco.
3. Acrescentar punho, palma e dedos; conectar mãos a alvos no teclado, escala da guitarra, baixo e baquetas. Usar cinemática inversa para contato, e animação autoral para gestos.
4. Acrescentar pescoço e coluna com movimentos discretos. Pernas e pés devem permanecer apoiados enquanto toca, sem deslizar.
5. Criar ciclos curtos distintos: repouso, tocar, olhar para o visitante e cumprimento. Fazer transições suaves entre eles; não aplicar um único balanço a toda a banda.
6. Exportar GLB com armature/skin e clipes nomeados. Validar a exportação e integrar sem fundir a malha articulada com os instrumentos estáticos.

### Características a reforçar sem mudar a identidade

| Integrante | Movimento prioritário | Detalhe de personalidade |
| --- | --- | --- |
| 2-D | Punhos sobre teclas, alternância de mãos, cabeça acompanhando o ritmo | Postura ligeiramente relaxada; preservar cabelo e olhos característicos |
| Murdoc | Dedilhado e mão apoiada na escala do baixo | Assimetria de postura e pequenos movimentos de cabeça |
| Noodle | Palhetada e mão da escala com posições definidas | Gestos mais precisos, mudança discreta de apoio do corpo |
| Russel | Baquetas com preparação, golpe e retorno; mãos acompanhando a pegada | Peso corporal estável e diferença entre golpes nos tambores e pratos |

Esses detalhes são propostas, não funcionalidades já implementadas. A gravação é majoritariamente de condução e não permite julgar de perto as deformações de todos os personagens.

## Outros pontos do vídeo

- **Ré (16–23 e 46–49 s):** o painel mostra 22. Corrigido para 15 km/h nesta etapa.
- **Retrovisores:** as duas superfícies com imagem da cena parecem monitores flutuantes nas laterais. Rever ancoragem à carroceria, haste, tamanho, orientação e recorte da imagem. Um reflexo atualizado não resolve a falta de integração física.
- **Câmera interna:** em vários momentos, o volante fica abaixo da borda e a vista parece acima do banco. Revisar altura dos olhos, FOV e posição inicial mantendo visão da rua.
- **Braços do motorista (23–26 e 49 s):** ainda têm aparência de blocos e exigem inspeção de contato com volante e console. O rig da banda modificado nesta etapa não modifica esses braços, implementados separadamente em `cabin.js`.
- **Velocidade de avanço:** 108 km/h torna curta a janela para ler e parar. Avaliar um modo de exploração mais lento; o limite de avanço não foi alterado sem necessidade nesta etapa.
- **Sinalização:** a variedade está melhor organizada, mas nomes pintados no chão e portais devem ser conferidos nos dois sentidos. Não declarar um nome invertido como defeito antes de verificar a pista à qual ele se destina.

## Ferramentas

**Blender local é a opção principal:** permite editar os modelos, revisar pesos e exportar articulação/animação em glTF. Referência: https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html

**Mixamo, da Adobe, é uma alternativa para rig e movimentos corporais de humanoides:** requer Adobe ID e envio do modelo. Não substitui automaticamente a autoria dos contatos mão–instrumento nem garante bons pesos em personagens estilizados. Referências oficiais: https://helpx.adobe.com/creative-cloud/help/mixamo-rigging-animation.html e https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

Nenhum modelo ou vídeo foi enviado a serviços externos. Não foi necessário instalar uma ferramenta para esta alteração.

## Validação

- Sintaxe e 44 testes de lógica passaram, incluindo limite de ré em três passos de simulação, desaceleração ao soltar, pesos normalizados, tronco estável, movimento dos braços e pose estável com movimento reduzido.
- No navegador, os quatro integrantes carregaram com cinco ossos cada. Foi verificado que os ossos mudam durante a animação enquanto os arrays de posições permanecem intactos.
- Capturas antes/depois: `artifacts/rig-review/before.png`, `after.png` e `animated.png`; aparência de repouso preservada na comparação.
- A migração evita o laço de reescrita dos vértices por quadro, mas não foi atribuído um ganho numérico de FPS sem benchmark comparável.
- `smoke-browser.py` passou em desktop, 390 px, 320 px e modo sem 3D, incluindo chegada e diário.
- A auditoria adicional encontrou um timeout intermitente no seletor de arquivos por teclado; uma repetição também foi interrompida quando o servidor local deixou de responder. Após reiniciar o servidor, `audit-delivery.py` passou integralmente nas larguras 1440, 390 e 320 px. A aprovação da última execução não elimina a observação de intermitência anterior.
- Aparelhos físicos e revisão artística de pesos/dedos ainda são necessários para a entrega final.
