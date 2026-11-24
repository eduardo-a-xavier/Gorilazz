# Correção de caminhos sob /Gorilazz/ — 24/11

Em uma carga local do site montado pelo script do workflow, o log registrou 20 respostas 404 antes da correção e nenhuma depois (96 respostas 200 observadas após entrar no 3D). As sessões não exercitaram exatamente os mesmos estados; não são uma comparação exaustiva. A montagem anterior omitia as oito capas porque eram rotas geradas dinamicamente; agora elas são declaradas e copiadas. URLs de capas e do manifesto são relativas ao documento; fontes no CSS são relativas ao CSS.

O navegador informou um ERR_CACHE_MISS inicial para uma fonte na sessão corrigida; a fonte depois carregou e document.fonts.check retornou true. Não se comprovou ausência universal de erros de console nem FPS/peso comparáveis. QA está verificando cards, eras, Central e minigames.

Validação: npm run check; npm test 220/220; testes de caminhos e de inclusão de capas na montagem.
