"""Kit de calçada (CC0, original) no Blender COM JANELA. Peças em etapas visíveis (bpy.app.timers).
Convenções: unidades em metros; altura em Z (Blender Z-up); o exportador converte para Y-up (glTF).
Topo da calçada em z = 0.07 (cota atual do jogo); sob a calçada, z = -0.3 (saia).
Uso: blender --python build_kit.py  (NÃO usar --background: a janela fica aberta para acompanhar)."""
import bpy, bmesh, math, os
from mathutils import Vector
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
TOP, BOT = 0.07, -0.30
W = 2.4          # largura da calçada atual (WALK.avenue)
CONCRETE = (0.78, 0.75, 0.68, 1)
bpy.ops.wm.read_factory_settings(use_empty=True)
mat = bpy.data.materials.new('kit_concreto_claro'); mat.use_nodes = True
b = mat.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value = CONCRETE; b.inputs['Roughness'].default_value = .92
steps = []
def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth() if False else None
    return ob
def piece_straight(L=4.0):
    bm = bmesh.new(); x0, x1, y0, y1 = -L/2, L/2, -W/2, W/2
    v = [bm.verts.new((x, y, z)) for z in (BOT, TOP) for (x, y) in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    bm.faces.new(v[4:8]); bm.faces.new(v[0:4][::-1])
    for i in range(4): bm.faces.new((v[i], v[(i+1)%4], v[4+(i+1)%4], v[4+i]))
    bm.normal_update(); return new_obj('kit_calcada_reta_4m', bm)
def piece_arc(R=10.9, ang=90, seg=24, name=None):
    """Calçada em arco: anel de raio interno R e externo R+W, de 0 a 'ang' graus. Malha contínua (sem degrau)."""
    bm = bmesh.new(); a = [math.radians(ang) * i / seg for i in range(seg + 1)]
    inner = [(R*math.cos(t), R*math.sin(t)) for t in a]; outer = [((R+W)*math.cos(t), (R+W)*math.sin(t)) for t in a]
    top_in = [bm.verts.new((x, y, TOP)) for x, y in inner]; top_out = [bm.verts.new((x, y, TOP)) for x, y in outer]
    bot_in = [bm.verts.new((x, y, BOT)) for x, y in inner]; bot_out = [bm.verts.new((x, y, BOT)) for x, y in outer]
    for i in range(seg):
        bm.faces.new((top_in[i], top_out[i], top_out[i+1], top_in[i+1]))
        bm.faces.new((bot_in[i], bot_in[i+1], bot_out[i+1], bot_out[i]))
        bm.faces.new((top_in[i], top_in[i+1], bot_in[i+1], bot_in[i]))
        bm.faces.new((top_out[i], bot_out[i], bot_out[i+1], top_out[i+1]))
    bm.normal_update(); return new_obj(name or f'kit_calcada_curva_R{int(R)}', bm)
def piece_corner(c=1.2):
    """Quina quadrada 2,4 x 2,4 com chanfro de 1,2 m (sem ponta)."""
    bm = bmesh.new(); pts = [(0, 0), (W, 0), (W, W - c), (W - c, W), (0, W)]
    top = [bm.verts.new((x - W/2, y - W/2, TOP)) for x, y in pts]; bot = [bm.verts.new((x - W/2, y - W/2, BOT)) for x, y in pts]
    bm.faces.new(top); bm.faces.new(bot[::-1])
    n = len(pts)
    for i in range(n): bm.faces.new((top[i], top[(i+1)%n], bot[(i+1)%n], bot[i]))
    bm.normal_update(); return new_obj('kit_quina_chanfro', bm)
def piece_plaza(S=8.0):
    """Pátio/calçadão retangular S x S com topo na cota da calçada."""
    bm = bmesh.new(); h = S/2
    top = [bm.verts.new((x, y, TOP)) for x, y in ((-h,-h),(h,-h),(h,h),(-h,h))]
    bot = [bm.verts.new((x, y, BOT)) for x, y in ((-h,-h),(h,-h),(h,h),(-h,h))]
    bm.faces.new(top); bm.faces.new(bot[::-1])
    for i in range(4): bm.faces.new((top[i], top[(i+1)%4], bot[(i+1)%4], bot[i]))
    bm.normal_update(); return new_obj('kit_patio_8m', bm)
ORDER = [
  ('1/4 reta 4 m (calçada modular)', lambda: piece_straight(4.0)),
  ('2/4 curva R10,9 (nós 1, 3, 5, 6; 90 graus, malha contínua)', lambda: piece_arc(10.9, 90, name='kit_calcada_curva_R10p9')),
  ('2/4 curva R9,5 (nó 7)', lambda: piece_arc(9.5, 90, name='kit_calcada_curva_R9p5')),
  ('3/4 quina com chanfro', lambda: piece_corner()),
  ('4/4 pátio/calçadão 8 m', lambda: piece_plaza(8.0)),
]
state = {'i': 0}
def step():
    i = state['i']
    if i >= len(ORDER):
        export(); return None
    label, fn = ORDER[i]; ob = fn(); ob.location = (i * 9.0, 0, 0)
    print('KIT etapa', label, 'verts', len(ob.data.vertices))
    state['i'] = i + 1
    return 1.2  # pausa para ver a peça na viewport
def frame_top():
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.shading.type = 'MATERIAL'
            with bpy.context.temp_override(area=area, region=area.regions[-1]):
                bpy.ops.view3d.view_axis(type='TOP'); bpy.ops.view3d.view_all()
    print('KIT vista de cima + material')
    return None
def export():
    for ob in bpy.context.scene.objects:
        if ob.type == 'MESH': ob.select_set(True)
    out = os.path.join(OUT_DIR, 'calcada-kit.glb')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_yup=True, export_apply=True)
    print('KIT exportado', out, os.path.getsize(out), 'bytes')
    bpy.app.timers.register(frame_top, first_interval=0.5)
bpy.app.timers.register(step, first_interval=0.5)
