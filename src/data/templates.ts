import { TemplatePrompt } from '../types';

export const TEMPLATE_PROMPTS: TemplatePrompt[] = [
  {
    id: 'platformer-2d',
    category: 'controller',
    title: '2D Platformer Controller (Godot 4)',
    description: 'CharacterBody2D with coyote time, jump buffer, variable jump height, wall slide & wall jump.',
    prompt: 'Write a complete, production-ready CharacterBody2D script in GDScript for Godot 4.3 with: coyote time (0.15s), jump buffering (0.1s), variable jump height (cut jump on release), wall sliding and wall jumping with impulse pushback, smooth acceleration/friction, and @export parameters for all tuning values.',
    tags: ['2D', 'Physics', 'CharacterBody2D', 'Platformer']
  },
  {
    id: 'topdown-controller',
    category: 'controller',
    title: '2D Top-Down Action Controller',
    description: 'Smooth 8-directional movement, dash mechanic with cooldown, aiming at mouse cursor, and sprite rotation.',
    prompt: 'Create a Godot 4 CharacterBody2D top-down action controller with smooth normalized 8-way movement, dodge dash (invulnerability frames + impulse boost + cooldown timer), mouse aiming with look_at(), and animated sprite flip/rotation handling.',
    tags: ['2D', 'Top-Down', 'Dash', 'Shooter']
  },
  {
    id: 'fps-3d-controller',
    category: 'controller',
    title: '3D FPS Character Controller',
    description: 'CharacterBody3D with mouse look, head bobbing, sprinting, crouching, and air control.',
    prompt: 'Create a first-person 3D character controller (CharacterBody3D) in Godot 4 with mouse capture/look rotation (clamped pitch), sprinting, smooth crouching with collision shape resizing, head bobbing sinusoidal curve, and stairs/slope handling.',
    tags: ['3D', 'FPS', 'CharacterBody3D', 'Camera3D']
  },
  {
    id: 'fsm-ai',
    category: 'ai',
    title: 'Finite State Machine (FSM) Pattern',
    description: 'Clean modular state machine with BaseState class, StateMachine manager node, and Enemy Patrol/Chase/Attack states.',
    prompt: 'Implement a decoupled Finite State Machine (FSM) architecture for Godot 4: 1) BaseState class extending Node with enter(), exit(), physics_update(), and state_transition signal, 2) StateMachine manager node that routes updates to current_state, 3) Example Enemy states: IdleState, PatrolState, ChaseState (using RayCast2D/Area2D detection), and AttackState.',
    tags: ['Architecture', 'FSM', 'Enemy AI', 'State Pattern']
  },
  {
    id: 'grid-inventory',
    category: 'systems',
    title: 'Grid Inventory & Item System',
    description: 'Data-driven inventory using custom Resource classes (ItemData), stacking, drag & drop, and UI slot controls.',
    prompt: 'Build a modular inventory system in Godot 4 with: 1) ItemData custom Resource (@export var id, name, texture, stack_size, item_type), 2) InventoryData Resource with add_item(), remove_item(), swap_items(), 3) SlotUI Control node handling drag and drop via get_drag_data() and can_drop_data().',
    tags: ['Inventory', 'Resource', 'UI', 'Drag & Drop']
  },
  {
    id: 'save-load-system',
    category: 'systems',
    title: 'Save & Load Manager (ConfigFile / JSON)',
    description: 'Robust save game manager handling persistent nodes, player position, high scores, and settings.',
    prompt: 'Write an Autoload SaveManager script for Godot 4 that discovers all nodes in a "Persist" group, calls save_data() / load_data(), saves to "user://savegame.json" with encryption/validation, and handles player position, health, inventory, and unlocked levels.',
    tags: ['Save/Load', 'Autoload', 'JSON', 'Persistence']
  },
  {
    id: 'shader-water-2d',
    category: 'shaders',
    title: '2D Water & Wave Distortion Shader',
    description: 'CanvasItem shader with scrolling sine waves, refraction, foam edges, and tint.',
    prompt: 'Create a Godot 4 CanvasItem shader (.gdshader) for stylized 2D water: features dual sine wave displacement, foam line at surface edge, refraction using SCREEN_TEXTURE, speed and frequency uniforms, and deep/shallow water color gradient.',
    tags: ['Shader', '2D', 'CanvasItem', 'Water']
  },
  {
    id: 'shader-dissolve',
    category: 'shaders',
    title: 'Hologram & Dissolve Shader',
    description: 'Noise-based burn/dissolve transition effect with glowing emissive border edge.',
    prompt: 'Create a Godot 4 .gdshader for sprite dissolve / teleport effect: uses a noise texture uniform, a dissolve_threshold float from 0.0 to 1.0, and creates a burning glowing rim (burn_color uniform) along the dissolve border.',
    tags: ['Shader', 'VFX', 'Dissolve', 'Glow']
  },
  {
    id: 'dialogue-system',
    category: 'ui',
    title: 'Dialogue System with Branching & Signals',
    description: 'Typewriter text effect, dialogue portrait, choice buttons, and signal callbacks.',
    prompt: 'Create an interactive Dialogue System in Godot 4: features a DialogueManager Autoload, rich typewriter text animation with sound blips per character, branching choices with custom Button instances, and custom BBCode tags for emotion shakes.',
    tags: ['UI', 'Dialogue', 'Typewriter', 'BBCode']
  }
];
