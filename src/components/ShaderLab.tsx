import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Code2, 
  Sliders, 
  Layers, 
  Zap, 
  RefreshCw, 
  Eye, 
  Download, 
  Copy, 
  ArrowRight,
  Flame
} from 'lucide-react';
import { GodotVersion } from '../types';
import { CodeBlock } from './CodeBlock';

interface ShaderLabProps {
  godotVersion: GodotVersion;
  onSendToChat: (prompt: string) => void;
}

interface ShaderPreset {
  id: string;
  name: string;
  type: 'canvas_item' | 'spatial';
  description: string;
  code: string;
}

const SHADER_PRESETS: ShaderPreset[] = [
  {
    id: 'water-2d',
    name: '2D Stylized Water & Waves',
    type: 'canvas_item',
    description: 'Sine wave displacement with foam edges, refraction, and deep/shallow water gradient.',
    code: `shader_type canvas_item;

uniform vec4 shallow_color : source_color = vec4(0.2, 0.6, 0.9, 0.8);
uniform vec4 deep_color : source_color = vec4(0.05, 0.2, 0.5, 0.95);
uniform vec4 foam_color : source_color = vec4(0.9, 0.95, 1.0, 1.0);
uniform float wave_speed : hint_range(0.1, 5.0) = 1.2;
uniform float wave_frequency : hint_range(1.0, 30.0) = 12.0;
uniform float wave_amplitude : hint_range(0.001, 0.05) = 0.015;
uniform float foam_level : hint_range(0.0, 0.2) = 0.05;

void fragment() {
	vec2 uv = UV;
	
	// Dual sine wave displacement
	float wave1 = sin(uv.x * wave_frequency + TIME * wave_speed) * wave_amplitude;
	float wave2 = cos(uv.x * (wave_frequency * 1.5) - TIME * (wave_speed * 0.8)) * (wave_amplitude * 0.5);
	uv.y += wave1 + wave2;
	
	// Gradient from shallow surface to deep bottom
	vec4 water_col = mix(shallow_color, deep_color, uv.y);
	
	// Foam line near the top surface
	if (UV.y + wave1 < foam_level) {
		water_col = mix(water_col, foam_color, 0.85);
	}
	
	COLOR = water_col;
}
`
  },
  {
    id: 'dissolve-rim',
    name: 'Dissolve / Teleport with Burning Rim',
    type: 'canvas_item',
    description: 'Noise-based burn dissolve transition with an emissive glowing edge.',
    code: `shader_type canvas_item;

uniform sampler2D noise_texture : repeat_enable;
uniform float dissolve_value : hint_range(0.0, 1.0) = 0.5;
uniform float burn_size : hint_range(0.0, 0.2) = 0.05;
uniform vec4 burn_color : source_color = vec4(1.0, 0.4, 0.1, 1.0);

void fragment() {
	vec4 main_texture = texture(TEXTURE, UV);
	float noise = texture(noise_texture, UV).r;
	
	// Burn threshold calculations
	if (noise < dissolve_value) {
		discard;
	}
	
	if (noise < dissolve_value + burn_size) {
		COLOR = burn_color * 1.5; // Emissive multiplier
	} else {
		COLOR = main_texture;
	}
}
`
  },
  {
    id: 'pixel-outline-2d',
    name: '2D Pixel Sprite Outline',
    type: 'canvas_item',
    description: 'Adaptive 4-directional outline for highlighted or selected game objects.',
    code: `shader_type canvas_item;

uniform vec4 outline_color : source_color = vec4(1.0, 1.0, 0.2, 1.0);
uniform float outline_width : hint_range(0.0, 10.0) = 1.5;

void fragment() {
	vec4 col = texture(TEXTURE, UV);
	vec2 size = TEXTURE_PIXEL_SIZE * outline_width;
	
	// Check neighboring alpha values
	float a = texture(TEXTURE, UV + vec2(0.0, -size.y)).a;
	a += texture(TEXTURE, UV + vec2(0.0, size.y)).a;
	a += texture(TEXTURE, UV + vec2(-size.x, 0.0)).a;
	a += texture(TEXTURE, UV + vec2(size.x, 0.0)).a;
	
	if (col.a < 0.1 && a > 0.1) {
		COLOR = outline_color;
	} else {
		COLOR = col;
	}
}
`
  },
  {
    id: 'crt-scanlines',
    name: 'Retro CRT & Scanline Monitor',
    type: 'canvas_item',
    description: 'Post-processing shader with CRT barrel curvature, scanlines, and RGB chromatic aberration.',
    code: `shader_type canvas_item;

uniform float scanline_count : hint_range(50.0, 600.0) = 240.0;
uniform float scanline_opacity : hint_range(0.0, 1.0) = 0.25;
uniform float chromatic_aberration : hint_range(0.0, 0.01) = 0.003;

void fragment() {
	vec2 uv = UV;
	
	// Chromatic Aberration
	float r = texture(TEXTURE, uv + vec2(chromatic_aberration, 0.0)).r;
	float g = texture(TEXTURE, uv).g;
	float b = texture(TEXTURE, uv - vec2(chromatic_aberration, 0.0)).b;
	float a = texture(TEXTURE, uv).a;
	
	vec4 color = vec4(r, g, b, a);
	
	// Scanlines
	float scanline = sin(uv.y * scanline_count * 3.14159) * 0.5 + 0.5;
	color.rgb -= scanline * scanline_opacity;
	
	COLOR = color;
}
`
  }
];

