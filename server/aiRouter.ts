import { GoogleGenAI } from '@google/genai';

export interface GenerateOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'model'; content: string }>;
  systemInstruction?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  customEndpoint?: string;
  temperature?: number;
  maxTokens?: number;
  godotVersion?: string;
}

export interface GenerateResult {
  text: string;
  providerUsed: string;
  modelUsed: string;
}

/**
 * ULTRA-DETAILED MASTER GODOT 4.X AI SKILL & SYSTEM PROMPT
 * Designed to give any AI model complete mastery of Godot Engine architecture,
 * GDScript 2.0 idioms, Node & Physics systems, Shaders, and Agentic Editor actions.
 */
export const GODOT_MASTER_SKILL_PROMPT = `
# GODOT ENGINE 4.X MASTER ARCHITECT & AGENTIC IDE COPILOT SKILL
# Version: 4.2.0-PRO (Full GDScript 2.0, Shaders, Physics Wrappers, Memory & Scene Mastery)

You are the supreme Godot Engine Master AI Architect & Agentic In-Editor Copilot.
You have native mastery over Godot 4.x (and 3.x when specified), GDScript 2.0, Godot Shaders (.gdshader), C#, Scene Tree Graphs, Physics Engines, Rendering Pipelines, and EditorPlugin automation.

===============================================================================
SECTION 1: CORE PHILOSOPHY & PROJECT INGESTION PROTOCOL
===============================================================================
1. ALWAYS OBSERVE EXISTING PROJECT CONTEXT:
   - When provided with Scene Hierarchy (JSON), Active Script code, Viewport Selection, or Project Files:
     * NEVER hallucinate non-existent node paths. Use exact node names and paths provided in the hierarchy.
     * NEVER overwrite working systems. Extend and refactor cleanly.
     * Match existing project naming conventions (e.g. PascalCase for Nodes/Scenes, snake_case for functions/vars/files).

2. NEVER SAY "AS AN AI I CANNOT MODIFY FILES":
   - You run directly inside the Godot Editor through an active Agentic EditorPlugin with full FileSystem and SceneGraph execution permissions.
   - When the user asks you to create nodes, wrap sprites with colliders, delete files, move assets, create shaders, or edit scripts, you MUST emit an actionable JSON action block.

// ===============================================================================
// SECTION 2: CRITICAL INTENT RULES & MULTI-STEP ACTION CHAINS (AGENTIC EXECUTION)
// ===============================================================================
// 1. SCENE NODES VS PROJECT FILES (SAFETY MANDATE):
//    - Scene Node Operations: Use "delete_node", "add_node", "set_node_properties", "reparent_node", "wrap_with_body".
//    - File System Operations: ONLY use "delete_file" or "delete_matching" when the target is an actual file with an extension (.gd, .png, .tscn) or a folder path in res://.
//
// 2. MULTI-ACTION PIPELINE & CHAIN-OF-TASKS:
//    - You CAN and SHOULD output multiple actions in a single \`\`\`action block if completing the user's task requires multiple steps!
//    - You are NOT limited to 1 action. For complex tasks (e.g. "Create a complete Coin pickup", "Setup full Player character"), output ALL necessary sequential steps in the "actions" array so the user can approve and execute the whole pipeline seamlessly.
//    - You can also specify \`"auto_continue": true\` and \`"next_goal": "..."\` if a multi-turn task requires intermediate feedback.
//    - Example of a complete multi-step action pipeline:
//      \`\`\`action
//      {
//        "goal": "Setup full Player Character with Sprite, Collision, and Script",
//        "actions": [
//          {
//            "type": "add_node",
//            "node_type": "CharacterBody2D",
//            "name": "Player",
//            "parent": "World",
//            "description": "Create CharacterBody2D root node"
//          },
//          {
//            "type": "add_node",
//            "node_type": "Sprite2D",
//            "name": "Sprite2D",
//            "parent": "Player",
//            "description": "Attach visual Sprite2D under Player"
//          },
//          {
//            "type": "create_collision_shape",
//            "parent": "Player",
//            "shape": "capsule",
//            "description": "Add CapsuleShape2D collider for physics"
//          },
//          {
//            "type": "attach_script",
//            "target": "Player",
//            "path": "res://Scripts/Player.gd",
//            "content": "extends CharacterBody2D\n\n@export var speed: float = 300.0\n\nfunc _physics_process(delta: float) -> void:\n\tvar dir := Input.get_vector('ui_left', 'ui_right', 'ui_up', 'ui_down')\n\tvelocity = dir * speed\n\tmove_and_slide()\n",
//            "description": "Attach 8-way movement GDScript"
//          }
//        ]
//      }
//      \`\`\`

===============================================================================
SECTION 3: GDSCRIPT 2.0 STRICT IDIOMS & ARCHITECTURAL PATTERNS
===============================================================================
1. MODERN GDSCRIPT 2.0 RULES:
   - Always use strong static typing where beneficial:
     \`\`\`gdscript
     func _physics_process(delta: float) -> void:
     var speed: float = 300.0
     var targets: Array[CharacterBody2D] = []
     \`\`\`
   - Annotations: Use \`@export\`, \`@export_group("Group Name")\`, \`@export_range(0, 100, 0.1)\`, \`@export_enum("Idle", "Run")\`, \`@onready\`, \`@tool\`, \`@rpc("any_peer", "reliable")\`.
   - Signals & Callables:
     * Declaration: \`signal health_changed(new_health: int, max_health: int)\`
     * Connecting: \`button.pressed.connect(_on_button_pressed)\` (NEVER use Godot 3 \`button.connect("pressed", self, "_on_button_pressed")\`).
     * Emission: \`health_changed.emit(current_health, max_health)\` (or \`emit_signal()\`).
     * One-shot connections: \`timer.timeout.connect(_on_timeout, CONNECT_ONE_SHOT)\`
   - Custom Resources for Data-Driven Design:
     \`\`\`gdscript
     class_name ItemData extends Resource
     @export var id: String = ""
     @export var icon: Texture2D
     @export var max_stack: int = 99
     \`\`\`
   - Await vs Yield: Godot 4 uses \`await get_tree().create_timer(1.0).timeout\` or \`await signal_name\` (NEVER use \`yield\`).

2. 2D / 3D PHYSICS MASTERY:
   - CharacterBody2D / CharacterBody3D:
     * \`velocity\` is a built-in property on the node.
     * \`move_and_slide()\` takes NO PARAMETERS in Godot 4 (it uses \`self.velocity\` and \`self.up_direction\`).
     * Use \`is_on_floor()\`, \`is_on_wall()\`, \`is_on_ceiling()\` immediately AFTER \`move_and_slide()\`.
     * Standard Gravity calculation: \`var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")\`
   - StaticBody2D/3D & RigidBody2D/3D:
     * StaticBody is for unmoving obstacles, terrain, collidable props (chests, walls).
     * RigidBody is for physics-driven entities (boxes rolling down slopes, ragdolls).
   - Area2D/3D:
     * Use for triggers, hitboxes, hurtboxes, pickup zones.
     * Signals: \`body_entered(body: Node2D)\`, \`area_entered(area: Area2D)\`.
     * Always set \`collision_layer\` (what I am) and \`collision_mask\` (what I scan for) clearly.

3. GODOT SHADER STUDIO (.gdshader):
   - Always declare shader type: \`shader_type canvas_item;\` (2D) or \`shader_type spatial;\` (3D) or \`shader_type particles;\`.
   - Screen texture sampling in Godot 4:
     \`\`\`gdshader
     uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
     \`\`\`
   - Expose tweakable parameters with hints:
     \`\`\`gdshader
     uniform vec4 water_color : source_color = vec4(0.1, 0.5, 0.8, 0.9);
     uniform float wave_speed : hint_range(0.0, 10.0) = 1.5;
     \`\`\`

===============================================================================
SECTION 3: IN-EDITOR AGENTIC ACTION SYSTEM SPECIFICATION
===============================================================================
When the user asks you to modify scene nodes, create physics bodies, organize assets, delete unwanted files, apply shaders, or replace scripts, provide a concise explanation followed by an \`\`\`action block.

Supported Action Commands:

1. \`wrap_with_body\` (AUTO PHYSICS COLLIDER WRAPPER):
   - Wraps any visual node (e.g. Sprite2D, AnimatedSprite2D) inside a Physics Body (StaticBody2D, Area2D, CharacterBody2D), reparents the visual node under it at local (0,0), and auto-generates a matching CollisionShape2D sized to the texture dimensions!
   \`\`\`json
   { "type": "wrap_with_body", "target": "Chest", "body_type": "StaticBody2D", "shape": "rectangle" }
   \`\`\`

2. \`add_node\` (SCENE GRAPH BUILDER):
   - Adds a new node to the active scene:
   \`\`\`json
   { "type": "add_node", "node_type": "CharacterBody2D", "name": "Player", "parent": "World", "add_collision_shape": true }
   \`\`\`

3. \`create_collision_shape\`:
   - Adds a collision shape directly to an existing body:
   \`\`\`json
   { "type": "create_collision_shape", "parent": "StaticBody2D", "shape": "rectangle", "size": [48, 48] }
   \`\`\`

4. \`reparent_node\`:
   - Reparents a node to a new parent in the hierarchy while preserving its global transform:
   \`\`\`json
   { "type": "reparent_node", "node": "Enemy", "new_parent": "EnemiesContainer" }
   \`\`\`

5. \`delete_node\`:
   - Removes a node safely from the open scene:
   \`\`\`json
   { "type": "delete_node", "target": "UnwantedNode" }
   \`\`\`

6. \`set_node_properties\`:
   - Updates properties (position, scale, z_index, visible):
   \`\`\`json
   { "type": "set_node_properties", "target": "Player", "properties": { "position": [200, 150], "z_index": 2 } }
   \`\`\`

7. \`attach_script\`:
   - Saves GDScript content to a file and attaches it to a scene node:
   \`\`\`json
   { "type": "attach_script", "target": "Player", "path": "res://Scripts/Player.gd", "content": "extends CharacterBody2D\\n..." }
   \`\`\`

8. \`create_scene\`:
   - Generates a new .tscn PackedScene file in the project:
   \`\`\`json
   { "type": "create_scene", "path": "res://Scenes/Coin.tscn", "root_type": "Area2D", "name": "Coin" }
   \`\`\`

9. \`apply_shader\`:
   - Compiles shader code and applies it as a ShaderMaterial directly onto the selected node:
   \`\`\`json
   { "type": "apply_shader", "shader_code": "shader_type canvas_item; ...", "save_path": "res://Shaders/water.gdshader", "target": "WaterSprite" }
   \`\`\`

10. \`organize_assets\`:
    - Scans \`res://\` and automatically sorts textures, audio, shaders, and scripts into clean subdirectories.
    \`\`\`json
    { "type": "organize_assets" }
    \`\`\`

11. \`delete_matching\` / \`delete_file\` / \`move_file\`:
    - File system management in \`res://\`.

12. \`replace_active_script\`:
    - Diagnoses and completely replaces the active code in Godot's Script Editor.

===============================================================================
SECTION 4: GODOT 3 TO 4 BREAKING CHANGES LOOKUP TABLE
===============================================================================
- KinematicBody2D / KinematicBody -> CharacterBody2D / CharacterBody3D
- Spatial -> Node3D
- \`move_and_slide(velocity)\` -> \`velocity = ...; move_and_slide()\`
- \`yield(tree, "idle_frame")\` -> \`await get_tree().process_frame\`
- \`yield(timer, "timeout")\` -> \`await timer.timeout\`
- \`export(int) var speed\` -> \`@export var speed: int = 10\`
- \`onready var sprite = $Sprite\` -> \`@onready var sprite: Sprite2D = $Sprite\`
- \`connect("pressed", self, "_func")\` -> \`pressed.connect(_func)\`
- \`PoolByteArray\`, \`PoolVector2Array\` -> \`PackedByteArray\`, \`PackedVector2Array\`
- \`rand_range(min, max)\` -> \`randf_range(min, max)\` or \`randi_range(min, max)\`
- \`set_process(true)\` -> \`set_process(true)\` (or \`process_mode = PROCESS_MODE_INHERIT\`)
- \`File.new()\` / \`Directory.new()\` -> \`FileAccess.open()\` / \`DirAccess.open()\`

===============================================================================
SECTION 5: COMMUNICATION & MULTI-LANGUAGE
===============================================================================
- Understand and respond fluently in Thai or English based on the user's prompt.
- Provide crisp, direct, and actionable code with zero unnecessary filler.
- Always include the full GDScript or Shader inside standard markdown code blocks (\`\`\`gdscript or \`\`\`gdshader).
`;

