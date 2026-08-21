import React, { useState } from 'react';
import { 
  Workflow, 
  Layers, 
  Sparkles, 
  Code2, 
  FolderTree, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  Plus, 
  ChevronRight,
  Eye,
  Box,
  CircleDot
} from 'lucide-react';
import { GodotVersion } from '../types';
import { CodeBlock } from './CodeBlock';

interface NodeArchitectProps {
  godotVersion: GodotVersion;
  onSendToChat: (prompt: string) => void;
}

interface TreeNode {
  name: string;
  type: string;
  desc?: string;
  script?: boolean;
  children?: TreeNode[];
}

const PRESET_TREES: { id: string; title: string; desc: string; root: TreeNode }[] = [
  {
    id: 'player-2d',
    title: 'Player Character (2D Platformer)',
    desc: 'Complete 2D Player with physics, state machine, hurtbox, and camera',
    root: {
      name: 'Player',
      type: 'CharacterBody2D',
      script: true,
      desc: 'Root physics body with player_controller.gd',
      children: [
        { name: 'AnimatedSprite2D', type: 'AnimatedSprite2D', desc: 'Sprite animation frames (idle, run, jump, wall_slide)' },
        { name: 'CollisionShape2D', type: 'CollisionShape2D', desc: 'CapsuleShape2D collision boundary' },
        { name: 'AnimationPlayer', type: 'AnimationPlayer', desc: 'Animation keyframe tracks & visual effects' },
        { name: 'Camera2D', type: 'Camera2D', desc: 'Position smoothing and screen shake manager' },
        {
          name: 'StateMachine',
          type: 'Node',
          script: true,
          desc: 'Finite state machine manager (state_machine.gd)',
          children: [
            { name: 'IdleState', type: 'Node', script: true },
            { name: 'MoveState', type: 'Node', script: true },
            { name: 'JumpState', type: 'Node', script: true },
            { name: 'WallSlideState', type: 'Node', script: true },
            { name: 'DashState', type: 'Node', script: true },
          ]
        },
        {
          name: 'Hurtbox',
          type: 'Area2D',
          desc: 'Detects enemy attacks and hazards',
          children: [
            { name: 'CollisionShape2D', type: 'CollisionShape2D' }
          ]
        },
        { name: 'WallRaycasts', type: 'Node2D', children: [
          { name: 'LeftRay', type: 'RayCast2D' },
          { name: 'RightRay', type: 'RayCast2D' },
        ]},
        { name: 'AudioStreamPlayer2D', type: 'AudioStreamPlayer2D', desc: 'Jump and footstep sounds' }
      ]
    }
  },
  {
    id: 'enemy-boss',
    title: 'Boss Monster (AI & Navigation)',
    desc: 'Enemy with NavigationAgent2D, vision detection, and phases',
    root: {
      name: 'BossEnemy',
      type: 'CharacterBody2D',
      script: true,
      desc: 'Boss root controller and stats',
      children: [
        { name: 'Sprite2D', type: 'Sprite2D' },
        { name: 'CollisionShape2D', type: 'CollisionShape2D' },
        { name: 'NavigationAgent2D', type: 'NavigationAgent2D', desc: 'Navmesh pathfinding towards player' },
        { name: 'VisionArea', type: 'Area2D', desc: 'Line of sight trigger for player detection' },
        { name: 'AttackHitbox', type: 'Area2D', desc: 'Damage dealer to player' },
        { name: 'PhaseTimer', type: 'Timer', desc: 'Timer switching between attack patterns' },
        {
          name: 'CanvasLayer',
          type: 'CanvasLayer',
          children: [
            { name: 'BossHealthBar', type: 'ProgressBar', desc: 'Screen top boss HP indicator' }
          ]
        }
      ]
    }
  },
  {
    id: 'level-root',
    title: 'Game Level Root Structure',
    desc: 'Modular 2D level with TileMaps, Y-sort entities, and HUD',
    root: {
      name: 'WorldLevel',
      type: 'Node2D',
      script: true,
      desc: 'Level manager & spawn coordinator',
      children: [
        { name: 'ParallaxBackground', type: 'ParallaxBackground', desc: 'Distant mountains & sky' },
        { name: 'TileMapLayer_Ground', type: 'TileMapLayer', desc: 'Godot 4 TileMapLayer for terrain' },
        { name: 'TileMapLayer_Decor', type: 'TileMapLayer', desc: 'Foliage and props' },
        {
          name: 'Entities_YSort',
          type: 'Node2D',
          desc: 'Y-Sort enabled node holding dynamic objects',
          children: [
            { name: 'PlayerInstance', type: 'CharacterBody2D' },
            { name: 'EnemiesGroup', type: 'Node2D' },
            { name: 'ChestsGroup', type: 'Node2D' },
          ]
        },
        {
          name: 'HUD_CanvasLayer',
          type: 'CanvasLayer',
          children: [
            { name: 'HealthUI', type: 'Control' },
            { name: 'InventoryUI', type: 'Control' },
            { name: 'PauseMenu', type: 'Control' },
          ]
        },
        { name: 'BGM_AudioPlayer', type: 'AudioStreamPlayer' }
      ]
    }
  }
];

