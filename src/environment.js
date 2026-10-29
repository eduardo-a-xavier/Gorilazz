import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { TREE_LOCATIONS, VISUAL_LANDMARKS } from './world-data.js';
import { letteringTexture } from './materials.js';

export function installEnvironment(scene, renderer, surfaces) {
  const loader=new GLTFLoader(); const status=document.querySelector('#environment-status');
  const states={studio:'loading',sculpture:'loading',diorama:'loading',trees:'loading'};
  function report(key,state) {
    states[key]=state;renderer.domElement.dataset[key]=state;
    if(status) status.textContent=Object.values(states).some(s=>s==='loading')?'Preparando o pátio e as peças da exposição…':Object.values(states).every(s=>s==='ready')?'KONG STUDIOS / CENÁRIO TEXTURIZADO E DUAS PEÇAS INCORPORADAS':'CENÁRIO LOCAL / ALGUMAS PEÇAS USAM ALTERNATIVAS';
  }
  function addModel(key,url,at) {
    return loader.loadAsync(url).then(gltf=>{
      const model=gltf.scene;model.name=key;model.position.set(at.x,at.y||0,at.z);
      model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
      scene.add(model);report(key,'ready');return model;
    }).catch(error=>{console.warn(`Peça ${key} indisponível:`,error.message);report(key,'fallback');return null;});
  }
  const studioPromise=addModel('studio','/assets/environment/kong-studio.glb',{x:-28,y:-.3,z:6}).then(model=>{
    if(!model){const fallback=new THREE.Mesh(new THREE.BoxGeometry(12.8,13,12),surfaces.get('brick',4,4));fallback.position.set(-28,6.2,6);fallback.castShadow=fallback.receiveShadow=true;scene.add(fallback);}
  });
  const signTexture=letteringTexture('KONG STUDIOS|THE ROAD / MUSIC & STORIES',{height:256});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,.7),new THREE.MeshStandardMaterial({map:signTexture,roughness:.9,metalness:0}));
  sign.position.set(-28,6.65,12.67);scene.add(sign);
  // Posters use existing credited character portraits, not newly sourced artwork.
  const imageLoader=new THREE.TextureLoader();
  ['twod','murdoc','noodle','russel'].forEach((name,i)=>{
    const paper=new THREE.Mesh(new THREE.PlaneGeometry(1.65,2.5),surfaces.get('plaster'));paper.rotation.y=Math.PI/2;paper.position.set(-21.54,3.6,1.8+i*2.6);scene.add(paper);
    const map=imageLoader.load(`/assets/portraits/phase7-${name}.png`);map.colorSpace=THREE.SRGBColorSpace;
    const art=new THREE.Mesh(new THREE.PlaneGeometry(1.35,2.2),new THREE.MeshStandardMaterial({map,transparent:true,alphaTest:.1,roughness:1,metalness:0}));art.rotation.y=Math.PI/2;art.position.copy(paper.position);art.position.x+=.02;scene.add(art);
  });
  const sculpturePromise=addModel('sculpture','/assets/environment/2d-sculpture.glb',VISUAL_LANDMARKS.sculpture);
  const dioramaPromise=addModel('diorama','/assets/environment/noodle-diorama.glb',VISUAL_LANDMARKS.diorama);
  for(const [key,label] of [['sculpture','2-D / ESCULTURA'],['diorama','NOODLE / DIORAMA']]) {
    const point=VISUAL_LANDMARKS[key];
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.7,point.y,40),surfaces.get('plaster',2));plinth.position.set(point.x,point.y/2-.05,point.z);plinth.receiveShadow=plinth.castShadow=true;scene.add(plinth);
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.8),new THREE.MeshStandardMaterial({map:letteringTexture(label,{height:128}),roughness:.9}));plaque.position.set(point.x,.8,point.z+2.76);scene.add(plaque);
  }
  // Shared prototype geometry/materials: repeated trees use only a few draw calls.
  const treesPromise=loader.loadAsync('/assets/environment/broadleaf-tree.glb').then(gltf=>{
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(part=>{
      if(!part.isMesh)return;
      const instances=new THREE.InstancedMesh(part.geometry,part.material,TREE_LOCATIONS.length);instances.castShadow=instances.receiveShadow=true;
      const placement=new THREE.Matrix4();const position=new THREE.Vector3();const rotation=new THREE.Quaternion();const scale=new THREE.Vector3();
      TREE_LOCATIONS.forEach((point,i)=>{
        position.set(point.x,-.3,point.z);rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),i*2.39);
        const factor=.8+(i%5)*.13;scale.set(factor,factor,factor);placement.compose(position,rotation,scale);placement.multiply(part.matrixWorld);instances.setMatrixAt(i,placement);
      });
      instances.computeBoundingSphere();scene.add(instances);
    });report('trees','ready');
  }).catch(error=>{console.warn('Vegetação alternativa:',error.message);report('trees','fallback');
    for(const point of TREE_LOCATIONS){const crown=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8),surfaces.get('foliage'));crown.position.set(point.x,3.7,point.z);scene.add(crown);}
  });
  return Promise.allSettled([studioPromise,sculpturePromise,dioramaPromise,treesPromise]);
}
