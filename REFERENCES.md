# Referências e modelos 3D

## Arquivos incluídos

Autor: **Kenney**. Pacote: **Car Kit 3.1**. Licença: **CC0 1.0 Universal**.

- Fonte oficial: https://kenney.nl/assets/car-kit
- Cópia pública consultada e baixada: https://github.com/Arslan12216775/kenney_car-kit/tree/153591d606970058a4d0e44aeadf435c2d3f89ed
- Licença original preservada em `assets/models/KENNEY-LICENSE.txt`.
- Arquivos binários copiados sem alteração; escala e orientação são ajustadas apenas em tempo de execução.
- O arquivo `kenney-suv.glb` é o veículo padrão. É um SUV estilizado com estepe, usado como jipe neste protótipo; não se afirma que seja um modelo oficial da marca Jeep.
- `kenney-suv-luxury.glb` é uma alternativa disponível para download, não carregada na cena.

| Arquivo | SHA-256 |
| --- | --- |
| `kenney-suv.glb` | `cc195543e412a3c6b7c94dee3313c9998522efc18a0a95a9438a4b476754ff4f` |
| `kenney-suv-luxury.glb` | `45193092aa900794b56817f5158aae0a562f4bc97fe566e15ff75b3b7c863ee2` |

O site oficial da Kenney não abriu na rede desta máquina. O conteúdo e sua licença foram verificados na cópia pública acima; os arquivos GLB foram carregados e validados localmente.

## Outras referências

- **Khronos Toy Car**: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar — exemplo de glTF 2.0, com créditos a Guido Odendahl e Eric Chadwick e licença CC0 informada no README consultado. Referência de formato; não incluído nem usado na cena.
- **Yamê — The Molazone**: referência de direção para exploração 3D e câmera imersiva indicada pelo usuário. Não foi possível inspecionar esse site; nenhum código ou arquivo dele foi reutilizado.
- **Gorillaz**: https://www.gorillaz.com/ — universo criado por Jamie Hewlett e Damon Albarn. Projeto acadêmico independente, sem vínculo oficial.
- **Three.js 0.180.0**: biblioteca sob licença MIT em `src/vendor/THREE-LICENSE.txt`. GLTFLoader e BufferGeometryUtils são da mesma versão; apenas caminhos de importação foram adaptados para módulos locais.

## Circuito

O trajeto é um círculo fechado de raio 58 unidades. As nove paradas usam posições distintas `i / 9`; o jipe aponta para a tangente e a câmera o acompanha. Avançar ou voltar atravessa a emenda da volta sem reiniciar o mundo. A navegação por paradas escolhe o caminho mais curto do círculo. Personagens permanecem acessíveis pela galeria.