export const NodeArchitect: React.FC<NodeArchitectProps> = ({
  godotVersion,
  onSendToChat,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_TREES[0]);
  const [customEntityPrompt, setCustomEntityPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiGeneratedOutput, setAiGeneratedOutput] = useState<string>('');

  const renderTreeItem = (node: TreeNode, depth = 0) => {
    return (
      <div key={`${node.name}-${depth}`} className="space-y-1">
        <div 
          className="flex items-center space-x-2 py-1.5 px-2.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 transition-all font-mono text-xs"
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <CircleDot className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="font-bold text-zinc-100">{node.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-sans border border-zinc-700/60">
            {node.type}
          </span>
          {node.script && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-sans border border-emerald-800/60">
              .gd Script
            </span>
          )}
          {node.desc && (
            <span className="text-[11px] text-zinc-400 font-sans truncate hidden sm:inline">
              — {node.desc}
            </span>
          )}
        </div>
        {node.children && (
          <div className="space-y-1">
            {node.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleGenerateCustomTree = async () => {
    if (!customEntityPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Architect a complete Godot ${godotVersion} Scene Tree (.tscn) and node composition for: "${customEntityPrompt.trim()}".
Please provide:
1. Complete ASCII / visual Node Tree diagram with node types (e.g. CharacterBody2D, Area2D, CollisionShape2D, AnimationTree, RayCast2D, etc.).
2. The Godot @onready node variable references boilerplate in GDScript.
3. The .tscn text format definition.
4. Best practice recommendations for collision masks, layers, and signal wiring.`;

      const res = await fetch('/api/godot/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: 'node_tree',
          godot_version: godotVersion,
        })
      });
      const data = await res.json();
      setAiGeneratedOutput(data.reply || data.code || 'No response generated.');
    } catch (err) {
      console.error(err);
      setAiGeneratedOutput('Error generating scene tree architecture.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5">
      {/* Title */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[11px] font-semibold border border-cyan-800/40">
            <FolderTree className="w-3.5 h-3.5" />
            <span>Scene Composition & Hierarchy</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Godot Scene Node Architect</h2>
          <p className="text-xs text-zinc-400">Design optimal node hierarchies, avoid bloated scripts, and generate .tscn scene setups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Presets & Custom Entity Prompt */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Standard Scene Archetypes</span>
            </h3>

            <div className="space-y-2">
              {PRESET_TREES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setAiGeneratedOutput('');
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPreset.id === preset.id && !aiGeneratedOutput
                      ? 'bg-cyan-950/70 border-cyan-700/60 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="font-semibold text-zinc-200">{preset.title}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Custom Entity Planner */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Scene Tree Generator</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Describe any complex game mechanic or entity to architect the node tree:
            </p>
            <textarea
              value={customEntityPrompt}
              onChange={(e) => setCustomEntityPrompt(e.target.value)}
              placeholder="e.g. 3D Spacecraft with 4 rotating engine thrusters, laser raycasts, shield bubble Area3D, and HUD cockpit..."
              rows={3}
              className="w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleGenerateCustomTree}
              disabled={isGenerating || !customEntityPrompt.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition-all"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{isGenerating ? 'Analyzing Hierarchy...' : 'Architect Custom Scene Tree'}</span>
            </button>
          </div>
        </div>

        {/* Right: Visual Node Tree Display */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              <Workflow className="w-4 h-4 text-cyan-400" />
              <span>
                {aiGeneratedOutput ? 'AI Architected Node Structure' : selectedPreset.title}
              </span>
            </div>
            <button
              onClick={() => onSendToChat(`I need help implementing the scene tree for "${aiGeneratedOutput ? customEntityPrompt : selectedPreset.title}" in Godot ${godotVersion}. Can you provide all the GDScript code and signal connections?`)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-medium"
            >
              <span>Discuss in Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {aiGeneratedOutput ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed">
                {aiGeneratedOutput}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {renderTreeItem(selectedPreset.root)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
