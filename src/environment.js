import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { nearestRoad, TREE_LOCATIONS, VISUAL_LANDMARKS } from './world-data.js';
import { letteringTexture } from './materials.js';
import { NON_DISCOVERY_PROP_SCALE } from './discovery-scale.js';
import { toneJitter } from './ground-textures.js';

export function createFrequencyGarden() {
  const garden = new THREE.Group(); garden.name = 'frequency-garden';
  const materials = ['#d2e2a8','#f5a9c6','#7fa6ff','#293f3b'].map(color => new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.25}));
  const add = (geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x,y,z); mesh.castShadow = mesh.receiveShadow = true; garden.add(mesh); return mesh;
  };
  add(new THREE.CylinderGeometry(1.95,1.95,.16,32),materials[3],0,.08,0);
  add(new THREE.CylinderGeometry(.1,.14,2.8,8),materials[3],0,1.56,.1);
  const ringGeometry = new THREE.TorusGeometry(1,.055,6,32);
  [1.8,1.4,1].forEach((radius,i) => {
    const ring = add(ringGeometry,materials[i],0,2.6,0);
    ring.scale.setScalar(radius); ring.rotation.set(.18,i*.5-.5,0);
  });
  const barGeometry = new THREE.BoxGeometry(1,1,1);
  [1.2,2.1,1.55,2.8,2.35,1.7,1.1].forEach((height,i) => {
    const bar = add(barGeometry,materials[i%3],(i-3)*.44,height/2+.16,-.32);
    bar.scale.set(.2,height,.2);
  });
  return garden;
}

export function createRegionalGrounds() {
  const group = new THREE.Group(); group.name = 'regional-grounds';
  const material = new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,polygonOffset:true,polygonOffsetFactor:2,polygonOffsetUnits:2});
  function region(name, paint) {
    const positions = [], colors = [], palette = new Map();
    const triangle = (a,b,c,y,color) => {
      if (!palette.has(color)) palette.set(color,new THREE.Color(color));
      const ink = palette.get(color);
      // Variação de tom por triângulo (±5%): grama e praças deixam de ser um verde/amarelo liso.
      const k = toneJitter((a[0]+b[0]+c[0])/3, (a[1]+b[1]+c[1])/3);
      for (const [x,z] of [a,c,b]) { positions.push(x,y,z); colors.push(ink.r*k,ink.g*k,ink.b*k); }
    };
    const quad = (a,b,c,d,y,color) => { triangle(a,b,c,y,color); triangle(a,c,d,y,color); };
    const rect = (x,z,w,d,y,color) => quad([x,z],[x+w,z],[x+w,z+d],[x,z+d],y,color);
    const circle = (x,z,rx,rz,y,color) => {
      for (let i=0;i<48;i++) {
        const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
        triangle([x,z],[x+Math.cos(a)*rx,z+Math.sin(a)*rz],[x+Math.cos(b)*rx,z+Math.sin(b)*rz],y,color);
      }
    };
    const ring = (x,z,rx,rz,width,y,color) => {
      for (let i=0;i<48;i++) {
        const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
        quad([x+Math.cos(a)*rx,z+Math.sin(a)*rz],[x+Math.cos(b)*rx,z+Math.sin(b)*rz],
          [x+Math.cos(b)*(rx-width),z+Math.sin(b)*(rz-width)],[x+Math.cos(a)*(rx-width),z+Math.sin(a)*(rz-width)],y,color);
      }
    };
    paint({quad,rect,circle,ring});
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry,material); mesh.name=name; mesh.receiveShadow=true; group.add(mesh);
  }
  region('studio-ground',({rect}) => {
    rect(-18,-23,36,36,-.126,'#414c50');
    for (const x of [-16,15.65]) rect(x,-21,.35,32,-.118,'#d6c27f');
    // Vagas ampliadas para a escala dos carros (separadores de 8,8 m: cabem sedan 6,6 m e van 7,9 m).
    for (let i=0;i<7;i++) for (const [x,w] of [[-16,8.8],[7.2,8.8]]) rect(x,-21+i*5,w,.3,-.118,'#d6c27f');
    for (const z of [-22,11.5]) rect(-17,z,34,.5,-.118,'#89958e');
  });
  region('coast-ground',({quad,rect}) => {
    for (let i=0;i<32;i++) {
      const z=-65+i*3,zNext=z+3,edge=104+Math.sin(z*.07)*5,nextEdge=104+Math.sin(zNext*.07)*5;
      quad([edge,z],[139.8,z],[139.8,zNext],[nextEdge,zNext],-.126,'#c8b588');
      quad([edge+2,z],[edge+5,z],[nextEdge+5,zNext],[nextEdge+2,zNext],-.120,'#e3cf9f');
    }
    for (let i=0;i<40;i++) rect(125,-30+i*1.2,7,1.05,-.114,i%2?'#98764e':'#ad8959');
    for (const x of [125,131.8]) rect(x,-30,.2,48,-.108,'#5e5241');
  });
  region('lookout-ground',({circle,ring}) => {
    circle(72,-123,29,25,-.126,'#7f975b');
    ring(72,-123,23,20,.9,-.120,'#b9b397');
    ring(72,-123,17,14,.6,-.120,'#d5caa2');
    circle(72,-123,15.8,13,-.114,'#8ba568');
  });
  return group;
}

