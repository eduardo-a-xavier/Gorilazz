import * as THREE from './vendor/three.module.min.js';

function display(width, height, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:texture, toneMapped:false}));
  let previous;
  function draw(key, paint) {
    if (previous === key) return;
    previous = key; ctx.fillStyle = '#101d1c'; ctx.fillRect(0, 0, width, height);
    paint(ctx); texture.needsUpdate = true;
  }
  return { mesh, draw };
}

export function createCabin() {
  const root = new THREE.Group(), wheel = new THREE.Group(), controls = [];
  root.visible = false;
  const unit = new THREE.BoxGeometry();
  const materials = new Map();
  function box(w,h,d,x,y,z,color) {
    if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.8}));
    const part = new THREE.Mesh(unit,materials.get(color));
    part.scale.set(w,h,d); part.position.set(x,y,z); root.add(part); return part;
  }
  const trim = '#293530', panel = '#444f46';
  box(2.85,.42,.55,.56,-.63,-1.06,trim);
  box(2.86,.035,.58,.56,-.41,-1.06,panel);
  for (const x of [-.82,1.94]) {
    box(.065,1.32,.075,x,.18,-1.26,trim).rotation.x = -.2;
    box(.09,.44,2.4,x,-.62,-.1,panel);
  }
  box(2.84,.065,.09,.56,.82,-1.14,trim);
  box(.38,.11,.07,.53,.57,-1.05,panel);
  box(.355,.086,.008,.53,.57,-1.01,'#8eaaa9');
  for (const x of [-.52,1.29,1.59]) {
    box(.21,.105,.025,x,-.52,-.774,trim);
    for (let i=0; i<4; i++) box(.176,.008,.018,x,-.55+i*.02,-.754,'#65746b');
  }
  box(.46,.028,.04,1.37,-.61,-.72,panel);
  for (const x of [1.16,1.58]) box(.028,.03,.1,x,-.61,-.76,panel);
  box(.03,.18,.03,.53,.69,-1.05,trim);
  wheel.position.set(0,-.46,-.68);
  wheel.rotation.x = -.3; root.add(wheel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.221,.023,10,44),materials.get(trim));
  wheel.add(ring);
  for (const angle of [0,2.18,-2.18]) {
    const spoke = new THREE.Mesh(unit,materials.get(trim));
    spoke.scale.set(.035,.22,.036); spoke.rotation.z = angle;
    spoke.position.set(.11*Math.sin(angle),-.11*Math.cos(angle),0); wheel.add(spoke);
  }
  const dial = display(256,80,.44,.14);
  box(.23,.13,.11,0,-.36,-1.02,panel);
  box(.49,.17,.09,0,-.25,-1.004,trim);
  dial.mesh.position.set(0,-.25,-.95); root.add(dial.mesh);
  const consoleFace = box(.78,.39,.14,.65,-.54,-.77,trim);
  const lcd = display(640,180,.73,.205);
  lcd.mesh.position.set(.65,-.465,-.695); root.add(lcd.mesh);
  const labels = [['prev','◀◀'],['play','▶Ⅱ'],['next','▶▶'],['quieter','−'],['louder','+'],['playlist','LISTA']];
  labels.forEach(([action,label], i) => {
    const key = display(96,72,.116,.087);
    key.draw(label,ctx => {
      ctx.fillStyle = '#bbdbaa'; ctx.font = 'bold 25px Arial'; ctx.textAlign = 'center'; ctx.fillText(label,48,45);
    });
    key.mesh.position.set(consoleFace.position.x+(i-2.5)*.125,-.635,-.695);
    key.mesh.userData.action = action; controls.push(key.mesh); root.add(key.mesh);
  });
  function reuse(mesh) {
    if (!mesh.isMesh) return;
    if (mesh.name.startsWith('Seat_Driver')) {
      const seat = new THREE.Mesh(mesh.geometry.clone().center(),mesh.material);
      seat.scale.setScalar(6); seat.position.set(mesh.name.endsWith('1') ? 1.13 : 0,-.48,.42);
      seat.rotation.y = Math.PI; root.add(seat);
    }
    if (mesh.name === 'Steering_Wheel') {
      const part = new THREE.Mesh(mesh.geometry.clone().center(),mesh.material);
      part.rotation.x = Math.PI/2; part.scale.setScalar(6);
      wheel.clear(); wheel.add(part);
    }
  }
  function update(vehicle,radio) {
    wheel.rotation.z = vehicle.steering * 3.2;
    const speed = Math.round(Math.abs(vehicle.speed)*3.6);
    dial.draw(speed,ctx => {
      ctx.fillStyle='#d2e8b8'; ctx.font='bold 60px monospace'; ctx.fillText(String(speed).padStart(2,'0'),12,62);
      ctx.font='22px monospace'; ctx.fillText('KM/H',146,59);
    });
    lcd.draw([radio.name,radio.playing,radio.seconds,radio.volume].join('|'),ctx => {
      ctx.fillStyle='#b9da99';ctx.font='bold 29px monospace';ctx.fillText('KONG FM   /   '+(radio.playing?'NO AR':'PAUSA'),16,36);
      ctx.fillStyle='#f1efda';ctx.font='bold 48px sans-serif';ctx.fillText(radio.name,16,97,605);
      const clock = Math.floor(radio.seconds/60)+':'+String(radio.seconds%60).padStart(2,'0');
      ctx.font='24px sans-serif';ctx.fillText(radio.artist,16,147,385);ctx.fillText(clock+'  VOL '+radio.volume,418,147);
    });
  }
  return {root,wheel,controls,reuse,update};
}