export const ShaderLab: React.FC<ShaderLabProps> = ({
  godotVersion,
  onSendToChat,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ShaderPreset>(SHADER_PRESETS[0]);
  const [customShaderPrompt, setCustomShaderPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState(SHADER_PRESETS[0].code);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulated canvas animation for visual feedback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (selectedPreset.id === 'water-2d') {
        // Render 2D water simulation
        const grad = ctx.createLinearGradient(0, 40, 0, canvas.height);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#0369a1');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = 60 + Math.sin(x * 0.05 + time * 2) * 8 + Math.cos(x * 0.08 - time) * 4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Foam line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 4) {
          const y = 60 + Math.sin(x * 0.05 + time * 2) * 8 + Math.cos(x * 0.08 - time) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else if (selectedPreset.id === 'dissolve-rim') {
        // Render dissolve simulation
        const threshold = (Math.sin(time) * 0.5 + 0.5);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(80, 40, 140, 100);

        // Burning glowing rim
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 4;
        ctx.strokeRect(80 - threshold * 10, 40 - threshold * 10, 140 + threshold * 20, 100 + threshold * 20);

        ctx.fillStyle = '#e4e4e7';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Dissolve: ${(threshold * 100).toFixed(0)}%`, 110, 95);
      } else {
        // Generic visual canvas
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedPreset]);

  const handleSelectPreset = (preset: ShaderPreset) => {
    setSelectedPreset(preset);
    setCurrentCode(preset.code);
  };

  const handleGenerateCustomShader = async () => {
    if (!customShaderPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `Write a complete, high-performance Godot ${godotVersion} .gdshader for: "${customShaderPrompt.trim()}".
Include:
1. shader_type declaration
2. Configurable uniforms with hint_range, source_color, hint_screen_texture
3. Clean vertex / fragment functions with detailed comments explaining the math.`;

      const res = await fetch('/api/godot/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: 'generate_shader',
          godot_version: godotVersion,
        })
      });

      const data = await res.json();
      setCurrentCode(data.code || data.reply || '// Shader generation output');
    } catch (err) {
      console.error(err);
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Godot {godotVersion} Shader Materials</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Godot Shader VFX Lab (.gdshader)</h2>
          <p className="text-xs text-zinc-400">Generate, customize, and inspect visual shaders for 2D sprites, screen post-processing, and 3D meshes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Presets & Custom Generation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preset list */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Shader Presets</span>
            </h3>

            <div className="space-y-2">
              {SHADER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedPreset.id === preset.id
                      ? 'bg-cyan-950/70 border-cyan-700/60 text-cyan-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="font-semibold text-zinc-200 flex items-center justify-between">
                    <span>{preset.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                      {preset.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Canvas Simulator */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-200">
              <span className="flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Simulated Viewport</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">60 FPS Preview</span>
            </div>
            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                width={300}
                height={160}
                className="w-full h-40 rounded bg-zinc-950"
              />
            </div>
          </div>

          {/* Custom AI Shader Generator */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Prompt AI for Custom Shader</span>
            </h3>
            <textarea
              value={customShaderPrompt}
              onChange={(e) => setCustomShaderPrompt(e.target.value)}
              placeholder="e.g. Glowing shield hologram with fresnel rim, scrolling grid texture, and hit pulse wave..."
              rows={2}
              className="w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleGenerateCustomShader}
              disabled={isGenerating || !customShaderPrompt.trim()}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition-all"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{isGenerating ? 'Compiling Shader Math...' : 'Generate Custom .gdshader'}</span>
            </button>
          </div>
        </div>

        {/* Right: Shader Code Inspector */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>{selectedPreset.name} (.gdshader)</span>
            </div>
            <button
              onClick={() => onSendToChat(`I am using this shader:\n\`\`\`gdshader\n${currentCode}\n\`\`\`\nHow do I create a ShaderMaterial in Godot ${godotVersion} and bind the uniforms in GDScript at runtime?`)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>Ask AI in Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CodeBlock
            code={currentCode}
            language="gdshader"
            filename={`${selectedPreset.id}.gdshader`}
          />
        </div>
      </div>
    </div>
  );
};
