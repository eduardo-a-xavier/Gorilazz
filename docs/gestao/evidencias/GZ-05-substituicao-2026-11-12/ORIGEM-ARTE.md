# Origem da nova arte — GZ-05

- Obra: **Jardim de frequências**.
- Data de criação: **12/11/2026**, horário de São Paulo.
- Origem: composição procedural criada do zero nesta tarefa pelo agente Engenharia Gorilazz, a pedido de Eduardo; código em `src/environment.js`, função `createFrequencyGarden`.
- Desenho: três aros inclinados, sete barras com alturas diferentes e suporte circular. É uma escultura abstrata estática, **sem personagem**.
- **Nenhum material artístico de terceiros foi usado na criação da nova peça:** nenhuma malha importada, textura, imagem, personagem, referência visual externa ou parte do diorama anterior foi reutilizada. As formas são construídas com primitivas geométricas do Three.js já existente no projeto. A biblioteca de software tem seus próprios créditos/licença, preservados; isso não significa que todo o software da página seja de autoria desta tarefa.
- Paleta: cores já presentes na interface do projeto. Sem arquivos novos de imagem, textura ou GLB; sem importação de dependências.
- Escopo da criação: grupo `frequency-garden`. O pedestal e a placa comuns da exposição, o restante do cenário e os assets creditados existentes continuam separados dessa criação.
- Medição: 1.396 triângulos, 12 malhas, quatro geometrias compartilhadas, quatro materiais; 19.432 bytes em buffers de geometria únicos. O arquivo anterior tinha 48.000 triângulos e 1.251.404 bytes e foi preservado em disco, sem uso pela nova cena.
- Créditos/licenças: arquivos existentes intactos; nenhuma licença nova foi atribuída a terceiros ou ao arquivo antigo. Nenhum crédito antigo foi apagado. A página mantém o texto histórico sob aviso de substituição, com o controle de download desativado.

## Entrega e limite de aprovação

Esta entrega implementa a **arte abstrata original** do plano GZ-05 executado via Central. Não foi criado um personagem original. A palavra “personagem” na mensagem posterior de aprovação não deve ser usada para descrever esta peça nem como prova de que esse requisito diferente foi executado.

Antes/depois com mesmo enquadramento: `antes.png` e `depois.png`; método de câmera detalhado no README desta pasta. Diff: `changes.diff`. Validação após implementação: `check.log`, exit 0; `test.log`, 45/45 testes aprovados. Não houve alteração funcional adicional para registrar esta origem.

O saneamento de distribuição permanece parcial: o servidor compartilhado já iniciado ainda expõe a rota antiga e o GLB arquivado permanece na árvore. Consulte os três pontos de pendência no README antes de montar uma entrega pública. Nenhum reinício, remoção de dados, commit, push ou publicação foi realizado.
