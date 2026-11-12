# Modelos da equipe Gorilazz A3

Revisão em 11/11/2026 a partir dos modelos e contas conectados no OpenBot. A escolha é por papel; não é uma afirmação de benchmark universal.

| Agente | Modelo e esforço | Uso esperado | Justificativa |
| --- | --- | --- | --- |
| Gorilazz Central | Claude Opus 5.5 · alto | arquitetura, prioridades, decomposição e consolidação | Trocado do GPT-6.1 Terra em 12/11/2026, a pedido do Eduardo, com a cota do Claude disponível. |
| Engenharia Gorilazz | Claude Sonnet 5.5 · alto (troca pendente) | mudanças focadas em HTML, JavaScript e Three.js | Troca do GPT-6.1 Sol aprovada em 12/11/2026; aplica no próximo turno, porque ela estava trabalhando. |
| Pesquisa Gorilazz | Claude Sonnet 5.5 · médio | fontes, fatos, créditos e comparação de referências | Trocado do GPT-6 Luna em 12/11/2026, a pedido do Eduardo. Cada afirmação ainda precisa de fonte verificável. |
| QA Gorilazz | Claude Haiku 5.5 · médio | critérios de aceite, matriz de validação e revisão de evidências | Revisão concisa de listas e evidências, mantendo a regra de usar Claude apenas no Haiku 5.5 médio. |

## Operação

- As tarefas de auditoria que já estavam em andamento começaram no GPT-6 Luna médio; a nova configuração vale nas próximas interações de cada agente.
- Regra de fallback definida pelo Eduardo em 12/11: se um agente atingir a cota, a troca vai para GPT-6 Luna; se o Luna também falhar, para Claude (Haiku 5.5 médio, conforme a regra do Eduardo).
- Não configurei troca automática de modelo. Se a cota de um modelo bloquear uma etapa, a Central informa o bloqueio e sugere uma alternativa antes de trocar.
- Os provedores usados na mudança estavam conectados quando foram consultados. Isso não garante cota futura.
- Diferenciar modelos não substitui briefs pequenos, critérios de aceite, revisão humana ou evidência de testes.

