# GZ-05 — origem e licença do diorama de Noodle

Data da consulta: 12/11/2026. Escopo: pesquisa e inventário somente; nenhum crédito, licença ou código foi alterado.

## Resultado

**Decisão recomendada: não distribuir nem apresentar o diorama incorporado como asset liberado enquanto sua publicação original e licença não forem identificadas.** Se a origem não puder ser comprovada a tempo, substituir por uma cena/arte criada para o projeto, sem personagem protegido; outra opção é remover a peça. A substituição autoral também deve evitar sugerir que a personagem ou o universo Gorillaz sejam de autoria do projeto.

## Evidência local confirmada

- `assets/environment/CREDITS.txt` registra que `noodle.zip` foi fornecido pelo usuário e continha `Character.fbx` e texturas `Noodle_UV`, `Windmill_UV`, `Rock_UV` e `RockBump_Normals`. Registra conjunto estático de personagem, ilha e moinho, sem rig/animação; redução de 306.208 para 48.000 triângulos, reconexão de texturas, redimensionamento para 1024 px e exportação GLB.
- `assets/environment/manifest.json` registra `author: null`, `license: null`, origem individual “under identification”, arquivo `noodle-diorama.glb` e SHA-256 `b5f34c8e6f3e648fc2b7c02ad66b052764802c816d5763c7415ef6bbcf616642`.
- A busca de arquivos do repositório encontrou `assets/environment/noodle-diorama.glb`, mas não encontrou `noodle.zip` nem `Character.fbx`. Assim, o pacote de origem não pode ser reexaminado aqui.
- A própria trilha de créditos aponta apenas para uma busca geral do Sketchfab (`https://sketchfab.com/search?features=downloadable&q=gorilaz&type=models`), que não prova qual resultado foi baixado, sua autoria ou licença.

## Pesquisa externa e candidatos

- **Candidato visual, não correspondência confirmada:** [Flying Windmill Island (Gorillaz), Carlos.Colado](https://sketchfab.com/3d-models/flying-windmill-island-gorillaz-247b6624576b48e59ee44af5a71e0e2f). A página descreve ilha flutuante com moinho associada a vídeos de Gorillaz. Resultado pesquisável informa cerca de 64 mil triângulos. Não identifica Noodle no modelo nem prova que este seja o conteúdo do `Character.fbx`; tampouco foi confirmada uma licença nesta consulta. **Não atribuir este arquivo ao candidato local.**
- **Candidato de personagem, não correspondência confirmada:** [Noodle — Gorillaz, ArbitraryCanary](https://sketchfab.com/3d-models/noodle-gorillaz-05d78956ed1e4252971a1d38ee95004c). A página identifica uma personagem Noodle e exibe CC Attribution. O resultado informa 33,2 mil triângulos, ao passo que o registro local descreve um FBX de 306.208 triângulos e diorama com ilha/moinho. Não há prova de que esse modelo, seu autor ou licença correspondam ao diorama fornecido.
- A busca exata por nomes de texturas e FBX não retornou correspondência pública indexada que ligue esses arquivos a uma página individual. Resultados de busca não substituem inspeção de pacote, identificador do modelo ou confirmação do fornecedor.

## Não confirmado / limites

- Autor/modelador, página original, URL de download, versão e termos da licença do diorama; eventual permissão para redistribuir o arquivo convertido; autoria e licenciamento separados do personagem e do cenário.
- Correspondência entre qualquer candidato público e o arquivo recebido. Nome de ZIP, aparência temática e contagem de polígonos isoladamente não são prova suficiente.
- Não foi possível consultar a conta/histórico de downloads de quem forneceu o pacote nem recuperar o ZIP no repositório. Isso exige o arquivo original ou a URL/página individual e recibo/histórico da origem.

## Próximas verificações

1. Pedir ao fornecedor o ZIP original intacto, URL da página individual e nome do autor/publicador; guardar data de obtenção e captura/PDF dos termos aplicáveis.
2. Comparar o FBX original e texturas com os candidatos: hierarquia/nomes de nós, dimensões e hash de texturas, contagem de faces antes da conversão e inspeção visual do modelo. Tratar semelhanças como indício, não atribuição definitiva.
3. Abrir a página individual e seus termos oficiais, confirmar a licença exata e se ela cobre os componentes redistribuídos; registrar atribuição exigida, modificações e licença de cada componente. A licença do upload não prova titularidade sobre personagem Gorillaz.
4. Se qualquer ponto essencial permanecer sem prova, retirar o diorama incorporado e usar arte própria sem personagem protegido, ou remover a peça da entrega.

## Fontes consultadas

- Evidência do projeto: `assets/environment/CREDITS.txt`, `assets/environment/manifest.json` e presença do arquivo `assets/environment/noodle-diorama.glb`.
- Busca geral indicada no projeto: https://sketchfab.com/search?features=downloadable&q=gorilaz&type=models
- Páginas públicas de candidatos listadas acima. A informação pública foi usada somente para avaliar candidatos, não como confirmação de origem/licença do arquivo local.
