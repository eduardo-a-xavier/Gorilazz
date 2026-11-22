// Artes do manifesto (assets/art) para os painéis de história. Lógica pura, testada em Node.
export const ART_LOAD_RADIUS = 25; // m: a arte só é baixada quando o carro chega perto do ponto

// Imagem principal de uma descoberta e seu crédito; null se o manifesto não tiver a descoberta.
export function artForDiscovery(manifest, id) {
  const entry = manifest?.discoveryMurals?.[id];
  return entry ? { path: entry.primary, credit: entry.credit, title: entry.title } : null;
}

// Hora de baixar a arte: perto do ponto, uma vez só.
export function shouldLoadArt(vehicle, point, requested, radius = ART_LOAD_RADIUS) {
  if (requested) return false;
  return Math.hypot(vehicle.x - point.x, vehicle.z - point.z) < radius;
}

// Linha de crédito exibida no cartão da descoberta.
export function creditLine(art) {
  return art?.credit ? `Imagem: ${art.credit}` : '';
}
