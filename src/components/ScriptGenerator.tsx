import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  RefreshCw, 
  Sparkles, 
  Settings2, 
  Sliders, 
  Layers, 
  Zap, 
  Check, 
  Copy, 
  Download,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { GodotVersion } from '../types';
import { CodeBlock } from './CodeBlock';
import { TEMPLATE_PROMPTS } from '../data/templates';

interface ScriptGeneratorProps {
  godotVersion: GodotVersion;
  onSendToChat: (prompt: string) => void;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  godotVersion,
  onSendToChat,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_PROMPTS[0]);
  const [characterType, setCharacterType] = useState<'2d_platformer' | '2d_topdown' | '3d_fps' | 'state_machine' | 'inventory' | 'save_system'>('2d_platformer');
  
  // Tuning parameters
  const [speed, setSpeed] = useState(300);
  const [jumpVelocity, setJumpVelocity] = useState(-400);
  const [coyoteTime, setCoyoteTime] = useState(0.15);
  const [jumpBuffer, setJumpBuffer] = useState(0.1);
  const [enableWallJump, setEnableWallJump] = useState(true);
  const [enableDoubleJump, setEnableDoubleJump] = useState(true);
  const [enableDash, setEnableDash] = useState(true);
  const [dashSpeed, setDashSpeed] = useState(600);

  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      let prompt = '';
      if (characterType === '2d_platformer') {
        prompt = `Write a complete, clean, production-ready Godot ${godotVersion} CharacterBody2D script in GDScript with:
- Speed: ${speed}
- Jump Velocity: ${jumpVelocity}
- Coyote Time: ${coyoteTime}s
- Jump Buffer: ${jumpBuffer}s
- Wall Jump & Wall Slide: ${enableWallJump ? 'ENABLED with pushback impulse' : 'DISABLED'}
- Double Jump: ${enableDoubleJump ? 'ENABLED' : 'DISABLED'}
- Dodge Dash: ${enableDash ? `ENABLED with speed ${dashSpeed} and cooldown` : 'DISABLED'}
Include @export tuning parameters, animated sprite flip handling, and clean comments.`;
      } else if (characterType === '2d_topdown') {
        prompt = `Write a complete Godot ${godotVersion} CharacterBody2D top-down action controller in GDScript with:
- Speed: ${speed}
- 8-directional smooth movement with acceleration and friction
- Dash Mechanic: ${enableDash ? `Speed ${dashSpeed}, invulnerability timer, and cooldown` : 'none'}
- Look at mouse cursor with smooth rotation
- Signals for health/damage.`;
      } else if (characterType === '3d_fps') {
        prompt = `Write a complete Godot ${godotVersion} CharacterBody3D First Person Controller in GDScript with:
- Mouse capture and sensitivity look
- Sprinting (speed ${speed * 1.5}) and Walking (speed ${speed})
- Smooth crouching and collision shape height interpolation
- Head bobbing sinusoidal function
- Slope handling.`;
      } else if (characterType === 'state_machine') {
        prompt = `Create a clean, decoupled Finite State Machine (FSM) in GDScript for Godot ${godotVersion}:
1. BaseState class (extends Node) with enter(), exit(), physics_update(delta), and state_transition signal
2. StateMachine manager class
3. Concrete states: IdleState, MoveState, JumpState, AttackState.`;
      } else if (characterType === 'inventory') {
        prompt = `Create a complete modular Inventory System in GDScript for Godot ${godotVersion} using custom Resource classes:
1. ItemData resource (@export var id: String, name: String, icon: Texture2D, max_stack: int)
2. InventoryData resource with slot management, add_item(), remove_item(), swap()
3. SlotUI Control node with drag-and-drop support.`;
      } else {
        prompt = `Create a robust Save & Load Game Manager Autoload in GDScript for Godot ${godotVersion} using JSON and FileAccess:
1. Save player position, stats, inventory, high score to 'user://savegame.json'
2. Discovers all nodes in 'Persist' group and calls save_data()
3. Safe error checking for missing or corrupt files.`;
      }

      if (customPrompt.trim()) {
        prompt += `\nAdditional requirements: ${customPrompt.trim()}`;
      }

      const res = await fetch('/api/godot/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: 'generate_script',
          godot_version: godotVersion,
        })
      });

      const data = await res.json();
      setGeneratedCode(data.code || data.reply || '# No code generated');
    } catch (err) {
      console.error('Generation failed:', err);
      setGeneratedCode('# Error generating code. Please verify server connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[11px] font-semibold border border-cyan-800/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Godot {godotVersion} Generator</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Script & Game Mechanics Studio</h2>
          <p className="text-xs text-zinc-400">Configure parameters visually and generate clean, modular GDScript 2.0 architectures.</p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition-all active:scale-95 flex-shrink-0"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>{isGenerating ? 'Architecting...' : 'Generate GDScript'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Configuration Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Template Selector */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Select Architecture Blueprint</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '2d_platformer', label: '2D Platformer', desc: 'Coyote, wall jump, dash' },
                { id: '2d_topdown', label: '2D Top-Down', desc: '8-way move, mouse aim' },
                { id: '3d_fps', label: '3D FPS Controller', desc: 'Mouse look, sprint, crouch' },
                { id: 'state_machine', label: 'Finite State Machine', desc: 'BaseState + StateMachine' },
                { id: 'inventory', label: 'Grid Inventory', desc: 'Custom Resource + DragDrop' },
                { id: 'save_system', label: 'Save / Load Manager', desc: 'JSON & FileAccess' },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setCharacterType(type.id as any)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    characterType === type.id
                      ? 'bg-cyan-950/70 border-cyan-700/60 text-cyan-200 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="font-semibold text-zinc-200">{type.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Physics & Mechanic Tuning Sliders */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Tuning Parameters</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 mb-1">
                  <span>Movement Speed</span>
                  <span className="font-mono text-cyan-400">{speed} px/s</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={800}
                  step={10}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {(characterType === '2d_platformer' || characterType === '3d_fps') && (
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Jump Velocity / Force</span>
                    <span className="font-mono text-cyan-400">{jumpVelocity}</span>
                  </div>
                  <input
                    type="range"
                    min={-800}
                    max={-150}
                    step={10}
                    value={jumpVelocity}
                    onChange={(e) => setJumpVelocity(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              )}

              {characterType === '2d_platformer' && (
                <>
                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Coyote Time</span>
                      <span className="font-mono text-cyan-400">{coyoteTime}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.3}
                      step={0.01}
                      value={coyoteTime}
                      onChange={(e) => setCoyoteTime(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-300 mb-1">
                      <span>Jump Buffer Time</span>
                      <span className="font-mono text-cyan-400">{jumpBuffer}s</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={0.3}
                      step={0.01}
                      value={jumpBuffer}
                      onChange={(e) => setJumpBuffer(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  {/* Feature Toggles */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWallJump}
                        onChange={(e) => setEnableWallJump(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Wall Slide & Wall Jump</span>
                    </label>

                    <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableDoubleJump}
                        onChange={(e) => setEnableDoubleJump(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Double Jump</span>
                    </label>

                    <label className="flex items-center space-x-2 text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableDash}
                        onChange={(e) => setEnableDash(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Dodge Dash</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Custom Notes */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-semibold">Additional Custom Requirements:</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Add stamina bar depletion on dash, add particle effect signal..."
                rows={2}
                className="w-full bg-zinc-950 p-2 rounded-lg border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Generated Output */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Generated GDScript 2.0 Code</span>
            </div>
            {generatedCode && (
              <button
                onClick={() => onSendToChat(`I generated this script:\n\`\`\`gdscript\n${generatedCode}\n\`\`\`\nCan you explain how to set up the scene tree and node properties in Godot ${godotVersion}?`)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Ask AI in Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {generatedCode ? (
            <CodeBlock
              code={generatedCode}
              language="gdscript"
              filename={`${characterType}.gd`}
            />
          ) : (
            <div className="h-96 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-zinc-300 text-sm">No Script Generated Yet</h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Customize the parameters on the left and click <strong>Generate GDScript</strong> to produce production-grade Godot {godotVersion} code.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
