import bpy,math,random,json
import numpy as np
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]/'assets';textures=root/'materials';out=root/'environment';textures.mkdir(exist_ok=True);out.mkdir(exist_ok=True)
random.seed(22)
bpy.ops.wm.read_factory_settings(use_empty=True)
# Original tileable texture artwork; all generation is deterministic.
n=512;y,x=np.mgrid[0:n,0:n];rng=np.random.default_rng(23)
def noise():
 # Periodic isotropic fields avoid visible grids from products of sine waves.
 frequencies=np.fft.fftfreq(n)*n;radial=frequencies[:,None]**2+frequencies[None,:]**2
 a=np.zeros((n,n),dtype=np.float32)
 for frequency,amplitude in [(3,.12),(11,.065),(39,.03)]:
  white=rng.normal(size=(n,n));field=np.fft.ifft2(np.fft.fft2(white)*np.exp(-radial/(2*frequency**2))).real
  a+=field/(field.std()+1e-6)*amplitude
 return a+rng.normal(0,.025,(n,n))
def save_image(name,rgb):
 rgb=np.clip(rgb,0,1).astype(np.float32);image=bpy.data.images.new(name,width=n,height=n,alpha=False)
 if name.endswith('-normal'):image.colorspace_settings.name='Non-Color'
 image.pixels.foreach_set(np.dstack([rgb,np.ones((n,n),dtype=np.float32)]).ravel());image.filepath_raw=str(textures/(name+'.png'));image.file_format='PNG';image.save();return image
maps={}
for name,base in {'asphalt':(.24,.27,.27),'earth':(.38,.34,.25),'grass':(.34,.43,.27),'plaster':(.66,.63,.50),'wood':(.29,.23,.16),'foliage':(.31,.45,.28),'roof':(.24,.31,.32)}.items():
 h=noise();rgb=np.array(base)[None,None,:]+h[:,:,None]*(.15 if name=='asphalt' else .20)
 if name=='asphalt':
  grit=(rng.random((n,n))>.985);rgb[grit]+=.1
 elif name=='wood':
  grain=np.sin(x*.12+noise()*6)*.04+np.sin(x*.44)*.015;rgb+=grain[:,:,None]
 elif name=='roof':rgb-=(np.mod(x,86)<5)[:,:,None]*.10
 elif name=='plaster':rgb-=((noise()>.29)*.06)[:,:,None]
 maps[name]=save_image(name,rgb)
 # A subtle normal map adds relief without increasing geometry.
 gx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))*1.2;gy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))*1.2
 normal=np.dstack([-gx,-gy,np.ones_like(gx)]);normal/=np.linalg.norm(normal,axis=2,keepdims=True)
 save_image(name+'-normal',normal*.5+.5)
row=y//64;shift=(row%2)*64;column=((x+shift)%n)//128
mortar=(y%64<5)|((x+shift)%128<5)
brickvariation=np.sin(row*17+column*13)*.07+noise()*.08
brick=np.zeros((n,n,3))+np.array((.42,.25,.19))+brickvariation[:,:,None];brick[mortar]=(.25,.27,.24)
maps['brick']=save_image('brick',brick)
paint=bpy.data.materials.new('Chalk cream');paint.diffuse_color=(.68,.70,.56,1);paint.use_nodes=True;paint.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.68,.70,.56,1)
def material(name,color=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF'];p.inputs['Roughness'].default_value=.85;p.inputs['Metallic'].default_value=0
 if name in maps:
  t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=maps[name];m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
 else:p.inputs['Base Color'].default_value=(*color,1)
 return m
brickmat=material('brick');plaster=material('plaster');wood=material('wood');roof=material('roof');iron=material('Weathered iron',(.12,.17,.17));glass=material('Warm glass',(.18,.29,.29));accent=material('Coral paint',(.62,.30,.28));foliage=material('foliage')
def uv_world(obj,scale=2.8):
 bpy.context.view_layer.objects.active=obj;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 uv=obj.data.uv_layers.new(name='UVMap') if not obj.data.uv_layers else obj.data.uv_layers[0]
 for poly in obj.data.polygons:
  axis=max(range(3),key=lambda i:abs(poly.normal[i]));axes=[i for i in range(3) if i!=axis]
  for li in poly.loop_indices:
   co=obj.data.vertices[obj.data.loops[li].vertex_index].co;uv.data[li].uv=(co[axes[0]]/scale,co[axes[1]]/scale)
def box(name,at,size,mat,bevel=.06):
 bpy.ops.mesh.primitive_cube_add(size=1,location=at);o=bpy.context.object;o.name=name;o.dimensions=size;uv_world(o)
 if bevel:
  m=o.modifiers.new('Soft edge detail','BEVEL');m.width=bevel;m.segments=2;bpy.ops.object.modifier_apply(modifier=m.name)
  m=o.modifiers.new('Weighted architectural normals','WEIGHTED_NORMAL');m.keep_sharp=True;bpy.ops.object.modifier_apply(modifier=m.name)
 o.data.materials.append(mat);return o
def cylinder(name,a,b,radius,mat,vertices=12):
 a=Vector(a);b=Vector(b);v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=v.length,location=(a+b)/2)
 o=bpy.context.object;o.name=name;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat);uv_world(o)
 for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
 return o