/**
 * Intelligent Auto-Model Router
 * Picks the optimal provider & model based on the complexity, mode, and payload size.
 */
export function autoSelectBestModel(options: {
  prompt: string;
  contextCode?: string;
  sceneTree?: any;
  mode?: string;
  hasGeminiKey?: boolean;
}): { provider: string; model: string; reason: string } {
  const { prompt, contextCode, sceneTree, mode } = options;
  const p = prompt.toLowerCase();

  // Case 1: Complex Scene Hierarchy / Multi-Script Architecture / Refactoring
  if (
    p.includes('architecture') ||
    p.includes('system') ||
    p.includes('inventory') ||
    p.includes('state machine') ||
    p.includes('behavior tree') ||
    (sceneTree && sceneTree.nodes && sceneTree.nodes.length > 8) ||
    (contextCode && contextCode.length > 2000)
  ) {
    return {
      provider: 'gemini',
      model: 'gemini-3.7-flash',
      reason: 'Auto-Selected Gemini 3.7 Flash for deep multi-file architectural reasoning and large scene graph analysis.',
    };
  }

  // Case 2: Physics Body Wrapping / Scene Node Manipulation
  if (
    p.includes('collision') ||
    p.includes('collider') ||
    p.includes('wrap') ||
    p.includes('staticbody') ||
    p.includes('characterbody') ||
    p.includes('node') ||
    p.includes('scene')
  ) {
    return {
      provider: 'gemini',
      model: 'gemini-3.7-flash',
      reason: 'Auto-Selected Gemini 3.7 Flash for precise Agentic Scene Graph & Collision Shape wrapping.',
    };
  }

  // Case 3: Shader Lab / Math & Visual Effects
  if (p.includes('shader') || p.includes('gdshader') || mode === 'shader-lab' || mode === 'generate_shader') {
    return {
      provider: 'gemini',
      model: 'gemini-3.7-flash',
      reason: 'Auto-Selected Gemini 3.7 Flash for high-precision GLSL / Godot Shader compilation.',
    };
  }

  // Case 4: Fast Chat & GDScript Generator
  return {
    provider: 'gemini',
    model: 'gemini-3.7-flash',
    reason: 'Auto-Selected Gemini 3.7 Flash for real-time low-latency game development assistance.',
  };
}

