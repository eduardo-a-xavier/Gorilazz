// Integração dos minigames (Fliperama, Teclado do 2-D) e visualizador 360° dos integrantes.
import { createArcadeScreen } from './arcade-screen.js';
import { createPianoScreen } from './piano-screen.js';
import { createMemberViewer } from './member-viewer.js';
import { createRadioDuck } from './radio-duck.js';
import { ARCADE_SPOT, ARCADE_RADIUS } from './arcade.js';
import { nearestRoad } from './world-data.js';

export function createMinigamesController({
  cameraState,
  vehicle,
  isEntered,
  modalOpen,
  stop,
  setPreviousFocus,
  restoreFocus,
  getWorld,
  getLocalRadio,
}) {
  const arcadeScreen = createArcadeScreen({
    dialog: document.querySelector('#arcade-dialog'),
    onClose: () => {
      cameraState.exitModalFocus();
      getWorld()?.clearPose();
      restoreFocus();
    },
  });

  // Frente do gabinete: a mesma direção que arcade-cabinet.js usa (para a via mais próxima).
  const arcadeFront = (() => {
    const road = nearestRoad(ARCADE_SPOT);
    const dx = road.x - ARCADE_SPOT.x, dz = road.z - ARCADE_SPOT.z, len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
  })();

  // Visualizador 360° do integrante no modal: a ficha mostra o modelo girável; sem ele, fica o retrato 2D.
  const memberView = createMemberViewer({
    canvas: document.querySelector('#member-canvas'),
    onReady: () => {
      document.querySelector('#member-view').hidden = false;
      document.querySelector('#portrait').hidden = true;
    },
    onFail: () => {
      document.querySelector('#member-view').hidden = true;
      document.querySelector('#portrait').hidden = false;
    },
  });
  document.querySelector('#view-prev').addEventListener('click', () => memberView.rotate(-1));
  document.querySelector('#view-next').addEventListener('click', () => memberView.rotate(1));

  // Rádio Kong FM: silenciado enquanto o Teclado do 2-D toca e devolvido ao sair (só se estava tocando).
  const radioDuck = createRadioDuck({
    isPlaying: () => getLocalRadio().isPlaying(),
    pause: () => getLocalRadio().pause(),
    play: () => getLocalRadio().play(),
  });

  // Minigame de piano do 2-D: abre do modal do 2-D; ao sair, o foco volta ao botão e o modal fica aberto.
  const pianoScreen = createPianoScreen({
    dialog: document.querySelector('#piano-dialog'),
    onClose: () => document.querySelector('#character-piano')?.focus(),
    onStart: () => radioDuck.begin(),
    onEnd: () => radioDuck.end(),
  });
  document.querySelector('#character-piano').addEventListener('click', () => pianoScreen.open());

  const arcadeNear = () =>
    isEntered() &&
    Math.hypot(vehicle.x - ARCADE_SPOT.x, vehicle.z - ARCADE_SPOT.z) < ARCADE_RADIUS &&
    Math.abs(vehicle.speed) < 2;

  function openArcade() {
    if (modalOpen()) return;
    stop();
    setPreviousFocus(document.activeElement);
    cameraState.enterModalFocus();
    // Câmera aproxima a tela do gabinete ao abrir o jogo; ao fechar, clearPose devolve a câmera ao carro.
    getWorld()?.frameSpot({
      x: ARCADE_SPOT.x + arcadeFront.x * .6,
      z: ARCADE_SPOT.z + arcadeFront.z * .6,
      dirX: arcadeFront.x,
      dirZ: arcadeFront.z,
      distance: 3.4,
      height: 2.5,
      target: 2.2,
    });
    arcadeScreen.open();
  }

  return { arcadeScreen, pianoScreen, memberView, radioDuck, arcadeNear, openArcade };
}
