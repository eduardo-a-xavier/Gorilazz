# Preparação do GitHub Pages — 12/11/2026

Alvo: `https://eduardo-a-xavier.github.io/Gorilazz/` (subcaminho `/Gorilazz/`). Sem commit, push, ativação do Pages ou publicação; servidor da porta 3000 (PID 22696) não foi reiniciado e continua servindo o site normalmente (`/` e `/assets/...` respondem 200).

## O que mudou

1. **28 caminhos absolutos viraram relativos** (`/assets/...` e `/src/...` → `./assets/...` e `./src/...`): `index.html` (14 ocorrências em 10 linhas: 3 CSS, `app.js`, links de download e créditos), `src/app.js` (1), `src/environment.js` (4), `src/materials.js` (2), `src/local-radio.js` (2) e `src/scene.js` (5). URLs de loaders resolvem contra a página (que fica na raiz do site), então funcionam em `localhost:3000/` e em `/Gorilazz/`. Os `import` entre módulos já eram relativos. Nenhum caminho absoluto restou em `index.html` e `src/*.js`. Diff: `changes.diff`.
2. **`.github/workflows/pages.yml`** (cópia em `pages.yml` nesta pasta): dispara em push para `main` e manualmente; permissões `contents: read`, `pages: write`, `id-token: write`; ambiente `github-pages`; `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4`. Antes de montar o site roda `npm run check` e `npm test` (sem dependências a instalar; `package.json` não tem). O passo de montagem lê a lista de rotas de `server.mjs` e copia só esses arquivos para `_site` (62 arquivos, ~24 MB) mais `.nojekyll`; falha se a lista tiver menos de 50 rotas ou se faltar algum arquivo. Ficam de fora `docs/`, `tests/`, `scripts/`, `artifacts/`, `.github/`, `package.json`, `server.mjs`, `README.md` e `assets/models/sketchfab-references.json` (não é servido).
   - Foram acrescentados `actions/checkout@v4` e `actions/setup-node@v4` (necessários para o job; fora da lista pedida).
   - **O GLB original de 9 MB (`gorillaz-phase7.glb`) foi mantido**: é necessário. `index.html` tem dois links de download para ele ("baixar banda GLB") e `src/scene.js:599` o usa como alternativa se o GLB web falhar. Remover quebraria esses links.
   - O diorama arquivado (`noodle-diorama.glb`) não está no disco nem na lista de rotas, portanto não vai para o Pages.

## Prova em subcaminho

Cópia estática (`montar-site-estatico.mjs`, que é o mesmo código do passo do workflow) servida por `servidor-subcaminho.mjs` em porta efêmera própria (45265 na primeira tentativa, descartada por um bug do meu servidor de teste; a prova é a segunda, porta 43290), apenas sob `/Gorilazz/`, com distinção de maiúsculas e sem gzip, como no Pages:

- Página `http://127.0.0.1:43290/Gorilazz/?perf`: título carregado, canvas criado, `window.__gorilazz` presente; status "MUNDO ABERTO / 3D EM TEMPO REAL", "PHASE 7 / QUATRO INTEGRANTES NO CIRCUITO", "GEEP / SHABAEV / CC BY 4.0" e "KONG STUDIOS / ESCULTURA 2-D E JARDIM DE FREQUÊNCIAS ORIGINAL".
- Log do servidor (`requests-subcaminho.log`): **64 requisições, todas 200, zero 404** (incluem os 5 GLBs de cena — estúdio, escultura, árvore, Geep e banda web —, 4 retratos, 12 PNGs de materiais usados na cena, `concreto.mp3`, CSS e módulos; mais 3 GLBs de download e `mare.mp3`, que verifiquei com HEAD).
- Os quatro retratos da galeria (lazy) carregaram com 384 px de largura depois da rolagem; os 9 links `./assets/...` de download e créditos e `mare.mp3` responderam 200.
- Captura: `subcaminho-Gorilazz.png`.

## Tipos e cabeçalhos dos `.glb` (servidor de teste) e o que só o Pages confirma

Verificado na cópia estática (`glb-tipos-cabecalhos.json`), para os 8 `.glb` servidos (o diorama arquivado não está mais na lista): resposta 200; `Content-Type: model/gltf-binary`; `Content-Length` igual aos bytes lidos; sem `Content-Encoding` (binário); cabeçalho do arquivo com magia `glTF`, versão 2, comprimento igual ao tamanho do arquivo; bloco JSON `JSON` com `asset.version` 2.0; sem URIs externas (texturas e buffers embutidos). `gorillaz-phase7-web.glb` exige `EXT_texture_webp` (suportada pelo Chromium; a alternativa `gorillaz-phase7.glb` não exige extensão).

Também verifiquei a **caixa das referências**: o servidor de teste roda no Windows e ignora maiúsculas/minúsculas, então ele não detectaria um erro que o Pages (Linux) detectaria. Por isso comparei cada caminho `./assets/...` e `./src/...` de `index.html` e `src/*.js` com `git ls-files` (22 literais, 0 divergências; os nomes com `${}` batem com os 4 retratos e 15 materiais rastreados).

**Só poderá ser confirmado no Pages publicado** (não verificado por mim):
- o `Content-Type` real servido para `.glb` (o `GLTFLoader` não depende dele; baixa como `arraybuffer`);
- compressão (gzip) e `Cache-Control`/`ETag` do Pages, que não são os do `server.mjs`;
- o redirecionamento de `/Gorilazz` para `/Gorilazz/`;
- o primeiro carregamento sem cache em rede de celular (24 MB no total, 3,3 MB do GLB da banda web);
- se o WebP embutido do GLB da banda carrega nos navegadores de Eduardo;
- o comportamento do ambiente `github-pages` (aprovação, regras de proteção) e o tempo do primeiro deploy.

## Passos para o Eduardo ativar

1. Revisar e fazer o commit e o push das mudanças em `main` (o workflow só roda se estiver em `.github/workflows/` no repositório).
2. No GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Em **Actions**, acompanhar "Publicar no GitHub Pages". O primeiro deploy pode pedir aprovação do ambiente `github-pages`, dependendo das regras do repositório.
4. Abrir `https://eduardo-a-xavier.github.io/Gorilazz/` (com a barra final) e confirmar cena, banda e rádio.
5. Se o repositório for privado, o Pages depende do plano da conta.

## Limitações

- O workflow **não foi executado** no GitHub; só foi validado como YAML e o passo de montagem foi executado localmente (62 arquivos, mesmos que o servidor serve). Versões das ações e permissões seguem o pedido e a documentação indicada, mas não confirmei contra o GitHub.
- Não testei reprodução de áudio nem o player do YouTube no subcaminho (autoplay depende de gesto do usuário; YouTube precisa de internet); apenas as requisições do MP3.
- Sem teste em outros navegadores. O Pages serve com cache próprio (`max-age=600`) e sem `ETag` personalizado, ao contrário do `server.mjs`.
- `server.mjs` e `tests/` não foram alterados; o teste de servidor continua verificando rotas absolutas do servidor local.
- Links absolutos que apontem para a raiz do domínio em outras partes (README, docs) não foram verificados: só `index.html` e `src/*.js` entram no site.
