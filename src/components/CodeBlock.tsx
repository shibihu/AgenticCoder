import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'gdscript',
  filename,
  showLineNumbers = true,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    let ext = '.gd';
    if (language === 'gdshader' || language === 'shader') ext = '.gdshader';
    else if (language === 'config' || language === 'cfg') ext = '.cfg';
    else if (language === 'scene' || language === 'tscn') ext = '.tscn';
    else if (language === 'json') ext = '.json';
    else if (language === 'markdown' || language === 'md') ext = '.md';
    else if (language === 'csharp' || language === 'cs') ext = '.cs';

    const defaultName = filename || `script_${Date.now()}${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const lines = code.trim().split('\n');

  // Syntax colorizer helper for GDScript & Shaders
  const highlightLine = (line: string): React.ReactNode => {
    // Comments
    if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
      return <span className="text-zinc-400 italic">{line}</span>;
    }

    // Match keywords and annotations
    const parts = line.split(/(\b(?:extends|class_name|func|var|const|signal|enum|if|elif|else|for|while|match|return|pass|break|continue|await|yield|super|self|void|int|float|bool|String|Vector2|Vector3|Transform2D|Transform3D|Color|Node|CharacterBody2D|CharacterBody3D|RigidBody2D|RigidBody3D|Area2D|Area3D|Sprite2D|CollisionShape2D|AnimationPlayer|shader_type|uniform|fragment|vertex|light|hint_range|hint_screen_texture|sampler2D|vec2|vec3|vec4|mat4)\b|@export[a-zA-Z_]*|@onready|@tool|@rpc|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+\.?\d*\b)/g);

    return (
      <>
        {parts.map((part, i) => {
          if (!part) return null;
          if (part.startsWith('@')) {
            return <span key={i} className="text-amber-300 font-semibold">{part}</span>;
          }
          if (part.startsWith('"') || part.startsWith("'")) {
            return <span key={i} className="text-emerald-300">{part}</span>;
          }
          if (/^\d+\.?\d*$/.test(part)) {
            return <span key={i} className="text-amber-200">{part}</span>;
          }
          if (['extends', 'class_name', 'func', 'var', 'const', 'signal', 'enum', 'return', 'pass', 'shader_type', 'uniform'].includes(part)) {
            return <span key={i} className="text-cyan-300 font-semibold">{part}</span>;
          }
          if (['if', 'elif', 'else', 'for', 'while', 'match', 'await', 'super', 'self'].includes(part)) {
            return <span key={i} className="text-purple-300 font-medium">{part}</span>;
          }
          if (['void', 'int', 'float', 'bool', 'String', 'Vector2', 'Vector3', 'Node', 'CharacterBody2D', 'CharacterBody3D', 'Sprite2D', 'vec2', 'vec3', 'vec4'].includes(part)) {
            return <span key={i} className="text-sky-300">{part}</span>;
          }
          return <span key={i} className="text-zinc-100">{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-700/80 bg-zinc-950/90 shadow-md font-mono text-xs md:text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-300">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-zinc-200">{filename || (language ? `${language.toUpperCase()}` : 'CODE')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider font-sans">
            {language}
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-200 text-xs border border-cyan-700/40 transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code contents */}
      <div className="overflow-x-auto p-3 text-xs leading-relaxed max-h-[500px] overflow-y-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/50">
                {showLineNumbers && (
                  <td className="w-8 select-none pr-3 text-right text-zinc-400 align-top font-mono text-[11px]">
                    {idx + 1}
                  </td>
                )}
                <td className="whitespace-pre font-mono text-zinc-100 pl-2">
                  {highlightLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
