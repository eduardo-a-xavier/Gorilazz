# Melhorias visuais e desempenho Three.js para navegador

Consulta: 12/11/2026. Pesquisa documental; os ganhos abaixo são qualitativos e não medidos no Gorilazz. Contexto do projeto informado pela Central: Three.js r180, GLBs de aproximadamente 13–19 MB, banda com 3,25 MB/104 mil triângulos; cena aérea observada com 415 draw calls e 520 mil triângulos. Não há medições em celular real. **Fatos** descrevem a documentação citada; **interpretação** é a recomendação aplicada ao projeto.

## Técnicas

### 1. Limitar resolução interna / pixel ratio
- **Fato:** `WebGLRenderer.setPixelRatio()` dimensiona o buffer de desenho; o manual responsivo alerta que renderizar à resolução nativa do aparelho pode reduzir bastante o framerate em aplicações pesadas. Fontes: [WebGLRenderer — setPixelRatio e setDrawingBufferSize](https://threejs.org/docs/pages/WebGLRenderer), [manual Responsive Design](https://threejs.org/manual/pages/responsive.html), trecho: “For any heavy three.js app that's probably what you want otherwise you're likely to get a slow framerate.”
- **Interpretação — ganho:** potencialmente muito alto em Android com alta densidade de pixels, pois reduz pixels fragment-shaded e largura/altura do buffer; queda de pixel ratio de 2 para 1 reduz a área de desenho em 75% (proporcionalidade geométrica, não benchmark do projeto).
- **Custo/risco:** imagem menos nítida; redimensionamento e efeitos que assumem resolução física precisam ser revistos.
- **Antes de 30/11:** sim, primeira mudança candidata, simples de reverter. Começar com teto testável (p.ex., 1.5 ou 1.0) e comparar em aparelho real.

### 2. InstancedMesh para repetições
- **Fato:** `InstancedMesh` desenha muitas cópias de geometria/material iguais com transformações diferentes e “reduce the number of draw calls”. Fonte: [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html).
- **Interpretação — ganho:** potencialmente alto para árvores, rochas, luzes ou módulos repetidos, sobretudo diante de 415 chamadas observadas; pouco efeito se a maioria dos objetos for única.
- **Custo/risco:** refatoração de criação/atualização, seleção individual e limites espaciais; exige manter materiais/geometry compatíveis.
- **Antes de 30/11:** sim, se inventário confirmar dezenas de repetições idênticas. Medir `renderer.info.render.calls` em percurso igual antes/depois.

### 3. LOD e impostores
- **Fato:** Three.js `LOD` escolhe objetos por distância; níveis são adicionados com `addLevel`. Fonte: [Three.js LOD](https://threejs.org/docs/pages/LOD.html). A documentação não promete uma taxa de ganho universal.
- **Interpretação — ganho:** alto para silhuetas distantes e objetos repetidos com muito detalhe; reduz vértices/desenho apenas se modelos simplificados substituírem geometria em distância. Impostor billboard pode reduzir ainda mais custo, mas é solução artesanal.
- **Custo/risco:** preparar meshes/atlas simplificados, transições pop, escala/iluminação inconsistente; impostores quebram em ângulos extremos.
- **Antes de 30/11:** LOD básico possivelmente; impostores não recomendados neste prazo sem gargalo validado e arte pronta.

### 4. Iluminação ambiente e PMREM/HDRI
- **Fato:** PMREM converte mapa de ambiente em amostras pré-filtradas conforme rugosidade; há exemplo oficial de HDR IBL com PMREM. Fontes: [PMREMGenerator](https://archive.threejs.org/docs/api/en/extras/PMREMGenerator.html), [exemplo oficial HDR envmap](https://threejs.org/examples/webgl_materials_envmaps_hdr.html). O HDR pode melhorar reflexos e luz ambiente sem multiplicar fontes diretas; isso não significa custo zero.
- **Interpretação — ganho:** visual potencialmente alto com um ambiente coerente e preenchimento suave; pode evitar muitas luzes/sombras, mas a geração e textura HDR ocupam tempo, transferência e memória.
- **Custo/risco:** HDR maior, conversão/tempo inicial, reflexos lavados ou direção artística alterada; arquivo de origem precisa licença verificada.
- **Antes de 30/11:** sim apenas com HDR pequeno/licenciado já disponível; preferir ambiente já compilado/otimizado e medir carregamento/memória. Não adotar HDR grande só por aparência.

### 5. Sombras baratas
- **Fato:** shadow maps renderizam objetos do ponto de vista de cada luz que projeta sombra; o manual exemplifica custo multiplicado por luzes e recomenda limitar resolução/área. PointLight exige seis faces e é mais lento. Fonte: [Three.js Shadows](https://threejs.org/manual/pages/shadows.html), trecho: “for every light that casts shadows all objects marked to cast shadows are rendered”.
- **Interpretação — ganho:** alto se sombras dinâmicas custarem; manter uma DirectionalLight, mapa pequeno e frustum apertado; desativar castShadow em detalhes; para objetos parados, baked/contact blob shadow pode dar leitura visual a baixo custo recorrente.
- **Custo/risco:** serrilhado, acne, sombras fora do frustum; blob/baked não acompanha movimento.
- **Antes de 30/11:** sim, limitar configurações existentes e comparar cenas. Não adicionar PointLight com sombra.

### 6. Espaço de cor e tone mapping
- **Fato:** Three.js trabalha em Linear-sRGB para iluminação e transforma a saída para sRGB; mapas de cor como PNG/JPEG devem ser anotados em sRGB. Renderer expõe `outputColorSpace`, `toneMapping` e `toneMappingExposure`; padrão atual documentado para tone mapping é `NoToneMapping`. Fontes: [Color Management manual](https://threejs.org/manual/pages/color-management.html), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer).
- **Interpretação — ganho:** fidelidade e contraste, não necessariamente mais FPS; tone mapping apropriado comprime highlights HDR e evita aparência estourada, se a cena tiver valores acima de display range.
- **Custo/risco:** ajuste estético subjetivo, possíveis discrepâncias em texturas/saída e pós-processamento; não resolve gargalo geométrico.
- **Antes de 30/11:** sim, revisão visual rápida de outputColorSpace e mapas; teste comparativo controlado de Neutral/ACES, mantendo exposição. Não prometer ganho de performance.

### 7. KTX2/Basis para texturas
- **Fato:** `GLTFLoader.setKTX2Loader()` habilita texturas KTX2 comprimidas; a GPU pode transcodificar para formato suportado. Fonte: [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html), [Khronos KTX](https://www.khronos.org/ktx/).
- **Interpretação — ganho:** reduz transferência e memória de textura em comparação a RGBA descomprimido, frequentemente melhora carregamento; triângulos e draw calls permanecem.
- **Custo/risco:** pipeline offline, decoder/transcoder JS/WASM e compatibilidade/fallback, compressão pode degradar mapas normais/artefatos; testar Android alvo.
- **Antes de 30/11:** condicional; alta prioridade se inventário mostrar texturas pesadas e houver pipeline simples. Caso contrário, risco de regressão supera benefício sob prazo.

### 8. Draco e meshopt para geometria
- **Fato:** Three.js requer `DRACOLoader` para extensão `KHR_draco_mesh_compression` e `MeshoptDecoder` para `EXT_meshopt_compression`. Fonte: [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [Draco — Khronos glTF](https://www.khronos.org/gltf/), [meshoptimizer](https://github.com/zeux/meshoptimizer).
- **Interpretação — ganho:** diminui bytes de geometria em rede; não reduz necessariamente número de triângulos depois de decodificado nem draw calls. Meshopt tende a encaixar como compressão de buffer eficiente; Draco pode atingir boa compressão com custo de decode.
- **Custo/risco:** processamento em build e decode CPU/memória, loaders/WASM, integração e possíveis incompatibilidades de export; em celular lento, menor download pode ser compensado por decode mais demorado.
- **Antes de 30/11:** apenas se peso de malhas dominar e der para converter/testar um asset piloto. Não converter tudo sem medir arquivo, decode e frame-time.

## Prioridade recomendada (interpretação)

1. **Limitar pixel ratio** (risco baixo, possível grande redução de pixels renderizados).
2. **Baratear sombras** (reduzir mapa/frustum e emissores; baixo custo de alteração e bom retorno se estão ativas).
3. **InstancedMesh para cópias confirmadas** (pode atacar as 415 chamadas, desde que a repetição exista). Se não houver instâncias repetidas, trocar esta terceira por LOD de objetos distantes.

Tone mapping/espaço de cor é recomendação de qualidade visual, não performance. HDRI e compressões são decisões condicionais ao conteúdo e medição. Números do projeto são contexto recebido, não reproduzidos nesta pesquisa. Validação pendente: Android intermediário real, navegador, temperatura/bateria, cena e percurso fixos; registrar frame-time percentis, draw calls, triângulos, bytes transferidos e erros visuais antes/depois.