def merge_materials(objects,prefix):
 # Baking transforms keeps static architecture cheap while retaining material groups.
 groups={}
 for obj in objects:
  if obj.type=='MESH':groups.setdefault(obj.data.materials[0].name,[]).append(obj)
 merged=[]
 for name,items in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in items:o.select_set(True)
  bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join();o=bpy.context.object;o.name=prefix+'_'+name;merged.append(o)
 return merged
def export(objects,filename):
 bpy.ops.object.select_all(action='DESELECT')
 for o in objects:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(out/filename),export_format='GLB',use_selection=True,export_image_format='JPEG',export_jpeg_quality=85)
# Detailed original studio fits the existing collider at (-28, 6).
box('Main brick volume',(0,0,6.4),(12.8,12,12.8),brickmat,.12)
box('Weathered upper fascia',(0,0,12.4),(13.4,12.5,.8),plaster,.09)
box('Roof coping',(0,0,13),(13.8,13,.3),iron,.04)
box('Side plaster repair',(-6.43,-1.5,5.1),(.08,5.7,5.4),plaster,.01)
# Front faces Blender -Y, becoming +Z in Three.js.
box('Studio shutter opening',(-2.2,-6.07,3.25),(5,.18,5.8),iron,.04)
for z in range(13):box('Shutter horizontal rib',(-2.2,-6.2,.7+z*.43),(4.8,.12,.08),roof,.025)
box('Entrance timber door',(3.7,-6.14,1.75),(1.7,.18,3.3),wood,.04)
for xx in [-4.9,.55,2.65,4.75]:box('Door jamb',(xx,-6.22,2),(.2,.35,3.9),plaster,.04)
box('Shutter lintel',(-2.2,-6.23,6.3),(5.6,.45,.3),plaster,.05)
box('Door lintel',(3.7,-6.25,3.7),(2.4,.4,.3),plaster,.04)
for xx in [-4.3,0,4.3]:
 for yy in [-6.07,6.07]:
  box('Upper window surround',(xx,yy,9),(2.9,.25,3.1),plaster,.07)
  front=-1 if yy<0 else 1
  box('Recessed green window',(xx,yy+front*.16,9),(2.45,.08,2.65),glass,.02)
  for dx in [-1.3,0,1.3]:box('Window mullion',(xx+dx,yy+front*.23,9),(.1,.15,2.8),iron,.02)
  box('Window transom',(xx,yy+front*.23,9),(2.7,.15,.1),iron,.02)
  box('Window sill',(xx,yy+front*.2,7.45),(3.2,.7,.18),plaster,.03)
box('Sign backing',(0,-6.43,6.95),(10.3,.2,.85),iron,.05)
for xx in [-5.5,5.5]:
 cylinder('Drain pipe',(xx,-6.4,.2),(xx,-6.4,12),.09,iron)
 for zz in [1,5,10]:box('Pipe fixing',(xx,-6.43,zz),(.28,.22,.12),iron,.02)
box('Roof ventilation',(2,1,13.7),(2.7,1.8,1.4),roof,.08)
cylinder('Roof chimney',(-3,2,12.9),(-3,2,15),.45,iron,16)
box('Chimney cap',(-3,2,15),(1.2,1.2,.15),iron,.05)
for zz in [1,2.7,4.4]:box('Side painted rail',(6.5,0,zz),(.12,11,.12),accent,.02)
studio=merge_materials(list(bpy.context.scene.objects),'KongStudio');export(studio,'kong-studio.glb')
for o in list(bpy.data.objects):bpy.data.objects.remove(o,do_unlink=True)
# Organic broadleaf prototype. Trunk and leaf clumps are each merged to one draw.
cylinder('Main trunk',(0,0,0),(.15,.03,4),.20,wood)
for i in range(6):
 angle=i*math.tau/6;dx=math.cos(angle)*1.4;dy=math.sin(angle)*1.4;height=3.5+i%3*.55
 cylinder('Branch',(.08,0,2.4),(dx,dy,height),.08,wood,8)
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(dx*.8,dy*.8,height+.65))
 o=bpy.context.object;o.name='Leaf mass';o.scale=(1.5+random.random()*.35,1.4,1.3+random.random()*.3);o.data.materials.append(foliage)
 for v in o.data.vertices:v.co*=1+random.uniform(-.08,.08)
 for p in o.data.polygons:p.use_smooth=True
 uv_world(o,2)
tree=merge_materials(list(bpy.context.scene.objects),'Broadleaf');export(tree,'broadleaf-tree.glb')
print('ORIGINAL ENVIRONMENT EXPORTED')
