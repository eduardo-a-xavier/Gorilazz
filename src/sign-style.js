// Padrão visual das placas (ruas, portais e letreiros): moldura metálica escura, tipografia Anton em alto contraste
// e brilho emissivo leve nos letreiros fechados. Constantes puras, testadas em Node.
export const PLATE_STYLE = Object.freeze({
  frame: '#8a9596',        // aro metálico claro
  panel: '#1d2426',        // fundo escuro da placa
  ink: '#f5f1e3',          // texto de alto contraste
  shadow: '#0b0f10',       // sombra do texto
  font: '"Anton", Impact, "Arial Narrow", sans-serif',
  anisotropy: 8,
});
// Letreiros de comércio fechado: brilho emissivo um pouco maior, para ler de longe em 1ª pessoa.
export function isClosedSign(name) {
  return /SEM SINAL|FECHADO/i.test(String(name));
}
export const CLOSED_SIGN_NEON = '#ffe27a';
