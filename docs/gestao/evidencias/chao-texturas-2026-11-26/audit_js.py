# JS da auditoria de veículos (raycast no Chrome real)
JS = """async () => {
  const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
  const scene = window.__gorilazz.world.debug.scene;
  const cars = [];
  scene.traverse(o => { if (o.isInstancedMesh && /street-cars/.test(o.name)) cars.push(o); });
  const down = new T.Raycaster();
  const surfaceAt = (x, z) => {
    down.set(new T.Vector3(x, 60, z), new T.Vector3(0, -1, 0));
    const hits = down.intersectObjects(scene.children, true).filter(h => h.object.isMesh && !/street-cars|street-trees|street-bushes|ambient|drive-fx|sky|halo/.test(h.object.name) && !(h.object.parent && /street-props|cabin|jogo/.test(h.object.parent.name)));
    if (!hits.length) return { name: 'nenhum', color: null };
    const h = hits[0], g = h.object.geometry, m = h.object.material;
    let color = null;
    if (g.attributes.color && h.face) { const i = h.face.a; color = [g.attributes.color.getX(i), g.attributes.color.getY(i), g.attributes.color.getZ(i)].map(v => Math.round(v * 255)); }
    else if (m && m.color) color = [m.color.r, m.color.g, m.color.b].map(v => Math.round(v * 255));
    return { name: h.object.name || h.object.type, color };
  };
  const out = [];
  const v = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(), mat = new T.Matrix4();
  for (const mesh of cars) for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, mat); mat.decompose(v, q, s);
    const euler = new T.Euler().setFromQuaternion(q, 'YXZ'); const yaw = euler.y;
    const L = 2.4 * s.z, W = 1.09 * s.x; // meia-comprimento e meia-largura do GLB (aprox.)
    const cs = [[-W,-L],[W,-L],[W,L],[-W,L]].map(([a,b]) => ({ x: v.x + a*Math.cos(yaw) + b*Math.sin(yaw), z: v.z - a*Math.sin(yaw) + b*Math.cos(yaw) }));
    out.push({ mesh: mesh.name, i, x: +v.x.toFixed(2), z: +v.z.toFixed(2), yaw: +yaw.toFixed(3), scale: +s.x.toFixed(2), y: +v.y.toFixed(3),
      centro: surfaceAt(v.x, v.z), cantos: cs.map(c => surfaceAt(c.x, c.z)) });
  }
  return out;
}"""