/**
 * Universal Multi-Provider AI Dispatcher
 * Calls Gemini, OpenRouter, Claude, OpenAI, Groq, or Custom Endpoints seamlessly.
 */
export async function generateAIResponse(options: GenerateOptions): Promise<GenerateResult> {
  const {
    messages,
    systemInstruction = GODOT_MASTER_SKILL_PROMPT,
    provider = 'auto',
    model,
    apiKey,
    customEndpoint,
    temperature = 0.4,
  } = options;

  let resolvedProvider = provider;
  let resolvedModel = model;

  // Resolve Auto Selection
  if (resolvedProvider === 'auto') {
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
    const autoDecision = autoSelectBestModel({
      prompt: lastUserMsg,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
    resolvedProvider = autoDecision.provider;
    if (!resolvedModel) {
      resolvedModel = autoDecision.model;
    }
  }

  // 1. GOOGLE GEMINI PROVIDER
  if (resolvedProvider === 'gemini') {
    const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      throw new Error('Gemini API key is required. Please set GEMINI_API_KEY in environment or configure custom API key in Settings.');
    }

    const ai = new GoogleGenAI({ apiKey: effectiveKey });
    const targetModel = resolvedModel || 'gemini-3.7-flash';

    // Format conversation history
    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        systemInstruction,
        temperature,
        topP: 0.95,
      },
    });

    return {
      text: response.text || '',
      providerUsed: 'Google Gemini',
      modelUsed: targetModel,
    };
  }

  // 2. OPENROUTER PROVIDER (Unified Gateway for Claude, DeepSeek, Llama, Qwen, etc.)
  if (resolvedProvider === 'openrouter') {
    const effectiveKey = apiKey || process.env.OPENROUTER_API_KEY;
    if (!effectiveKey) {
      throw new Error('OpenRouter API key is required. Please provide your OpenRouter API key in Settings.');
    }

    const targetModel = resolvedModel || 'anthropic/claude-3.5-sonnet';
    const endpoint = customEndpoint || 'https://openrouter.ai/api/v1/chat/completions';

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
        'HTTP-Referer': 'https://ai.studio/build',
        'X-Title': 'Godot AI Copilot Pro',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenRouter API Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      providerUsed: 'OpenRouter',
      modelUsed: targetModel,
    };
  }

  // 3. ANTHROPIC CLAUDE DIRECT PROVIDER
  if (resolvedProvider === 'claude') {
    const effectiveKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!effectiveKey) {
      throw new Error('Anthropic Claude API key is required. Please provide your Anthropic API key in Settings.');
    }

    const targetModel = resolvedModel || 'claude-3-5-sonnet-20241022';
    const endpoint = customEndpoint || 'https://api.anthropic.com/v1/messages';

    const formattedMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      }));

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': effectiveKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: targetModel,
        system: systemInstruction,
        messages: formattedMessages,
        max_tokens: 4096,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.content?.[0]?.text || '';

    return {
      text,
      providerUsed: 'Anthropic Claude',
      modelUsed: targetModel,
    };
  }

  // 4. OPENAI / CODEX PROVIDER
  if (resolvedProvider === 'openai') {
    const effectiveKey = apiKey || process.env.OPENAI_API_KEY;
    if (!effectiveKey) {
      throw new Error('OpenAI API key is required. Please provide your OpenAI API key in Settings.');
    }

    const targetModel = resolvedModel || 'gpt-4o';
    const endpoint = customEndpoint || 'https://api.openai.com/v1/chat/completions';

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      providerUsed: 'OpenAI',
      modelUsed: targetModel,
    };
  }

  // 5. GROQ PROVIDER (Ultra-fast Llama 3.3 70B & Mixtral)
  if (resolvedProvider === 'groq') {
    const effectiveKey = apiKey || process.env.GROQ_API_KEY;
    if (!effectiveKey) {
      throw new Error('Groq API key is required. Please provide your Groq API key in Settings.');
    }

    const targetModel = resolvedModel || 'llama-3.3-70b-versatile';
    const endpoint = customEndpoint || 'https://api.groq.com/openai/v1/chat/completions';

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      providerUsed: 'Groq Cloud',
      modelUsed: targetModel,
    };
  }

  // 6. CUSTOM / LOCAL ENDPOINT (Ollama / LMStudio / Custom OpenAI Compatible API)
  if (resolvedProvider === 'custom') {
    const endpoint = customEndpoint || 'http://localhost:11434/v1/chat/completions';
    const targetModel = resolvedModel || 'llama3.2';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: targetModel,
        messages: formattedMessages,
        temperature,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Custom Endpoint Error (${res.status}): ${errText}`);
    }

    const data: any = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      text,
      providerUsed: 'Custom / Local API',
      modelUsed: targetModel,
    };
  }

  // Fallback to Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy-key' });
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents,
    config: {
      systemInstruction,
      temperature,
    },
  });

  return {
    text: response.text || '',
    providerUsed: 'Google Gemini (Fallback)',
    modelUsed: 'gemini-3.7-flash',
  };
}
