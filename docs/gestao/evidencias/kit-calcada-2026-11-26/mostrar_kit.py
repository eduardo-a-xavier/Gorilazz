"""Abre o kit (calcada-kit.glb) na janela do Blender para acompanhamento: vista de topo enquadrada."""
import bpy, os
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(here, 'calcada-kit.glb'))
bpy.ops.object.select_all(action='SELECT')
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        with bpy.context.temp_override(area=area, region=area.regions[-1]):
            bpy.ops.view3d.view_selected(use_all_regions=False)
            bpy.ops.view3d.view_axis(type='TOP')
            bpy.ops.view3d.view_selected(use_all_regions=False)
print('KIT MOSTRADO')
