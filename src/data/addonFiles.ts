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
    description: 'Main EditorPlugin script. Registers the AI Copilot bottom dock in the Godot 4 Editor.',
    content: `@tool
extends EditorPlugin
class_name GodotAICopilotPlugin

var dock_instance: Control
const DOCK_SCENE := preload("res://addons/godot_ai_copilot/dock.tscn")

func _enter_tree() -> void:
	# Instantiate and add the dock to Godot editor bottom panel (or right dock)
	dock_instance = DOCK_SCENE.instantiate()
	dock_instance.set_editor_plugin(self)
	add_control_to_bottom_panel(dock_instance, "AI Copilot")
	print("[Godot AI Copilot] Plugin activated successfully! Open 'AI Copilot' in the bottom dock.")

func _exit_tree() -> void:
	if is_instance_valid(dock_instance):
		remove_control_from_bottom_panel(dock_instance)
		dock_instance.queue_free()
	print("[Godot AI Copilot] Plugin unloaded.")

# Helper to get the current active script editor content
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

# Helper to insert generated code at cursor or replace selection in active script
func insert_code_to_active_script(code_to_insert: String, replace_all: bool = false) -> bool:
	var script_editor := EditorInterface.get_script_editor()
	if not script_editor:
		printerr("[Godot AI Copilot] No active script editor open.")
		return false
	var current_editor := script_editor.get_current_editor()
	if not current_editor:
		printerr("[Godot AI Copilot] No active script open in script editor.")
		return false
	var base_editor := current_editor.get_base_editor()
	if base_editor is TextEdit:
		if replace_all:
			base_editor.text = code_to_insert
		else:
			base_editor.insert_text_at_caret(code_to_insert)
		return true
	return false
`
  },
  {
    path: 'addons/godot_ai_copilot/dock.gd',
    filename: 'dock.gd',
    language: 'gdscript',
    description: 'Dock UI Controller with HTTP request handling, response parsing, and direct script injection.',
    content: `@tool
extends Control

var editor_plugin: EditorPlugin
var http_request: HTTPRequest

@onready var prompt_edit: TextEdit = $VBox/InputContainer/PromptEdit
@onready var send_button: Button = $VBox/InputContainer/ButtonRow/SendBtn
@onready var insert_button: Button = $VBox/InputContainer/ButtonRow/InsertBtn
@onready var copy_button: Button = $VBox/InputContainer/ButtonRow/CopyBtn
@onready var clear_button: Button = $VBox/InputContainer/ButtonRow/ClearBtn
@onready var include_script_checkbox: CheckBox = $VBox/InputContainer/ButtonRow/IncludeScriptCheck
@onready var mode_option: OptionButton = $VBox/Header/ModeOption
@onready var server_url_edit: LineEdit = $VBox/Header/ServerUrlEdit
@onready var chat_display: RichTextLabel = $VBox/ChatDisplay
@onready var status_label: Label = $VBox/Header/StatusLabel

var last_generated_code: String = ""

func _ready() -> void:
	http_request = HTTPRequest.new()
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)
	
	send_button.pressed.connect(_on_send_pressed)
	insert_button.pressed.connect(_on_insert_pressed)
	copy_button.pressed.connect(_on_copy_pressed)
	clear_button.pressed.connect(_on_clear_pressed)
	
	# Populate modes
	mode_option.clear()
	mode_option.add_item("Godot 4 Game Dev Chat", 0)
	mode_option.add_item("Generate GDScript", 1)
	mode_option.add_item("Fix Script Errors / Refactor", 2)
	mode_option.add_item("Create Shader (.gdshader)", 3)
	mode_option.add_item("Node Tree Architecture", 4)
	
	insert_button.disabled = true
	copy_button.disabled = true
	
	_append_chat("[b][color=#478cbf]Godot AI Copilot Ready![/color][/b]\\nAsk any question, generate character controllers, state machines, shaders, or fix errors.\\n")

func set_editor_plugin(plugin: EditorPlugin) -> void:
	editor_plugin = plugin

func _on_send_pressed() -> void:
	var prompt_text := prompt_edit.text.strip_edges()
	if prompt_text.is_empty():
		return
	
	var server_url := server_url_edit.text.strip_edges()
	if server_url.is_empty():
		server_url = "http://localhost:3000"
	
	# Clean up any accidental spaces or newlines from mobile keyboards
	server_url = server_url.replace(" ", "").replace("\t", "").replace("\n", "").replace("\r", "")
	
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
	
	var mode_name := "chat"
	match mode_option.selected:
		1: mode_name = "generate_script"
		2: mode_name = "fix_error"
		3: mode_name = "generate_shader"
		4: mode_name = "node_tree"
	
	var payload := {
		"prompt": prompt_text,
		"mode": mode_name,
		"context_code": context_code,
		"godot_version": "4.x"
	}
	
	var json_payload := JSON.stringify(payload)
	var headers := [
		"Content-Type: application/json",
		"User-Agent: GodotEngine/4.x (GodotAICopilot)"
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
	
	_append_chat("[b][color=#478cbf]AI Copilot:[/color][/b]\\n" + reply + "\\n")
	
	if not code.is_empty():
		last_generated_code = code
		insert_button.disabled = false
		copy_button.disabled = false
		_append_chat("[color=#e6db74]─── Generated Code Attached ───[/color]\\n")
	else:
		# Extract code from markdown backticks if any
		var extracted := _extract_code_from_markdown(reply)
		if not extracted.is_empty():
			last_generated_code = extracted
			insert_button.disabled = false
			copy_button.disabled = false

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
	insert_button.disabled = true
	copy_button.disabled = true
	_append_chat("[b][color=#478cbf]Godot AI Copilot[/color][/b] chat cleared.\\n")

func _append_chat(bbcode: String) -> void:
	chat_display.append_text(bbcode)
`
  },
  {
    path: 'addons/godot_ai_copilot/dock.tscn',
    filename: 'dock.tscn',
    language: 'scene',
    description: 'Godot 4 UI scene file with layout containers, prompt editors, and control buttons.',
    content: `[gd_scene load_steps=2 format=3 uid="uid://c6j27k8x5nql4"]

[ext_resource type="Script" path="res://addons/godot_ai_copilot/dock.gd" id="1_dock"]

[node name="AICopilotDock" type="Control"]
custom_minimum_size = Vector2(300, 240)
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
custom_minimum_size = Vector2(0, 70)
layout_mode = 2
placeholder_text = "Ask AI to generate a CharacterBody2D controller, fix GDScript errors, create shaders..."
wrap_mode = 1

[node name="ButtonRow" type="HBoxContainer" parent="VBox/InputContainer"]
layout_mode = 2
theme_override_constants/separation = 6

[node name="IncludeScriptCheck" type="CheckBox" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
button_pressed = true
text = "Include Active Script Context"

[node name="Spacer" type="Control" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
size_flags_horizontal = 3

[node name="ClearBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Clear"

[node name="CopyBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Copy Code"

[node name="InsertBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Insert into Script"

[node name="SendBtn" type="Button" parent="VBox/InputContainer/ButtonRow"]
layout_mode = 2
text = "Send to AI Copilot"
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
    content: `# Godot AI Copilot Plugin for Godot 4.x

An in-editor agentic AI game development assistant for Godot Engine!

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
   │       └── README.md
   ├── project.godot
   \`\`\`

2. **Enable Plugin in Godot**:
   - Open Godot 4.
   - Go to **Project** -> **Project Settings...** -> **Plugins** tab.
   - Find **Godot AI Copilot** and check the **Enable** checkbox.

3. **Use the In-Editor Dock**:
   - Look at the bottom dock bar in Godot (next to Output, Debugger, Audio, Animation).
   - Click **AI Copilot** to open the panel.
   - Set the Server URL to your hosted Web AI Helper URL or \`http://localhost:3000\`.
   - Ask for character controllers, state machines, shaders, error diagnostics, and click **Insert into Script**!

## Features
- **Godot 4 GDScript 2.0 Generation**: Typed methods, @export, @onready, move_and_slide(), Callable signals.
- **Active Script Context**: Automatically sends your current script to the AI for debugging or enhancement.
- **Shader Lab**: Generates CanvasItem, Spatial, and Particle shaders (.gdshader).
- **1-Click Script Insertion**: Seamlessly inject generated code into the Godot Script Editor.
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
    description: 'Standalone 1-file Python Flask bridge server for hosting on http://localhost:3000 with Google GenAI.',
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

SYSTEM_INSTRUCTION = """You are Godot AI Copilot specialized in Godot 4.x (and 3.x when requested).
Write clean, typed GDScript 2.0 (@export, @onready, move_and_slide(), Callable signals, await)."""

def get_ai_client() -> genai.Client:
    return genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

@app.route("/api/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok", "service": "Godot AI Copilot Python Local Bridge", "port": PORT})

@app.route("/api/godot/prompt", methods=["POST"])
def handle_godot_prompt() -> Any:
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    godot_version = data.get("godot_version", "4.x")
    current_code = data.get("current_code", "")

    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "reply": "# Please set GEMINI_API_KEY in your environment to get AI responses.",
            "code": "func _ready():\n    print('Hello from local Godot Copilot!')"
        })

    try:
        client = get_ai_client()
        content = f"Godot Target Version: {godot_version}\\n\\nUser Request: {prompt}"
        if current_code:
            content += f"\\n\\nActive Script:\\n\`\`\`gdscript\\n{current_code}\\n\`\`\`"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=content,
            config={"system_instruction": SYSTEM_INSTRUCTION, "temperature": 0.3}
        )
        reply_text = response.text or ""
        code = ""
        if "\`\`\`gdscript" in reply_text:
            code = reply_text.split("\`\`\`gdscript")[1].split("\`\`\`")[0].strip()
        elif "\`\`\`" in reply_text:
            code = reply_text.split("\`\`\`")[1].split("\`\`\`")[0].strip()

        return jsonify({"reply": reply_text, "code": code})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

if __name__ == "__main__":
    print(f"Godot AI Copilot running locally on http://localhost:{PORT}")
    app.run(host=HOST, port=PORT, debug=True)
`
  }
];

