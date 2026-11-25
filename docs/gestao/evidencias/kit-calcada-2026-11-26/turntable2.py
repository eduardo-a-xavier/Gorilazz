"""4 vistas do alce: frente 3/4, lado, costas, topo. Uso: blender -b --python turntable2.py -- <glb> <pasta>"""
import bpy, sys, math, os
from mathutils import Vector
glb, outdir = sys.argv[sys.argv.index('--') + 1], sys.argv[sys.argv.index('--') + 2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
ctr = (mn + mx) / 2; size = max(mx - mn)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
bpy.context.scene.camera = cam; cam.data.lens = 50
sc = bpy.context.scene; sc.render.resolution_x = 900; sc.render.resolution_y = 700
sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.world = bpy.data.worlds.new('w'); sc.world.color = (0.93, 0.92, 0.9)
d = size * 1.7
views = {'frente_3-4': (math.radians(35), 0.3), 'lado': (math.radians(90), 0.15), 'costas': (math.radians(200), 0.3), 'topo': (0.0, 1.0)}
for name, (a, h) in views.items():
    if name == 'topo':
        cam.location = ctr + Vector((0.001, 0, d))
    else:
        cam.location = ctr + Vector((math.cos(a) * d, math.sin(a) * d, h * d))
    direction = ctr - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(outdir, f'vista_{name}.png'); bpy.ops.render.render(write_still=True)
print('VIEWS_OK', [round(v, 2) for v in (mx - mn)])
