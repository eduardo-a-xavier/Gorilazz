// Silencia o rádio Kong FM enquanto o Teclado do 2-D toca, e devolve o som só ao sair — e só se o rádio estava tocando.
// Se o usuário já tinha pausado o rádio, nada é religado sozinho. Lógica pura, testada em Node.
export function createRadioDuck(radio) {
  let paused = false;
  return {
    get active() { return paused; },
    // Ao começar o minigame: pausa o rádio só se ele estava tocando.
    begin() {
      if (paused) return false;
      if (!radio.isPlaying()) return false;
      radio.pause(); paused = true; return true;
    },
    // Ao sair (Esc ou Sair): retoma só se o minigame é quem tinha pausado; uma vez só.
    end() {
      if (!paused) return false;
      paused = false; radio.play(); return true;
    },
  };
}
