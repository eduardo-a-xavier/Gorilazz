# Origem da variante B (motorista gerado com TRELLIS)

Registro de crédito da variante B. **Removida do produto em 12/11/2026** (Eduardo escolheu a variante A): `assets/models/motorista-trellis.glb`, a rota, o carregador `?motorista=trellis` e o teste não existem mais no repositório. A cópia reduzida ficou em `trellis/motorista-trellis.glb`, só como registro.

| Item | Registro |
| --- | --- |
| Ferramenta | TRELLIS (Microsoft), imagem para 3D: "Image to 3D Asset with TRELLIS" |
| Demo usada | `https://huggingface.co/spaces/Microsoft/TRELLIS`, que em 12/11/2026 redirecionou para o Space `trellis-community/TRELLIS` (Gradio 5.34.2, "Running on Zero"), aberto em `https://trellis-community-trellis.hf.space/` |
| Data e hora | 12/11/2026, cerca de 23:03 UTC |
| Versão | Space `trellis-community/TRELLIS`, commit `91c1b5afbf24094b3ec7d8a27ae2e49608bd668f` (última alteração 24/05/2026); modelo `microsoft/TRELLIS-image-large`, commit `25e0d31ffbebe4b5a97464dd851910efc3002d96` |
| Licença | MIT. Conferido em 12/11/2026: `LICENSE` do repositório `microsoft/TRELLIS` ("MIT License, Copyright (c) Microsoft Corporation"), `license: mit` no cartão do Space e `mit` no cartão do modelo. A demo remove o fundo com `rembg`; a licença dessa etapa e dos seus pesos não foi examinada. |
| Imagem de entrada | `trellis-entrada.png` (640 × 640, SHA-256 `a32b8213bda664bbdb7e1f88edf7ba2e2c6a4ed74b4cd3c750e522a20e5e7c3e`): recorte de uma captura do **próprio boneco original da variante A**, sozinho, em vista frontal, com fundo liso. Todo o resto da cena (Geep, banda, cidade) foi ocultado antes da captura. Nenhum integrante da banda, personagem Gorillaz ou imagem de terceiros foi enviado, nem outro dado do projeto. |
| Parâmetros | Imagem única; seed 0 (sem aleatorizar); etapa 1: guidance 7,5, 12 passos; etapa 2: guidance 3, 12 passos; extração de GLB com Simplify 0,98 e textura 512 |
| Saída bruta | `trellis/trellis-bruto.glb`, 404.096 bytes (SHA-256 `8181cfba9a32b3209fdc71093033d0a80a5d9b91eb2de27af5492ec33073253a`): 1 malha, 2.908 triângulos, 2.194 vértices, 1 material, 1 textura PNG 512 × 512 (323.976 bytes), sem normais; gerador `trimesh` |
| Redução | `trellis/reduzir-glb.py` (Python + Pillow, sem ferramenta externa nem instalação): textura PNG → JPEG qualidade 88 e índices uint32 → uint16. A geometria e o UV não mudam, e a malha já saiu abaixo de 3.000 triângulos do próprio TRELLIS (não foi preciso decimar) |
| Resultado | `assets/models/motorista-trellis.glb`, 110.832 bytes (SHA-256 `8e48de0631304b2827746261f7fc21ae5d1f56ae9c10195de69a79c71a14517f`), 2.908 triângulos, 1 malha, 1 material, 1 textura JPEG 512 × 512 |
| Uso no jogo | `src/scene.js` (`loadTrellisDriver`): normais calculadas no carregamento, material próprio (rugosidade 0,9, metal 0), escala 2,12 e giro de 180° para olhar para a frente do jipe. Se o arquivo falhar, a variante A continua |

## Observações

- A imagem foi enviada a um Space público de terceiros (Hugging Face). Era só a imagem original descrita acima; a saída dessa demo não é armazenada aqui além do GLB.
- A demo exigiu apenas abrir a página: sem login, sem fila visível e sem cota esgotada. A geração terminou em menos de 20 segundos.
- Os termos de uso do Hugging Face e a cota de ZeroGPU não foram lidos em detalhe nesta tarefa.
- A forma e a textura vêm do modelo generativo a partir da nossa imagem; não foi usada nenhuma referência a personagens existentes. A geometria resultante não foi revisada por um especialista em direitos de imagem.
- Se Eduardo escolher a variante A, o GLB, a rota em `server.mjs`, `loadTrellisDriver` e `tests/driver-trellis.test.mjs` podem ser removidos juntos.
