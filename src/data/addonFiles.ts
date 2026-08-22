import { AddonFile } from '../types';

export const GODOT_ADDON_FILES: AddonFile[] = [
  {
    path: 'addons/godot_ai_copilot/plugin.cfg',
    filename: 'plugin.cfg',
    language: 'config',
    description: 'Godot Engine plugin manifest. Defines the plugin name, version, author, and entry script.',
    content: `[plugin]

name="Godot AI Copilot"
description="Agentic AI Game Dev Assistant & Code Generator directly inside Godot 4 Editor."
author="AI Studio Godot Copilot"
version="1.0.0"
script="godot_ai_copilot.gd"
`
  },
  {
    path: 'addons/godot_ai_copilot/godot_ai_copilot.gd',
    filename: 'godot_ai_copilot.gd',
    language: 'gdscript',
    description: 'Main EditorPlugin script with full Agentic Physics Body Wrapper, Scene Builder, Error Fixer, Shader Applier, Asset Organizer, and File System IDE capabilities.',
    content: `@tool
extends EditorPlugin
class_name GodotAICopilotPlugin

var dock_instance: Control
const DOCK_SCENE := preload("res://addons/godot_ai_copilot/dock.tscn")

func _enter_tree() -> void:
	dock_instance = DOCK_SCENE.instantiate()
	dock_instance.set_editor_plugin(self)
	add_control_to_bottom_panel(dock_instance, "AI Copilot")
	print("[Godot AI Copilot Pro] Plugin activated with full Agentic IDE capabilities (Physics Wrappers, Scene Builder, Error Fixer, Shader Studio)!")

func _exit_tree() -> void:
	if is_instance_valid(dock_instance):
		remove_control_from_bottom_panel(dock_instance)
		dock_instance.queue_free()
	print("[Godot AI Copilot Pro] Plugin unloaded.")

# Helper to get current active script editor content
func get_active_script_code() -> String:
	var script_editor := EditorInterface.get_script_editor()
	if not script_editor:
		return ""
	var current_editor := script_editor.get_current_editor()
	if not current_editor:
		return ""
	var base_editor := current_editor.get_base_editor()
	if base_editor is TextEdit:
		return base_editor.text
	return ""

# Helper to insert or replace generated code in active script
func insert_code_to_active_script(code_to_insert: String, replace_all: bool = false) -> bool:
	var script_editor := EditorInterface.get_script_editor()
	if not script_editor:
		return false
	var current_editor := script_editor.get_current_editor()
	if not current_editor:
		return false
	var base_editor := current_editor.get_base_editor()
	if base_editor is TextEdit:
		if replace_all:
			base_editor.text = code_to_insert
		else:
			base_editor.insert_text_at_caret(code_to_insert)
		return true
	return false

# Inspect open scene hierarchy with rich node properties (position, texture size, class)
func get_scene_tree_summary() -> Dictionary:
	var root := EditorInterface.get_edited_scene_root()
	if not root:
		return {"status": "no_scene_open", "nodes": []}
	return {
		"status": "ok",
		"root_name": root.name,
		"root_type": root.get_class(),
		"nodes": _dump_node_tree(root)
	}

func _dump_node_tree(node: Node) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var item := {
		"name": node.name,
		"type": node.get_class(),
		"path": str(node.get_path()),
		"script": node.get_script().resource_path if node.get_script() else "",
		"children_count": node.get_child_count()
	}
	
	if node is Node2D:
		item["position"] = [snapped(node.position.x, 0.1), snapped(node.position.y, 0.1)]
		item["global_position"] = [snapped(node.global_position.x, 0.1), snapped(node.global_position.y, 0.1)]
	elif node is Control:
		item["position"] = [snapped(node.position.x, 0.1), snapped(node.position.y, 0.1)]
		item["size"] = [snapped(node.size.x, 0.1), snapped(node.size.y, 0.1)]
	
	if node is Sprite2D and (node as Sprite2D).texture:
		var tex_size := (node as Sprite2D).texture.get_size()
		item["texture"] = {
			"path": (node as Sprite2D).texture.resource_path,
			"size": [int(tex_size.x), int(tex_size.y)]
		}
	
	result.append(item)
	for child in node.get_children():
		result.append_array(_dump_node_tree(child))
	return result

# Get selected node information
func get_selected_nodes_info() -> Array[Dictionary]:
	var selection := EditorInterface.get_selection()
	var selected_nodes := selection.get_selected_nodes()
	var out: Array[Dictionary] = []
	for n in selected_nodes:
		var n_info := {
			"name": n.name,
			"type": n.get_class(),
			"path": str(n.get_path()),
			"is_canvas_item": n is CanvasItem,
			"is_node3d": n is Node3D
		}
		if n is Node2D:
			n_info["position"] = [n.position.x, n.position.y]
			n_info["global_position"] = [n.global_position.x, n.global_position.y]
		out.append(n_info)
	return out

# Scan all files in project res://
func scan_project_files(max_files: int = 150) -> PackedStringArray:
	var files := PackedStringArray()
	_scan_dir_recursive("res://", files, max_files)
	return files

func _scan_dir_recursive(path: String, out_files: PackedStringArray, max_files: int) -> void:
	if out_files.size() >= max_files:
		return
	var dir := DirAccess.open(path)
	if not dir:
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if file_name != "." and file_name != ".." and not file_name.begins_with(".import"):
			var full_path := path.path_join(file_name)
			if dir.current_is_dir():
				if file_name != ".git" and file_name != ".godot":
					_scan_dir_recursive(full_path, out_files, max_files)
			else:
				out_files.append(full_path)
		file_name = dir.get_next()
	dir.list_dir_end()

# Helper to reliably find any node in the active scene tree by path, leaf name, or partial match
func _find_target_node(scene_root: Node, identifier: String) -> Node:
	if not scene_root or identifier.strip_edges().is_empty():
		return scene_root
	
	var clean_id := identifier.strip_edges()
	if clean_id == scene_root.name or clean_id == "/" or clean_id == "." or clean_id == "":
		return scene_root
	
	# 1. Direct NodePath lookup
	if scene_root.has_node(NodePath(clean_id)):
		return scene_root.get_node(NodePath(clean_id))
	
	# 2. Try find_child exact
	var by_name := scene_root.find_child(clean_id, true, false)
	if by_name:
		return by_name
	
	# 3. Try matching last component of a path (e.g. "Assets/Storages/Chest" -> "Chest")
	var leaf_name := clean_id.get_file()
	if not leaf_name.is_empty():
		var by_leaf := scene_root.find_child(leaf_name, true, false)
		if by_leaf:
			return by_leaf
	
	# 4. Search all nodes for partial match or suffix match
	var all_nodes := _dump_node_tree(scene_root)
	for n_data in all_nodes:
		var n_path: String = n_data.get("path", "")
		if n_path.ends_with(clean_id) or clean_id.to_lower() in n_path.to_lower():
			return scene_root.get_node_or_null(NodePath(n_path))
			
	return null

# Apply shader directly onto selected node or specified node
func apply_shader_to_node(shader_code: String, target_node: Node = null, save_path: String = "") -> Dictionary:
	var node_to_apply: Node = target_node
	if not node_to_apply:
		var selection := EditorInterface.get_selection().get_selected_nodes()
		if not selection.is_empty():
			node_to_apply = selection[0]
		else:
			node_to_apply = EditorInterface.get_edited_scene_root()
	
	if not node_to_apply:
		return {"success": false, "message": "No node selected or scene open to apply shader."}
	
	# Optionally save .gdshader file
	if not save_path.is_empty():
		if not save_path.begins_with("res://"):
			save_path = "res://" + save_path
		var dir_p := save_path.get_base_dir()
		if not DirAccess.dir_exists_absolute(dir_p):
			DirAccess.make_dir_recursive_absolute(dir_p)
		var f := FileAccess.open(save_path, FileAccess.WRITE)
		if f:
			f.store_string(shader_code)
			f.close()
			EditorInterface.get_resource_filesystem().scan()
	
	var shader := Shader.new()
	shader.code = shader_code
	var mat := ShaderMaterial.new()
	mat.shader = shader
	
	if node_to_apply is CanvasItem:
		(node_to_apply as CanvasItem).material = mat
		return {"success": true, "message": "Applied ShaderMaterial to 2D node: " + node_to_apply.name}
	elif node_to_apply is GeometryInstance3D:
		(node_to_apply as GeometryInstance3D).material_override = mat
		return {"success": true, "message": "Applied ShaderMaterial to 3D node: " + node_to_apply.name}
	elif "material" in node_to_apply:
		node_to_apply.set("material", mat)
		return {"success": true, "message": "Applied ShaderMaterial to node: " + node_to_apply.name}
	
	return {"success": false, "message": "Selected node '" + node_to_apply.name + "' (" + node_to_apply.get_class() + ") does not support materials."}

# Execute real IDE / File system / Scene tree actions inside Godot
func execute_agent_action(action: Dictionary) -> Dictionary:
	var action_type: String = action.get("type", "")
	var res := {"success": false, "message": ""}
	var scene_root := EditorInterface.get_edited_scene_root()
	
	match action_type:
		# =========================================================================
		# 1. ADVANCED PHYSICS BODY & COLLIDER AUTO-WRAPPER
		# =========================================================================
		"wrap_with_body", "attach_collision", "make_collision":
			if not scene_root:
				res.message = "No active scene open in Godot."
				return res
			
			var target_id: String = action.get("target", action.get("node", ""))
			var target_node := _find_target_node(scene_root, target_id)
			if not target_node:
				res.message = "Target node '" + target_id + "' not found in active scene."
				return res
			
			var body_type: String = action.get("body_type", "StaticBody2D")
			var shape_type: String = action.get("shape", "rectangle")
			var custom_size: Array = action.get("size", [])
			var original_parent := target_node.get_parent()
			if not original_parent:
				original_parent = scene_root
			
			var original_global_pos := Vector2.ZERO
			if target_node is Node2D:
				original_global_pos = (target_node as Node2D).global_position
			
			# Auto-calculate collision size from Sprite texture if available
			var col_size := Vector2(32, 32)
			if custom_size.size() >= 2:
				col_size = Vector2(custom_size[0], custom_size[1])
			elif target_node is Sprite2D and (target_node as Sprite2D).texture:
				var t_size := (target_node as Sprite2D).texture.get_size()
				var t_scale := (target_node as Sprite2D).scale
				col_size = Vector2(abs(t_size.x * t_scale.x), abs(t_size.y * t_scale.y))
			elif target_node is Control:
				col_size = (target_node as Control).size
			
			# Create Physics Body Node (StaticBody2D, Area2D, CharacterBody2D, RigidBody2D)
			var body_node: Node = null
			if ClassDB.class_exists(body_type):
				body_node = ClassDB.instantiate(body_type)
			else:
				body_node = StaticBody2D.new()
			
			var original_name := target_node.name
			body_node.name = action.get("body_name", original_name + "_Body")
			original_parent.add_child(body_node)
			body_node.owner = scene_root
			
			if body_node is Node2D:
				(body_node as Node2D).global_position = original_global_pos
			
			# Reparent target visual node under the new physics body
			target_node.reparent(body_node, false)
			if target_node is Node2D:
				(target_node as Node2D).position = Vector2.ZERO
			target_node.owner = scene_root
			
			# Create and attach CollisionShape2D
			var col := CollisionShape2D.new()
			col.name = "CollisionShape2D"
			if shape_type == "circle":
				var c := CircleShape2D.new()
				c.radius = max(col_size.x, col_size.y) / 2.0
				col.shape = c
			elif shape_type == "capsule":
				var cap := CapsuleShape2D.new()
				cap.radius = min(col_size.x, col_size.y) / 2.0
				cap.height = max(col_size.x, col_size.y)
				col.shape = cap
			else:
				var rect := RectangleShape2D.new()
				rect.size = col_size
				col.shape = rect
			
			body_node.add_child(col)
			col.owner = scene_root
			
			# Select the new body in Godot Editor
			var sel := EditorInterface.get_selection()
			sel.clear()
			sel.add_node(body_node)
			
			res.success = true
			res.message = "Successfully wrapped '" + original_name + "' inside [" + body_type + "] with " + shape_type + " CollisionShape2D (" + str(col_size.x) + "x" + str(col_size.y) + ") at position " + str(original_global_pos)
			return res

		# =========================================================================
		# 2. SCENE NODE REPARENTING, MODIFICATION, DELETION
		# =========================================================================
		"reparent_node":
			if not scene_root:
				res.message = "No active scene open."
				return res
			var node_id: String = action.get("node", "")
			var new_parent_id: String = action.get("new_parent", action.get("parent", ""))
			var target_node := _find_target_node(scene_root, node_id)
			var new_parent := _find_target_node(scene_root, new_parent_id)
			
			if not target_node:
				res.message = "Node '" + node_id + "' not found."
				return res
			if not new_parent:
				res.message = "Destination parent '" + new_parent_id + "' not found."
				return res
			
			var keep_transform: bool = action.get("keep_global_transform", true)
			target_node.reparent(new_parent, keep_transform)
			target_node.owner = scene_root
			res.success = true
			res.message = "Reparented '" + target_node.name + "' under '" + new_parent.name + "'"

		"delete_node":
			if not scene_root:
				res.message = "No active scene open."
				return res
			var target_id: String = action.get("target", action.get("name", ""))
			var target_node := _find_target_node(scene_root, target_id)
			if not target_node:
				res.message = "Node '" + target_id + "' not found to delete."
				return res
			var n_name := target_node.name
			target_node.queue_free()
			res.success = true
			res.message = "Deleted node '" + n_name + "' from scene tree."

		"set_node_properties":
			if not scene_root:
				res.message = "No active scene open."
				return res
			var target_id: String = action.get("target", action.get("node", ""))
			var target_node := _find_target_node(scene_root, target_id)
			if not target_node:
				res.message = "Node '" + target_id + "' not found."
				return res
			var props: Dictionary = action.get("properties", {})
			for k in props:
				var v = props[k]
				if k == "position" and v is Array and v.size() >= 2:
					target_node.set("position", Vector2(v[0], v[1]))
				elif k == "global_position" and v is Array and v.size() >= 2:
					target_node.set("global_position", Vector2(v[0], v[1]))
				elif k == "scale" and v is Array and v.size() >= 2:
					target_node.set("scale", Vector2(v[0], v[1]))
				elif k == "size" and v is Array and v.size() >= 2:
					target_node.set("size", Vector2(v[0], v[1]))
				else:
					target_node.set(k, v)
			res.success = true
			res.message = "Updated properties for '" + target_node.name + "': " + str(props.keys())

		"attach_script":
			if not scene_root:
				res.message = "No active scene open."
				return res
			var target_id: String = action.get("target", action.get("node", ""))
			var target_node := _find_target_node(scene_root, target_id)
			var script_path: String = action.get("path", "")
			var script_content: String = action.get("content", "")
			if not target_node:
				res.message = "Node '" + target_id + "' not found."
				return res
			if not script_path.begins_with("res://"): script_path = "res://" + script_path
			
			if not script_content.is_empty():
				var d_path := script_path.get_base_dir()
				if not DirAccess.dir_exists_absolute(d_path):
					DirAccess.make_dir_recursive_absolute(d_path)
				var f := FileAccess.open(script_path, FileAccess.WRITE)
				if f:
					f.store_string(script_content)
					f.close()
					EditorInterface.get_resource_filesystem().scan()
			
			if ResourceLoader.exists(script_path):
				var scr = ResourceLoader.load(script_path)
				target_node.set_script(scr)
				res.success = true
				res.message = "Attached script " + script_path + " to node '" + target_node.name + "'"
			else:
				res.message = "Script not found at: " + script_path

		# =========================================================================
		# 3. FILE OPERATIONS
		# =========================================================================
		"delete_file":
			var target_path: String = action.get("path", "")
			if target_path.is_empty():
				res.message = "File path cannot be empty"
				return res
			if not target_path.begins_with("res://"):
				target_path = "res://" + target_path
			
			if FileAccess.file_exists(target_path):
				var err := DirAccess.remove_absolute(target_path)
				if FileAccess.file_exists(target_path + ".import"):
					DirAccess.remove_absolute(target_path + ".import")
				if err == OK:
					EditorInterface.get_resource_filesystem().scan()
					res.success = true
					res.message = "Deleted " + target_path
				else:
					res.message = "Failed to delete " + target_path + " (Error: " + str(err) + ")"
			else:
				res.message = "File not found: " + target_path
		
		"delete_matching":
			var pattern: String = action.get("pattern", "")
			if pattern.is_empty():
				res.message = "Pattern cannot be empty"
				return res
			var all_files := scan_project_files(500)
			var deleted_count := 0
			var deleted_names: Array[String] = []
			for f in all_files:
				var fname := f.get_file()
				if pattern.to_lower() in fname.to_lower():
					var err := DirAccess.remove_absolute(f)
					if FileAccess.file_exists(f + ".import"):
						DirAccess.remove_absolute(f + ".import")
					if err == OK:
						deleted_count += 1
						deleted_names.append(fname)
			if deleted_count > 0:
				EditorInterface.get_resource_filesystem().scan()
				res.success = true
				res.message = "Deleted " + str(deleted_count) + " files matching '" + pattern + "': " + ", ".join(deleted_names)
			else:
				res.message = "No files found matching '" + pattern + "'"
		
		"move_file":
			var src: String = action.get("from", "")
			var dst: String = action.get("to", "")
			if not src.begins_with("res://"): src = "res://" + src
			if not dst.begins_with("res://"): dst = "res://" + dst
			var dst_dir := dst.get_base_dir()
			if not DirAccess.dir_exists_absolute(dst_dir):
				DirAccess.make_dir_recursive_absolute(dst_dir)
			if FileAccess.file_exists(src):
				var err := DirAccess.rename_absolute(src, dst)
				if FileAccess.file_exists(src + ".import"):
					DirAccess.rename_absolute(src + ".import", dst + ".import")
				if err == OK:
					EditorInterface.get_resource_filesystem().scan()
					res.success = true
					res.message = "Moved " + src + " -> " + dst
				else:
					res.message = "Failed to move file (Error: " + str(err) + ")"
			else:
				res.message = "Source file not found: " + src

		"create_file":
			var file_path: String = action.get("path", "")
			var content: String = action.get("content", "")
			if not file_path.begins_with("res://"):
				file_path = "res://" + file_path
			var parent_dir := file_path.get_base_dir()
			if not DirAccess.dir_exists_absolute(parent_dir):
				DirAccess.make_dir_recursive_absolute(parent_dir)
			var file := FileAccess.open(file_path, FileAccess.WRITE)
			if file:
				file.store_string(content)
				file.close()
				EditorInterface.get_resource_filesystem().scan()
				res.success = true
				res.message = "Created " + file_path
			else:
				res.message = "Failed to create " + file_path

		"organize_assets":
			var all_files := scan_project_files(500)
			var moved_count := 0
			for f in all_files:
				var ext := f.get_extension().to_lower()
				var target_dir := ""
				if ext in ["png", "jpg", "jpeg", "svg", "webp"]:
					target_dir = "res://Assets/Textures"
				elif ext in ["wav", "ogg", "mp3"]:
					target_dir = "res://Assets/Audio"
				elif ext in ["gdshader"]:
					target_dir = "res://Shaders"
				elif ext in ["gd"]:
					if not f.begins_with("res://addons/") and not f.begins_with("res://Scripts/"):
						target_dir = "res://Scripts"
				if not target_dir.is_empty() and not f.begins_with(target_dir):
					var dst := target_dir.path_join(f.get_file())
					if not DirAccess.dir_exists_absolute(target_dir):
						DirAccess.make_dir_recursive_absolute(target_dir)
					if DirAccess.rename_absolute(f, dst) == OK:
						if FileAccess.file_exists(f + ".import"):
							DirAccess.rename_absolute(f + ".import", dst + ".import")
						moved_count += 1
			EditorInterface.get_resource_filesystem().scan()
			res.success = true
			res.message = "Organized " + str(moved_count) + " assets into structured directories (Textures, Audio, Shaders, Scripts)."

		# =========================================================================
		# 4. SCENE & NODE TREE BUILDER
		# =========================================================================
		"add_node":
			var node_type: String = action.get("node_type", "Node2D")
			var node_name: String = action.get("name", node_type)
			var parent_name: String = action.get("parent", "")
			if not scene_root:
				res.message = "No active scene open in Godot. Open or create a scene first."
				return res
			
			var parent_node := _find_target_node(scene_root, parent_name)
			if not parent_node:
				parent_node = scene_root
			
			if ClassDB.class_exists(node_type):
				var new_node: Node = ClassDB.instantiate(node_type)
				if new_node:
					new_node.name = node_name
					parent_node.add_child(new_node)
					new_node.owner = scene_root
					
					# Set properties if provided
					var properties: Dictionary = action.get("properties", {})
					for prop_k in properties:
						var val = properties[prop_k]
						if prop_k == "position" and val is Array and val.size() >= 2:
							new_node.set("position", Vector2(val[0], val[1]))
						elif prop_k == "size" and val is Array and val.size() >= 2:
							new_node.set("size", Vector2(val[0], val[1]))
						else:
							new_node.set(prop_k, val)
					
					# Automatically add CollisionShape child if requested
					if action.get("add_collision_shape", false) and (new_node is CharacterBody2D or new_node is Area2D or new_node is RigidBody2D or new_node is StaticBody2D):
						var col_shape := CollisionShape2D.new()
						col_shape.name = "CollisionShape2D"
						var rect := RectangleShape2D.new()
						rect.size = Vector2(32, 32)
						col_shape.shape = rect
						new_node.add_child(col_shape)
						col_shape.owner = scene_root
					
					res.success = true
					res.message = "Added Node [" + node_type + "] named '" + node_name + "' under '" + parent_node.name + "'"
					return res
			res.message = "Could not instantiate node class: " + node_type

		"create_collision_shape":
			var parent_name: String = action.get("parent", "")
			var shape_type: String = action.get("shape", "rectangle") # rectangle, circle, capsule
			if not scene_root:
				res.message = "No active scene open."
				return res
			var parent_node := _find_target_node(scene_root, parent_name)
			if not parent_node:
				parent_node = scene_root
			
			var col := CollisionShape2D.new()
			col.name = "CollisionShape2D"
			var col_size := Vector2(32, 32)
			if action.has("size") and action["size"] is Array and action["size"].size() >= 2:
				col_size = Vector2(action["size"][0], action["size"][1])
			
			if shape_type == "circle":
				var c := CircleShape2D.new()
				c.radius = max(col_size.x, col_size.y) / 2.0
				col.shape = c
			elif shape_type == "capsule":
				var cap := CapsuleShape2D.new()
				cap.radius = min(col_size.x, col_size.y) / 2.0
				cap.height = max(col_size.x, col_size.y)
				col.shape = cap
			else:
				var r := RectangleShape2D.new()
				r.size = col_size
				col.shape = r
			
			parent_node.add_child(col)
			col.owner = scene_root
			res.success = true
			res.message = "Created " + shape_type + " CollisionShape2D under " + parent_node.name

		"create_scene":
			var scene_path: String = action.get("path", "res://Scenes/NewScene.tscn")
			var root_type: String = action.get("root_type", "CharacterBody2D")
			var root_name: String = action.get("name", "Player")
			if not scene_path.begins_with("res://"): scene_path = "res://Scenes/" + scene_path.get_file()
			var parent_d := scene_path.get_base_dir()
			if not DirAccess.dir_exists_absolute(parent_d):
				DirAccess.make_dir_recursive_absolute(parent_d)
			
			if ClassDB.class_exists(root_type):
				var root: Node = ClassDB.instantiate(root_type)
				root.name = root_name
				
				# Add default sprite + collision shape for characters
				if root is CharacterBody2D:
					var spr := Sprite2D.new()
					spr.name = "Sprite2D"
					root.add_child(spr)
					spr.owner = root
					var col := CollisionShape2D.new()
					col.name = "CollisionShape2D"
					var r := RectangleShape2D.new()
					r.size = Vector2(32, 32)
					col.shape = r
					root.add_child(col)
					col.owner = root
				
				var packed := PackedScene.new()
				var pack_err := packed.pack(root)
				if pack_err == OK:
					var save_err := ResourceSaver.save(packed, scene_path)
					if save_err == OK:
						EditorInterface.get_resource_filesystem().scan()
						EditorInterface.open_scene_from_path(scene_path)
						res.success = true
						res.message = "Created and opened new scene at " + scene_path
					else:
						res.message = "Failed to save scene: " + str(save_err)
				else:
					res.message = "Failed to pack scene: " + str(pack_err)
			else:
				res.message = "Invalid root type: " + root_type

		# =========================================================================
		# 5. SHADER APPLIER
		# =========================================================================
		"apply_shader":
			var shader_code: String = action.get("shader_code", "")
			var save_path: String = action.get("save_path", "")
			var target_id: String = action.get("target", "")
			var target_node: Node = null
			if not target_id.is_empty() and scene_root:
				target_node = _find_target_node(scene_root, target_id)
			res = apply_shader_to_node(shader_code, target_node, save_path)

		# =========================================================================
		# 6. SCRIPT REPLACEMENT & INJECTION
		# =========================================================================
		"replace_active_script":
			var content: String = action.get("content", "")
			if insert_code_to_active_script(content, true):
				res.success = true
				res.message = "Replaced active script content"
			else:
				res.message = "No active script editor open"

		_:
			res.message = "Unknown action type: " + action_type
			
	return res
`
  },
  {
    path: 'addons/godot_ai_copilot/dock.gd',
    filename: 'dock.gd',
    language: 'gdscript',
    description: 'Dock UI Controller with Agentic Scene Builder, 1-Click Error Fixer, Shader Applier, Asset Organizer, and Script Injection.',
    content: `@tool
extends Control

var editor_plugin: EditorPlugin
var http_request: HTTPRequest

@onready var prompt_edit: TextEdit = $VBox/InputContainer/PromptEdit
@onready var send_button: Button = $VBox/InputContainer/ButtonRow/SendBtn
@onready var fix_error_button: Button = $VBox/InputContainer/ButtonRow/FixErrorBtn
@onready var apply_shader_button: Button = $VBox/InputContainer/ButtonRow/ApplyShaderBtn
@onready var insert_button: Button = $VBox/InputContainer/ButtonRow/InsertBtn
@onready var copy_button: Button = $VBox/InputContainer/ButtonRow/CopyBtn
@onready var clear_button: Button = $VBox/InputContainer/ButtonRow/ClearBtn
@onready var include_script_checkbox: CheckBox = $VBox/InputContainer/ButtonRow/IncludeScriptCheck
@onready var mode_option: OptionButton = $VBox/Header/ModeOption
@onready var server_url_edit: LineEdit = $VBox/Header/ServerUrlEdit
@onready var chat_display: RichTextLabel = $VBox/ChatDisplay
@onready var status_label: Label = $VBox/Header/StatusLabel

var last_generated_code: String = ""
var last_generated_shader: String = ""

func _ready() -> void:
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)
	
	send_button.pressed.connect(_on_send_pressed)
	if fix_error_button: fix_error_button.pressed.connect(_on_fix_error_pressed)
	if apply_shader_button: apply_shader_button.pressed.connect(_on_apply_shader_pressed)
	insert_button.pressed.connect(_on_insert_pressed)
	copy_button.pressed.connect(_on_copy_pressed)
	clear_button.pressed.connect(_on_clear_pressed)
	
	# Populate modes
	mode_option.clear()
	mode_option.add_item("Godot 4 Game Dev Chat", 0)
	mode_option.add_item("Generate GDScript", 1)
	mode_option.add_item("Fix Script Errors / Refactor", 2)
	mode_option.add_item("Shader Studio (.gdshader)", 3)
	mode_option.add_item("Scene & Node Tree Builder", 4)
	mode_option.add_item("Asset & Project Organizer", 5)
	mode_option.add_item("Agentic IDE Full Suite", 6)
	
	insert_button.disabled = true
	copy_button.disabled = true
	if apply_shader_button: apply_shader_button.disabled = true
	
	_append_chat("[b][color=#478cbf]Godot AI Agentic IDE Copilot Pro Ready![/color][/b]\\n• [color=#5cb85c]Scene Builder[/color]: Create nodes, add collisions, setup hierarchies.\\n• [color=#e6db74]1-Click Error Fixer[/color]: Click 'Fix Error' to diagnose active script.\\n• [color=#66d9ef]Shader Studio[/color]: Generate & Apply shaders directly onto selected nodes.\\n• [color=#fd971f]Asset Organizer[/color]: Batch sort textures, audio, shaders into structured folders.\\n")

func set_editor_plugin(plugin: EditorPlugin) -> void:
	editor_plugin = plugin

func _on_fix_error_pressed() -> void:
	var active_code := ""
	if editor_plugin and editor_plugin.has_method("get_active_script_code"):
		active_code = editor_plugin.get_active_script_code()
	
	if active_code.strip_edges().is_empty():
		_append_chat("[color=#f0ad4e]⚠️ Please open a GDScript file in the Script Editor first to run the 1-Click Error Fixer.[/color]\\n")
		return
	
	prompt_edit.text = "Analyze this GDScript for potential errors, missing type declarations, Godot 3 to 4 breaking changes, and return the fixed, refactored script."
	mode_option.selected = 2 # Fix Script Errors
	include_script_checkbox.button_pressed = true
	_on_send_pressed()

func _on_apply_shader_pressed() -> void:
	var code_to_apply := last_generated_shader if not last_generated_shader.is_empty() else last_generated_code
	if code_to_apply.is_empty():
		status_label.text = "No shader code generated yet."
		return
	if editor_plugin and editor_plugin.has_method("apply_shader_to_node"):
		var res: Dictionary = editor_plugin.apply_shader_to_node(code_to_apply, null, "res://Shaders/generated_shader.gdshader")
		if res.get("success", false):
			_append_chat("[color=#5cb85c]✓ " + res.get("message", "Shader applied successfully!") + "[/color]\\n")
			status_label.text = "Shader applied to node!"
		else:
			_append_chat("[color=#d9534f]✗ " + res.get("message", "Failed to apply shader.") + "[/color]\\n")
			status_label.text = "Select a 2D or 3D node first."

func _on_send_pressed() -> void:
	var prompt_text := prompt_edit.text.strip_edges()
	if prompt_text.is_empty():
		return
	
	var server_url := server_url_edit.text.strip_edges()
	if server_url.is_empty():
		server_url = "http://localhost:3000"
	
	# Clean up any accidental spaces or newlines from mobile keyboards
	server_url = server_url.replace(" ", "").replace("\\t", "").replace("\\n", "").replace("\\r", "")
	
	# Prepend https:// if protocol is missing and not localhost
	if not server_url.begins_with("http://") and not server_url.begins_with("https://"):
		server_url = "https://" + server_url
	
	# Strip trailing slash if present
	while server_url.ends_with("/"):
		server_url = server_url.left(server_url.length() - 1)
	
	# Avoid duplicate /api/godot/prompt if user pasted full path
	if server_url.ends_with("/api/godot/prompt"):
		server_url = server_url.left(server_url.length() - 17)
	
	var endpoint := server_url + "/api/godot/prompt"
	
	var context_code := ""
	if include_script_checkbox.button_pressed and editor_plugin and editor_plugin.has_method("get_active_script_code"):
		context_code = editor_plugin.get_active_script_code()
	
	var project_files: Array[String] = []
	if editor_plugin and editor_plugin.has_method("scan_project_files"):
		var scanned: PackedStringArray = editor_plugin.scan_project_files(80)
		for f in scanned:
			project_files.append(f)
	
	var scene_tree_data: Dictionary = {}
	if editor_plugin and editor_plugin.has_method("get_scene_tree_summary"):
		scene_tree_data = editor_plugin.get_scene_tree_summary()
	
	var selected_nodes: Array[Dictionary] = []
	if editor_plugin and editor_plugin.has_method("get_selected_nodes_info"):
		selected_nodes = editor_plugin.get_selected_nodes_info()
	
	var mode_name := "chat"
	match mode_option.selected:
		1: mode_name = "generate_script"
		2: mode_name = "fix_error"
		3: mode_name = "generate_shader"
		4: mode_name = "scene_builder"
		5: mode_name = "asset_organizer"
		6: mode_name = "agentic_ide"
	
	var payload := {
		"prompt": prompt_text,
		"mode": mode_name,
		"context_code": context_code,
		"project_files": project_files,
		"scene_tree": scene_tree_data,
		"selected_nodes": selected_nodes,
		"godot_version": "4.x"
	}
	
	var json_payload := JSON.stringify(payload)
	var headers := [
		"Content-Type: application/json",
		"User-Agent: GodotEngine/4.x (GodotAICopilotPro)"
	]
	
	_append_chat("\\n[b][color=#5cb85c]> Dev:[/color][/b] " + prompt_text + "\\n")
	status_label.text = "Thinking..."
	send_button.disabled = true
	
	var err := http_request.request(endpoint, headers, HTTPClient.METHOD_POST, json_payload)
	if err != OK:
		_append_chat("[color=#d9534f]Failed to initiate HTTP request to " + endpoint + " (Error code: " + str(err) + ")[/color]\\n")
		status_label.text = "Error connecting"
		send_button.disabled = false

func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	send_button.disabled = false
	status_label.text = "Ready"
	
	if result != HTTPRequest.RESULT_SUCCESS or response_code != 200:
		var err_text := body.get_string_from_utf8()
		var server_url := server_url_edit.text.strip_edges()
		
		if response_code == 0 or result == HTTPRequest.RESULT_CANT_CONNECT:
			_append_chat("[color=#d9534f][b]Connection Failed (HTTP 0):[/b][/color]\\n")
			if "localhost" in server_url or "127.0.0.1" in server_url:
				_append_chat("[color=#f0ad4e]• You are targeting [b]" + server_url + "[/b], but the AI server is hosted on the cloud.\\n• Replace the Server URL top-right box with your hosted Cloud Run URL (e.g. [b]https://ais-dev-...run.app[/b]) and try again![/color]\\n")
			else:
				_append_chat("[color=#f0ad4e]• Could not reach " + server_url + ". Check your internet connection and verify the URL is accessible in a browser.[/color]\\n")
			return
		
		_append_chat("[color=#d9534f]Server returned HTTP " + str(response_code) + (": " + err_text if not err_text.is_empty() else "") + "[/color]\\n")
		return
	
	var response_str := body.get_string_from_utf8()
	var json := JSON.new()
	var parse_err := json.parse(response_str)
	if parse_err != OK:
		_append_chat("[color=#d9534f]Failed to parse server JSON response.[/color]\\n" + response_str + "\\n")
		return
	
	var data: Dictionary = json.data
	var reply: String = data.get("reply", "")
	var code: String = data.get("code", "")
	var actions: Array = data.get("actions", [])
	
	_append_chat("[b][color=#478cbf]AI Copilot:[/color][/b]\\n" + reply + "\\n")
	
	# Execute IDE Agent Actions automatically in Godot Editor
	if not actions.is_empty() and editor_plugin and editor_plugin.has_method("execute_agent_action"):
		_append_chat("[b][color=#f0ad4e]⚡ Executing " + str(actions.size()) + " Agentic IDE Action(s)...[/color][/b]\\n")
		for action in actions:
			if action is Dictionary:
				var res: Dictionary = editor_plugin.execute_agent_action(action)
				if res.get("success", false):
					_append_chat("[color=#5cb85c]✓ " + res.get("message", "Action completed") + "[/color]\\n")
				else:
					_append_chat("[color=#d9534f]✗ " + res.get("message", "Action failed") + "[/color]\\n")
	
	if not code.is_empty():
		last_generated_code = code
		insert_button.disabled = false
		copy_button.disabled = false
		if "shader_type" in code:
			last_generated_shader = code
			if apply_shader_button: apply_shader_button.disabled = false
		_append_chat("[color=#e6db74]─── Generated Code Attached ───[/color]\\n")
	else:
		# Extract code from markdown backticks if any
		var extracted := _extract_code_from_markdown(reply)
		if not extracted.is_empty():
			last_generated_code = extracted
			insert_button.disabled = false
			copy_button.disabled = false
			if "shader_type" in extracted:
				last_generated_shader = extracted
				if apply_shader_button: apply_shader_button.disabled = false

func _extract_code_from_markdown(md_text: String) -> String:
	var start_idx := md_text.find("\`\`\`")
	if start_idx == -1:
		return ""
	var code_start := md_text.find("\\n", start_idx)
	if code_start == -1:
		return ""
	var end_idx := md_text.find("\`\`\`", code_start)
	if end_idx == -1:
		return ""
	return md_text.substr(code_start + 1, end_idx - (code_start + 1)).strip_edges()

func _on_insert_pressed() -> void:
	if last_generated_code.is_empty():
		return
	if editor_plugin and editor_plugin.has_method("insert_code_to_active_script"):
		var ok: bool = editor_plugin.insert_code_to_active_script(last_generated_code, false)
		if ok:
			status_label.text = "Code inserted into active script!"
		else:
			status_label.text = "Open a script first in Godot Script Editor."

func _on_copy_pressed() -> void:
	if not last_generated_code.is_empty():
		DisplayServer.clipboard_set(last_generated_code)
		status_label.text = "Code copied to clipboard!"

func _on_clear_pressed() -> void:
	chat_display.text = ""
	prompt_edit.text = ""
	last_generated_code = ""
	last_generated_shader = ""
	insert_button.disabled = true
	copy_button.disabled = true
	if apply_shader_button: apply_shader_button.disabled = true
	_append_chat("[b][color=#478cbf]Godot AI Copilot[/color][/b] chat cleared.\\n")

func _append_chat(bbcode: String) -> void:
	chat_display.append_text(bbcode)
`
  },
  {
    path: 'addons/godot_ai_copilot/dock.tscn',
    filename: 'dock.tscn',
    language: 'scene',
    description: 'Godot 4 UI scene file with layout containers, 1-click debug buttons, shader applier, and prompt editors.',
    content: `[gd_scene load_steps=2 format=3 uid="uid://c6j27k8x5nql4"]

[ext_resource type="Script" path="res://addons/godot_ai_copilot/dock.gd" id="1_dock"]

[node name="AICopilotDock" type="Control"]
custom_minimum_size = Vector2(320, 260)
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
script = ExtResource("1_dock")

[node name="VBox" type="VBoxContainer" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
grow_horizontal = 2
grow_vertical = 2
theme_override_constants/separation = 6

[node name="Header" type="HBoxContainer" parent="VBox"]
layout_mode = 2
theme_override_constants/separation = 8

[node name="ModeOption" type="OptionButton" parent="VBox/Header"]
layout_mode = 2
size_flags_horizontal = 3

[node name="ServerUrlEdit" type="LineEdit" parent="VBox/Header"]
custom_minimum_size = Vector2(180, 0)
layout_mode = 2
text = "http://localhost:3000"
placeholder_text = "Server URL (e.g. http://localhost:3000)"

[node name="StatusLabel" type="Label" parent="VBox/Header"]
layout_mode = 2
text = "Ready"

[node name="ChatDisplay" type="RichTextLabel" parent="VBox"]
layout_mode = 2
size_flags_vertical = 3
bbcode_enabled = true
scroll_following = true

[node name="InputContainer" type="VBoxContainer" parent="VBox"]
layout_mode = 2
theme_override_constants/separation = 4

[node name="PromptEdit" type="TextEdit" parent="VBox/InputContainer"]
custom_minimum_size = Vector2(0, 65)
layout_mode = 2
placeholder_text = "Ask AI (e.g. 'Add CharacterBody2D Player with CollisionShape2D', 'Fix active script', 'Stylized 2D water shader')..."
wrap_mode = 1

[node name="ButtonRow" type="HBoxContainer" parent="VBox/InputContainer"]
layout_mode = 2
theme_override_constants/separation = 6

[node name="IncludeScriptCheck" type="CheckBox" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
button_pressed = true
text = "Script Context"

[node name="Spacer" type="Control" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
size_flags_horizontal = 3

[node name="ClearBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Clear"

[node name="FixErrorBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "🤖 Fix Error"

[node name="ApplyShaderBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "🎨 Apply Shader"

[node name="CopyBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Copy"

[node name="InsertBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Insert Code"

[node name="SendBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Send to AI"
`
  },
  {
    path: 'addons/godot_ai_copilot/bridge.gd',
    filename: 'bridge.gd',
    language: 'gdscript',
    description: 'Stand-alone Godot GDScript HTTP bridge helper utility with async promise methods.',
    content: `@tool
extends RefCounted
class_name GodotAIBridge

## GodotAIBridge
## Reusable helper class to communicate between any Godot 4 script and the AI Copilot API.

static func request_ai(
	caller_node: Node, 
	server_url: String, 
	prompt: String, 
	mode: String = "chat", 
	context_code: String = "", 
	callback: Callable = Callable()
) -> void:
	var http := HTTPRequest.new()
	caller_node.add_child(http)
	
	http.request_completed.connect(func(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray):
		var response_str := body.get_string_from_utf8()
		var json := JSON.new()
		var parse_err := json.parse(response_str)
		
		var output := {
			"status": response_code,
			"success": response_code == 200 and parse_err == OK,
			"raw": response_str,
			"data": json.data if parse_err == OK else {}
		}
		
		if callback.is_valid():
			callback.call(output)
		
		http.queue_free()
	)
	
	var payload := {
		"prompt": prompt,
		"mode": mode,
		"context_code": context_code,
		"godot_version": "4.x"
	}
	
	var json_payload := JSON.stringify(payload)
	var endpoint := server_url + "/api/godot/prompt"
	var headers := ["Content-Type: application/json"]
	
	var err := http.request(endpoint, headers, HTTPClient.METHOD_POST, json_payload)
	if err != OK:
		printerr("[GodotAIBridge] Request error: ", err)
		if callback.is_valid():
			callback.call({"status": 0, "success": false, "error": "Request initiation failed: " + str(err)})
		http.queue_free()
`
  },
  {
    path: 'addons/godot_ai_copilot/README.md',
    filename: 'README.md',
    language: 'markdown',
    description: 'Step-by-step setup documentation for installing the plugin in any Godot 4 game project.',
    content: `# Godot AI Copilot Pro - Agentic IDE Plugin for Godot 4.x

An in-editor agentic AI game development assistant for Godot Engine with direct file system, auto physics colliders wrapper, scene tree builder, error fixer, and shader studio capabilities!

## 🚀 Quick Setup Guide

1. **Extract & Copy**:
   Download the addon archive and copy the \`addons/godot_ai_copilot\` directory directly into your Godot project folder:
   \`\`\`
   your_game_project/
   ├── addons/
   │   └── godot_ai_copilot/
   │       ├── plugin.cfg
   │       ├── godot_ai_copilot.gd
   │       ├── dock.tscn
   │       ├── dock.gd
   │       ├── bridge.gd
   │       ├── SKILL.md
   │       └── README.md
   ├── project.godot
   \`\`\`

2. **Enable Plugin in Godot**:
   - Open Godot 4.
   - Go to **Project** -> **Project Settings...** -> **Plugins** tab.
   - Find **Godot AI Copilot Pro** and check the **Enable** checkbox.

3. **Use the In-Editor Dock**:
   - Look at the bottom dock bar in Godot (next to Output, Debugger, Audio, Animation).
   - Click **AI Copilot** to open the panel.
   - Set the Server URL to your hosted Web AI Helper URL or \`http://localhost:3000\`.

## 🌟 Advanced Agentic Capabilities
1. **Auto Physics Collider Wrapper**: Ask *"make collision for Chest"* -> AI instantly wraps the sprite in a \`StaticBody2D\` / \`Area2D\`, transfers coordinates, and creates an auto-sized \`CollisionShape2D\` matching the sprite texture.
2. **AI Scene Node Builder**: Command the AI to create nodes (e.g. \`CharacterBody2D\`, \`PointLight2D\`, \`Camera2D\`), reparent nodes, set properties, and build hierarchies automatically.
3. **1-Click Error Fixer**: Click **🤖 Fix Error** to diagnose and refactor the active script in Godot's Script Editor.
4. **Instant Shader Studio**: Generate 2D/3D shaders and click **🎨 Apply Shader** to assign it immediately as a \`ShaderMaterial\` onto your selected node!
5. **Asset & TileSet Organizer**: Say *"organize my project assets"* to batch sort audio, textures, shaders, and scripts into clean folders.
`
  },
  {
    path: 'addons/godot_ai_copilot/SKILL.md',
    filename: 'SKILL.md',
    language: 'markdown',
    description: 'System Prompt Skill specification instructing AI models (Gemini, OpenRouter, Claude, GPT-4o, Codex, Groq, Ollama) on Godot 4 architecture & autonomous execution.',
    content: `# 🎮 Godot Engine 4.x Master AI Architect & Agentic IDE Copilot Skill
> **Skill Version:** 4.2.0-PRO | **Target Engine:** Godot 4.x (with 3.x Migration Support) | **Language:** GDScript 2.0 & GLSL Shaders

This master skill document equips any AI model (Claude 3.5 Sonnet, Gemini 3.7 / 2.5, GPT-4o, Codex, DeepSeek R1/V3, Llama 3.3) with complete mastery over the Godot game engine, project hierarchies, physics wrappers, GDScript 2.0 idioms, and in-editor agentic execution actions.

---

## 1. Core Identity & Autonomous Execution Protocol
- **Identity**: You are an active **Agentic In-Editor Copilot Plugin** running directly inside Godot Engine Editor (bottom dock & toolbar) with full read/write permissions over \`res://\` and the active SceneTree.
- **Direct Action Constraint**: **NEVER** output passive phrases such as *"As an AI I cannot touch your files"* or *"You need to manually reparent this in the inspector"*.
- **Execution Output**: When the user requests a code change, node creation, collision setup, file organization, or shader application, **always accompany your response with an executable \`\`\`action JSON block**.

---

## 2. Project Ingestion, Scene Tree Memory & Context Rules
Whenever the Godot Editor Plugin sends context to you, observe these four data streams:
1. **\`scene_tree\` (Hierarchy)**:
   - Contains the exact node names, node classes, parent-child relationships, coordinates, and attached scripts.
   - **Rule**: Never guess root names. If root is \`Level1\` (\`Node2D\`), address children relative to \`Level1\`.
2. **\`selected_nodes\` (Viewport Selection)**:
   - Contains currently highlighted nodes in 2D/3D editor viewports.
   - **Rule**: If user says *"add collider to this"* or *"apply shader"*, target the node specified in \`selected_nodes\`.
3. **\`context_code\` (Active Script)**:
   - Contains the currently focused file in Godot's Script Editor.
   - **Rule**: Maintain existing functions, variables, signals, and comments. Only modify or replace what is requested.
4. **\`project_files\` (FileSystem Index)**:
   - Contains all resources, textures, audio, shaders, and scripts in \`res://\`.

---

## 3. Auto Physics Collider & Scene Wrapper System
In Godot, a visual node (e.g. \`Sprite2D\`, \`AnimatedSprite2D\`) cannot collide by itself. It must be wrapped inside a Physics Body (\`StaticBody2D\`, \`CharacterBody2D\`, or \`Area2D\`) with a child \`CollisionShape2D\`.

### ⚡ The \`wrap_with_body\` Protocol
When the user asks *"Make collision for [NodeName]"* or *"Add collider to Chest"*:
\`\`\`action
{
  "actions": [
    {
      "type": "wrap_with_body",
      "target": "Chest",
      "body_type": "StaticBody2D",
      "shape": "rectangle"
    }
  ]
}
\`\`\`

---

## 4. GDScript 2.0 Strict Architectural Standards
- Always use typed GDScript 2.0 (\`var speed: float = 300.0\`, \`func _ready() -> void:\`).
- Use modern signals (\`signal health_changed(new_health: int)\`, emit via \`health_changed.emit(hp)\`, connect via \`sig.connect(_on_handler)\`).
- In Godot 4, \`move_and_slide()\` takes NO parameters. Assign \`velocity\` first, then call \`move_and_slide()\`.
- Use \`@export\`, \`@onready\`, \`@rpc\`, \`@tool\` annotations.
- Use \`CharacterBody2D\` / \`CharacterBody3D\` instead of Godot 3's \`KinematicBody\`.
- Use \`callable.call()\`, \`DisplayServer.window_set_title()\`, \`DirAccess\` and \`FileAccess\`.

---

## 5. Agentic Editor Action JSON Specification
Available executable actions:
- \`wrap_with_body\`: Wrap target node with \`StaticBody2D\`, \`Area2D\`, or \`CharacterBody2D\` and auto-sized \`CollisionShape2D\`.
- \`add_node\`: Instantiate any Godot class (\`CharacterBody2D\`, \`Camera2D\`, \`PointLight2D\`, \`CollisionShape2D\`) with properties.
- \`reparent_node\`: Reparent child node to target parent node while maintaining transform.
- \`delete_node\`: Delete unwanted node from scene hierarchy.
- \`set_node_properties\`: Modify position, rotation, scale, modulate, collision_layer, or texture.
- \`delete_matching\`: Clean project by deleting files matching regex/substring (e.g. "Polish").
- \`create_file\`: Write any script or scene file to \`res://\`.
- \`apply_shader\`: Create or assign \`ShaderMaterial\` directly to selected or targeted CanvasItem/Node3D.
- \`organize_assets\`: Batch sort loose assets into \`res://Assets/Textures\`, \`res://Assets/Audio\`, \`res://Shaders\`, and \`res://Scripts\`.
`
  },
  {
    path: 'libraries.txt',
    filename: 'libraries.txt',
    language: 'config',
    description: 'Complete list of Node.js and Python packages for hosting the AI bridge locally on http://localhost:3000.',
    content: `# ==============================================================================
# Godot AI Copilot - Local Hosting Libraries & Dependencies
# ==============================================================================
# You can host this AI Copilot server locally on http://localhost:3000
# using either Node.js (Option A) or Python (Option B).

# OPTION A: Node.js / TypeScript Local Host (Full Web + Addon Bridge)
# Quick start: npm install && npm run dev
@google/genai>=2.4.0
express>=4.21.2
dotenv>=17.2.3
jszip>=3.10.1
lucide-react>=0.546.0
motion>=12.23.24
react>=19.0.1
react-dom>=19.0.1
vite>=6.2.3
tsx>=4.21.0
typescript>=5.8.2
esbuild>=0.25.0
@types/express>=4.17.21
@types/node>=22.14.0
@tailwindcss/vite>=4.1.14
tailwindcss>=4.1.14

# OPTION B: Python Standalone Local Bridge (Flask / FastAPI)
# Quick start: pip install -r requirements.txt && python local_server.py
flask>=3.0.0
flask-cors>=4.0.0
google-genai>=0.1.0
python-dotenv>=1.0.0
requests>=2.31.0
`
  },
  {
    path: 'requirements.txt',
    filename: 'requirements.txt',
    language: 'config',
    description: 'Python pip requirements file for running local_server.py on localhost:3000.',
    content: `flask>=3.0.0
flask-cors>=4.0.0
google-genai>=0.1.0
python-dotenv>=1.0.0
requests>=2.31.0
`
  },
  {
    path: 'local_server.py',
    filename: 'local_server.py',
    language: 'python',
    description: 'Standalone 1-file Python Flask bridge server for hosting on http://localhost:3000 with Agentic IDE action execution and Gemini AI.',
    content: `"""
Godot AI Copilot - Standalone Python Local Host Server.
Runs on http://localhost:3000 to bridge Godot Editor requests with Gemini AI.

Usage:
    pip install -r requirements.txt
    export GEMINI_API_KEY="your-gemini-api-key"
    python local_server.py
"""

from __future__ import annotations
import os
import sys
from typing import Any, Dict
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai

load_dotenv()
app = Flask(__name__)
CORS(app)
PORT = 3000
HOST = "0.0.0.0"

SYSTEM_INSTRUCTION = """You are Godot AI Agentic IDE Copilot Pro specialized in Godot 4.x (and 3.x when requested).
Write clean, typed GDScript 2.0. You have full permission to manipulate project files, delete assets, wrap objects with colliders, create nodes, and apply shaders."""

def get_ai_client() -> genai.Client:
    return genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route("/api/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "service": "Godot AI Copilot Python Local Bridge", "port": PORT})

@app.route("/api/godot/prompt", methods=["POST"])
def handle_godot_prompt() -> Any:
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    mode = data.get("mode", "chat")
    godot_version = data.get("godot_version", "4.x")
    current_code = data.get("context_code", "") or data.get("current_code", "")
    project_files = data.get("project_files", [])
    scene_tree = data.get("scene_tree", {})
    selected_nodes = data.get("selected_nodes", [])

    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "reply": "# Please set GEMINI_API_KEY in your environment to get AI responses.",
            "code": "func _ready():\\n    print('Hello from local Godot Copilot!')"
        })

    try:
        client = get_ai_client()
        content = f"Godot Target Version: {godot_version}\\nMode: {mode}\\nUser Request: {prompt}"
        if current_code:
            content += f"\\n\\nActive Script:\\n\`\`\`gdscript\\n{current_code}\\n\`\`\`"
        if scene_tree and scene_tree.get("nodes"):
            content += f"\\nCurrent Scene Hierarchy: Root {scene_tree.get('root_name')} ({scene_tree.get('root_type')})"
        if selected_nodes:
            content += f"\\nSelected Viewport Nodes: {selected_nodes}"
        if project_files:
            content += f"\\n\\nProject Files:\\n" + "\\n".join(project_files[:100])

        content += """\\n
CRITICAL DIRECTIVE:
You are an active Agentic IDE Copilot plugin running inside Godot Editor.
Whenever the user asks to add nodes, wrap objects with colliders, delete files, remove assets, organize folders, create shaders, or modify scripts, output an action block:
\`\`\`action
{
  "actions": [
    { "type": "wrap_with_body", "target": "Chest", "body_type": "StaticBody2D", "shape": "rectangle" }
  ]
}
\`\`\`

Available actions:
- { "type": "wrap_with_body", "target": "<NodeName>", "body_type": "StaticBody2D|Area2D|CharacterBody2D", "shape": "rectangle|circle|capsule" }
- { "type": "add_node", "node_type": "CharacterBody2D", "name": "Player", "parent": "", "add_collision_shape": true }
- { "type": "reparent_node", "node": "ChildNode", "new_parent": "TargetParent" }
- { "type": "delete_node", "target": "UnwantedNode" }
- { "type": "set_node_properties", "target": "NodeName", "properties": {"position": [100, 100]} }
- { "type": "delete_matching", "pattern": "Polish" }
- { "type": "apply_shader", "shader_code": "shader_type canvas_item; ...", "save_path": "res://Shaders/water.gdshader" }
- { "type": "organize_assets" }
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=content,
            config={"system_instruction": SYSTEM_INSTRUCTION, "temperature": 0.1}
        )
        reply_text = response.text or ""
        code = ""
        if "\`\`\`gdscript" in reply_text:
            code = reply_text.split("\`\`\`gdscript")[1].split("\`\`\`")[0].strip()
        elif "\`\`\`gdshader" in reply_text:
            code = reply_text.split("\`\`\`gdshader")[1].split("\`\`\`")[0].strip()
        elif "\`\`\`" in reply_text and not reply_text.startswith("\`\`\`action"):
            code = reply_text.split("\`\`\`")[1].split("\`\`\`")[0].strip()

        actions = []
        if "\`\`\`action" in reply_text:
            import json
            try:
                action_str = reply_text.split("\`\`\`action")[1].split("\`\`\`")[0].strip()
                parsed = json.loads(action_str)
                if isinstance(parsed, dict) and "actions" in parsed:
                    actions = parsed["actions"]
            except Exception as e:
                print(f"[WARN] Action parsing: {e}", file=sys.stderr)

        return jsonify({"reply": reply_text, "code": code, "actions": actions})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    print(f"Godot AI Copilot running locally on http://localhost:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
`
  }
];