export function installEnvironment(scene, renderer, surfaces, onModel = () => {}) {
  scene.add(createRegionalGrounds());
  const loader=new GLTFLoader(); const status=document.querySelector('#environment-status');
  const states={studio:'loading',gardens:'loading',trees:'loading'};
  function report(key,state) {
    states[key]=state;renderer.domElement.dataset[key]=state;
    if(status) status.textContent=Object.values(states).some(s=>s==='loading')?'Preparando o pátio e as peças da exposição…':Object.values(states).every(s=>s==='ready')?'KONG STUDIOS / JARDINS GEOMÉTRICOS ORIGINAIS':'CENÁRIO LOCAL / ALGUMAS PEÇAS USAM ALTERNATIVAS';
  }
  function addModel(key,url,at) {
    return loader.loadAsync(url).then(gltf=>{
      const model=gltf.scene;model.name=key;model.position.set(at.x,at.y||0,at.z);
      model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      scene.add(model);onModel(model,at);report(key,'ready');return model;
    }).catch(error=>{console.warn(`Peça ${key} indisponível:`,error.message);report(key,'fallback');return null;});
  }
  const studioPromise=addModel('studio','./assets/environment/kong-studio.glb',{x:-28,y:-.3,z:6}).then(model=>{
    if(!model){const fallback=new THREE.Mesh(new THREE.BoxGeometry(12.8,13,12),surfaces.get('brick',4,4));fallback.position.set(-28,6.2,6);fallback.castShadow=fallback.receiveShadow=true;scene.add(fallback);}
  });
  const signTexture=letteringTexture('KONG STUDIOS|THE ROAD / MUSIC & STORIES',{height:256});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,.7),new THREE.MeshStandardMaterial({map:signTexture,roughness:.9,metalness:0}));
  sign.position.set(-28,6.65,12.67);scene.add(sign);
  // Posters use existing credited character portraits (WebP otimizado de 15 KB primeiro, fallback PNG).
  const imageLoader=new THREE.TextureLoader();
  const posterWebp=['2d','murdoc','noodle','russel'];
  ['twod','murdoc','noodle','russel'].forEach((name,i)=>{
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(1.65*1.3,2.5*1.3),surfaces.get('plaster'));paper.rotation.y=Math.PI/2;paper.position.set(-21.54,3.6,1.8+i*2.6);scene.add(paper);
    const map=imageLoader.load(`./assets/art/member-${posterWebp[i]}.webp`,undefined,undefined,()=>{imageLoader.load(`./assets/portraits/phase7-${name}.png`,fallback=>{map.image=fallback.image;map.needsUpdate=true;});});
    map.colorSpace=THREE.SRGBColorSpace;
    const art=new THREE.Mesh(new THREE.PlaneGeometry(1.35*1.3,2.2*1.3),new THREE.MeshStandardMaterial({map,transparent:true,alphaTest:.1,roughness:1,metalness:0}));art.rotation.y=Math.PI/2;art.position.copy(paper.position);art.position.x+=.02;scene.add(art);
  });
  const gardenAt = VISUAL_LANDMARKS.diorama, echoAt = VISUAL_LANDMARKS.sculpture;
  const garden = createFrequencyGarden(); garden.position.set(gardenAt.x,gardenAt.y,gardenAt.z); scene.add(garden);
  const echoGarden = createFrequencyGarden(); echoGarden.position.set(echoAt.x,echoAt.y,echoAt.z); echoGarden.rotation.y=Math.PI/4; echoGarden.scale.setScalar(.82); scene.add(echoGarden); report('gardens','ready');
  for(const [key,label] of [['sculpture','JARDIM / ECOS'],['diorama','JARDIM / FREQUÊNCIAS']]) {
    const point=VISUAL_LANDMARKS[key];
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.7,point.y,40),surfaces.get('plaster',2));plinth.position.set(point.x,point.y/2-.05,point.z);plinth.receiveShadow=plinth.castShadow=true;scene.add(plinth);
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(3.8*NON_DISCOVERY_PROP_SCALE,.8*NON_DISCOVERY_PROP_SCALE),new THREE.MeshStandardMaterial({map:letteringTexture(label,{height:128}),roughness:.9}));plaque.position.set(point.x,.8*NON_DISCOVERY_PROP_SCALE,point.z+2.76);scene.add(plaque);
  }
  // Shared prototype geometry/materials: repeated trees use only a few draw calls.
  // Low planting beds follow the tree groves but leave the shoulders clear (replaced lazily by bush-01/02 GLB).
  const shrubs = [];
  for (const [i, tree] of TREE_LOCATIONS.entries()) {
    for (let j=0; j<3; j++) {
      const angle=i*2.39+j*1.91;
      const x=tree.x+Math.cos(angle)*(2+j), z=tree.z+Math.sin(angle)*(2+j);
      if (nearestRoad({x,z}).distance>12) shrubs.push({x,z,angle});
    }
  }
  let shrubMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),
    new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),shrubs.length);
  const pose=new THREE.Object3D();
  shrubs.forEach(({x,z,angle},i)=>{
    pose.position.set(x,.28,z); pose.rotation.y=angle;
    pose.scale.set(1.4+i%3*.3,.65+i%4*.14,1.15); pose.updateMatrix();
    shrubMesh.setMatrixAt(i,pose.matrix);
    shrubMesh.setColorAt(i,new THREE.Color(['#4e6138','#657342','#40573f'][i%3]));
  });
  shrubMesh.receiveShadow=true;scene.add(shrubMesh);
  Promise.all(['./assets/models/scenery/bush-01-mound.glb','./assets/models/scenery/bush-02-spreading.glb'].map(u=>loader.loadAsync(u))).then(gltfs=>{
    scene.remove(shrubMesh); shrubMesh.geometry.dispose();
    gltfs.forEach((gltf,vIdx)=>{
      let found=null; gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(o=>{if(!found&&o.isMesh&&o.geometry)found=o;});
      if(!found)return;
      const geo=found.geometry.clone().applyMatrix4(found.matrixWorld);
      const mat=new THREE.MeshStandardMaterial({color:vIdx===0?'#76946e':'#6d8c6c',vertexColors:Boolean(geo.attributes.color),roughness:.88,metalness:.04});
      const sub=shrubs.filter((_,i)=>i%2===vIdx);
      const inst=new THREE.InstancedMesh(geo,mat,sub.length); inst.receiveShadow=true;
      sub.forEach(({x,z,angle},i)=>{
        pose.position.set(x,0,z); pose.rotation.y=angle;
        pose.scale.setScalar(.85+(i%4)*.12); pose.updateMatrix();
        inst.setMatrixAt(i,pose.matrix);
      });
      inst.computeBoundingSphere(); scene.add(inst);
    });
  }).catch(()=>{});
  const treeUrls=['./assets/models/scenery/tree-01-broadleaf.glb','./assets/models/scenery/tree-02-windswept.glb','./assets/models/scenery/tree-03-sage.glb'];
  const treeTints=['#7f9c7a','#739478','#869e7d'];
  const treesPromise=Promise.all(treeUrls.map(u=>loader.loadAsync(u))).then(gltfs=>{
    gltfs.forEach((gltf,vIdx)=>{
      let found=null; gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse(o=>{if(!found&&o.isMesh&&o.geometry)found=o;});
      if(!found)return;
      const geo=found.geometry.clone().applyMatrix4(found.matrixWorld);
      const mat=new THREE.MeshStandardMaterial({color:treeTints[vIdx],vertexColors:Boolean(geo.attributes.color),roughness:.86,metalness:.04});
      const sub=TREE_LOCATIONS.map((pt,i)=>({pt,i})).filter(({i})=>i%3===vIdx);
      const instances=new THREE.InstancedMesh(geo,mat,sub.length);instances.castShadow=instances.receiveShadow=true;
      sub.forEach(({pt,i},k)=>{
        pose.position.set(pt.x,0,pt.z);pose.rotation.set(0,i*2.39,0);
        const factor=.85+(i%5)*.10;pose.scale.setScalar(factor);pose.updateMatrix();
        instances.setMatrixAt(k,pose.matrix);
      });
      instances.computeBoundingSphere();scene.add(instances);
    });
    report('trees','ready');
  }).catch(()=>loader.loadAsync('./assets/environment/broadleaf-tree.glb').then(gltf=>{
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(part=>{
      if(!part.isMesh)return;
      const foliage = /foliage/i.test(part.name);
      let geometry = part.geometry;
      if (foliage) {
        geometry.computeBoundingBox(); const bounds=geometry.boundingBox, width=bounds.max.x-bounds.min.x, height=bounds.max.y-bounds.min.y;
        const left=geometry.clone(), right=geometry.clone();
        left.scale(.58,.58,.58); left.translate(-width*.25,height*.2,0);
        right.scale(.52,.52,.52); right.translate(width*.25,height*.27,0);
        geometry=mergeGeometries([geometry,left,right]) || part.geometry;
      }
      const instances=new THREE.InstancedMesh(geometry,/wood/i.test(part.name) ? surfaces.get('wood',2) : part.material,TREE_LOCATIONS.length);instances.castShadow=instances.receiveShadow=true;
      const placement=new THREE.Matrix4();const position=new THREE.Vector3();const rotation=new THREE.Quaternion();const scale=new THREE.Vector3();
      TREE_LOCATIONS.forEach((point,i)=>{
        position.set(point.x,-.3,point.z);rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),i*2.39);
        const factor=.8+(i%5)*.13;scale.set(factor*(.86+i%3*.12),factor*(.83+i%4*.13),factor);placement.compose(position,rotation,scale);placement.multiply(part.matrixWorld);instances.setMatrixAt(i,placement);
        if (foliage) instances.setColorAt(i,new THREE.Color().setHSL(.28+(i%5)*.012,.35+(i%3)*.04,.74+(i%4)*.035));
      });
      instances.computeBoundingSphere();scene.add(instances);
    });report('trees','ready');
  })).catch(error=>{console.warn('Vegetação alternativa:',error.message);report('trees','fallback');
    for(const point of TREE_LOCATIONS){const crown=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8),surfaces.get('foliage'));crown.position.set(point.x,3.7,point.z);scene.add(crown);}
  });
  return Promise.allSettled([studioPromise,treesPromise]);
}
