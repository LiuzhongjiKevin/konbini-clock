"""Run: blender --background --python blender_scene.py
Creates editable .blend and web-ready .glb from the same geometry used by the site.
Requires Blender 4.x. This script was not executed in the hosted build environment.
"""
import bpy,json,os,math
from mathutils import Vector
base=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
items=json.load(open(os.path.join(base,'dist','scene.json')))
parents={}
def rgba(h):
 h=h.lstrip('#');return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))+(1,)
for s in items:
 # Three.js Y-up -> Blender Z-up
 x,y,z=s['position'];sx,sy,sz=s['size']
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y))
 obj=bpy.context.object;obj.name=s['name'];obj.scale=(sx,sz,sy)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mat=bpy.data.materials.new(s['name']);mat.diffuse_color=rgba(s['color']);mat.use_nodes=True
 bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba(s['color']);bs.inputs['Roughness'].default_value=s.get('roughness',.62);bs.inputs['Metallic'].default_value=s.get('metalness',.08)
 if s.get('glass'):
  bs.inputs['Transmission Weight'].default_value=.8;bs.inputs['Alpha'].default_value=.2
 if s.get('emissive'):
  bs.inputs['Emission Color'].default_value=rgba(s['color']);bs.inputs['Emission Strength'].default_value=s['emissive']
 obj.data.materials.append(mat)
 bevel=obj.modifiers.new('Soft edges','BEVEL');bevel.width=.015;bevel.segments=2
 if s.get('door'):
  empty=bpy.data.objects.new(s['name']+'_Controller',None);bpy.context.collection.objects.link(empty);parents[s['name']]=empty;obj.parent=empty
 if s.get('parent'):obj.parent=parents[s['parent']]
for x in [-2.5,0,2.5]:
 bpy.ops.object.light_add(type='AREA',location=(x,1.8,3.2));bpy.context.object.data.energy=100;bpy.context.object.data.color=(1,.82,.56);bpy.context.object.data.shape='DISK';bpy.context.object.data.size=3
bpy.ops.object.camera_add(location=(14,-17,11));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=19;bpy.context.scene.camera=cam
bpy.context.scene.world.color=(.025,.04,.08)
bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=32
bpy.context.scene.render.resolution_x=1600;bpy.context.scene.render.resolution_y=1200;bpy.context.scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(base,'rainy-konbini.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(base,'rainy-konbini.glb'),export_format='GLB')
print('Saved rainy-konbini.blend and rainy-konbini.glb')
