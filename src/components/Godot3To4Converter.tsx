import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Code2, 
  Sparkles, 
  RefreshCw, 
  Zap, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';

const SAMPLE_GODOT3_CODE = `extends KinematicBody2D

export (int) var speed = 200
export (int) var jump_force = -400
export (float) var gravity = 900.0

onready var sprite = $Sprite
onready var anim = $AnimationPlayer

var velocity = Vector2.ZERO

func _ready():
	$Hitbox.connect("area_entered", self, "_on_hitbox_area_entered")

func _physics_process(delta):
	velocity.y += gravity * delta
	
	var input_x = 0
	if Input.is_action_pressed("ui_right"):
		input_x += 1
		sprite.flip_h = false
	if Input.is_action_pressed("ui_left"):
		input_x -= 1
		sprite.flip_h = true
		
	velocity.x = input_x * speed
	
	if is_on_floor() and Input.is_action_just_pressed("ui_up"):
		velocity.y = jump_force
		
	velocity = move_and_slide(velocity, Vector2.UP)

func _on_hitbox_area_entered(area):
	yield(get_tree().create_timer(0.5), "timeout")
	queue_free()
`;

export const Godot3To4Converter: React.FC = () => {
  const [godot3Code, setGodot3Code] = useState(SAMPLE_GODOT3_CODE);
  const [godot4Code, setGodot4Code] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!godot3Code.trim()) return;
    setIsConverting(true);
    try {
      const prompt = `Convert this Godot 3 GDScript code into modern Godot 4.3 GDScript 2.0:
\`\`\`gdscript
${godot3Code}
\`\`\`

Strictly apply all Godot 4 breaking changes:
1. KinematicBody2D -> CharacterBody2D
2. move_and_slide(velocity, up_direction) -> velocity = ...; move_and_slide() (no arguments)
3. export -> @export with static typing
4. onready -> @onready
5. connect("signal", self, "method") -> signal.connect(_on_method)
6. yield(timer, "timeout") -> await timer.timeout
7. Sprite -> Sprite2D, Position2D -> Marker2D, Spatial -> Node3D
8. Add clear explanations for all converted lines.`;

      const res = await fetch('/api/godot/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: 'generate_script',
          godot_version: '4.x',
        })
      });

      const data = await res.json();
      setGodot4Code(data.code || data.reply || '# Conversion failed');
      setExplanation(data.reply || '');
    } catch (err) {
      console.error(err);
      setGodot4Code('# Error converting script');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-5">
      {/* Title */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[11px] font-semibold border border-cyan-800/40">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Migration Assistant</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Godot 3.x ➔ Godot 4.x GDScript Converter</h2>
          <p className="text-xs text-zinc-400">Instantly upgrade legacy scripts to GDScript 2.0, typed annotations, and new physics APIs.</p>
        </div>

        <button
          onClick={handleConvert}
          disabled={isConverting || !godot3Code.trim()}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-cyan-950/60 transition-all active:scale-95 flex-shrink-0"
        >
          {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          <span>{isConverting ? 'Upgrading Script...' : 'Convert to Godot 4'}</span>
        </button>
      </div>

      {/* Migration Cheat Sheet summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { from: 'KinematicBody2D', to: 'CharacterBody2D' },
          { from: 'move_and_slide(vel)', to: 'velocity = vel; move_and_slide()' },
          { from: 'export (int) var x', to: '@export var x: int' },
          { from: 'yield(timer, "timeout")', to: 'await timer.timeout' },
        ].map((item, i) => (
          <div key={i} className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 font-mono text-[11px]">
            <div className="text-red-400 line-through truncate">{item.from}</div>
            <div className="text-emerald-400 font-semibold truncate flex items-center space-x-1 mt-0.5">
              <span>➔</span>
              <span>{item.to}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Code Editor Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Input Godot 3 code */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-zinc-200">
            <span className="text-amber-400">Legacy Godot 3.x GDScript</span>
            <button
              onClick={() => setGodot3Code(SAMPLE_GODOT3_CODE)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 font-normal"
            >
              Load Sample
            </button>
          </div>
          <textarea
            value={godot3Code}
            onChange={(e) => setGodot3Code(e.target.value)}
            rows={18}
            className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
          />
        </div>

        {/* Right: Converted Godot 4 code */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-bold text-zinc-200">
            <span className="text-cyan-400">Modern Godot 4.x GDScript 2.0</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono">
              Ready for Engine
            </span>
          </div>

          {godot4Code ? (
            <CodeBlock
              code={godot4Code}
              language="gdscript"
              filename="converted_godot4.gd"
            />
          ) : (
            <div className="h-96 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-zinc-300 text-sm">Waiting for Conversion</h4>
                <p className="text-xs text-zinc-500 max-w-xs">
                  Paste your Godot 3 script on the left and click <strong>Convert to Godot 4</strong>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
