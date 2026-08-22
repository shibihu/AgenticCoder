import React, { useState } from 'react';
import { 
  FolderCheck, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Layers, 
  Play, 
  CheckCircle2, 
  Cpu, 
  ExternalLink,
  Code2,
  Terminal,
  Zap
} from 'lucide-react';
import { GODOT_ADDON_FILES } from '../data/addonFiles';
import { AddonFile } from '../types';
import { CodeBlock } from './CodeBlock';
import JSZip from 'jszip';

interface AddonHubProps {
  onOpenInstallModal: () => void;
  serverUrl?: string;
}

export const AddonHub: React.FC<AddonHubProps> = ({
  onOpenInstallModal,
  serverUrl = window.location.origin,
}) => {
  const [selectedFile, setSelectedFile] = useState<AddonFile>(GODOT_ADDON_FILES[0]);
  const [downloading, setDownloading] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  
  // Live Bridge Test State
  const [testPrompt, setTestPrompt] = useState('Create a health component with signals');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingBridge, setTestingBridge] = useState(false);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      for (const file of GODOT_ADDON_FILES) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'godot_ai_copilot_addon.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.path);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestBridge = async () => {
    if (!testPrompt.trim()) return;
    setTestingBridge(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/godot/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          mode: 'generate_script',
          godot_version: '4.x'
        })
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        data: data
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        error: err.message || 'Failed to reach bridge'
      });
    } finally {
      setTestingBridge(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-zinc-900 to-zinc-900 border border-cyan-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-600/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-cyan-900/60 border border-cyan-700/50 text-[11px] font-semibold text-cyan-300">
              <FolderCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Official Godot 4.x Editor Plugin</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">
              Godot AI Copilot Addon Package
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Drop the <code className="text-cyan-300 font-mono bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">addons/godot_ai_copilot</code> folder into your Godot project root. Enable it in Project Settings to get AI code generation, script context inspection, and 1-click script insertion directly inside your Godot editor dock!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/60 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Creating ZIP...' : 'Download addons.zip'}</span>
            </button>
            <button
              onClick={onOpenInstallModal}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-colors"
            >
              <span>Visual Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Server URL Callout (Crucial for Godot Editor Connection) */}
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Godot Editor Server URL Configuration:</span>
          </div>
          <p className="text-xs text-zinc-300">
            In your Godot <strong>AI Copilot</strong> dock header, replace <code className="text-red-400 bg-zinc-900 px-1 py-0.5 rounded font-mono">http://localhost:3000</code> with your hosted Cloud URL:
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex-shrink-0">
          <code className="text-xs text-cyan-300 font-mono px-2 select-all max-w-[280px] sm:max-w-xs truncate">
            {serverUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(serverUrl);
              setCopiedPath(true);
              setTimeout(() => setCopiedPath(false), 2000);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            {copiedPath ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPath ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: File Tree + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Addon File Tree Explorer */}
        <div className="lg:col-span-4 bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
              <FolderCheck className="w-4 h-4 text-cyan-400" />
              <span>Addon File Structure</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">{GODOT_ADDON_FILES.length} files</span>
          </div>

          {/* Directory Tree */}
          <div className="font-mono text-xs space-y-1">
            <div className="text-cyan-400 font-semibold flex items-center space-x-1.5 p-1 rounded bg-zinc-950/40">
              <span>📁 res://addons/godot_ai_copilot/</span>
            </div>
            <div className="pl-3 space-y-1 border-l border-zinc-800 ml-2">
              {GODOT_ADDON_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left flex items-center space-x-2 px-2.5 py-1.5 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    }`}
                  >
                    {file.language === 'gdscript' && <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                    {file.language === 'config' && <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    {file.language === 'scene' && <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />}
                    {file.language === 'markdown' && <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                    <span className="truncate">{file.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File description info card */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80 space-y-1.5 text-xs">
            <div className="font-semibold text-zinc-300 flex items-center justify-between">
              <span>{selectedFile.filename}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                {selectedFile.language}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{selectedFile.description}</p>
          </div>

          {/* Copy full path */}
          <button
            onClick={handleCopyPath}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
          >
            {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPath ? 'Path Copied!' : 'Copy Relative Path'}</span>
          </button>
        </div>

        {/* Right: Selected File Code View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-cyan-300">{selectedFile.path}</span>
              </div>
            </div>

            <CodeBlock
              code={selectedFile.content}
              language={selectedFile.language}
              filename={selectedFile.filename}
            />
          </div>

          {/* In-Editor Live Bridge Tester */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-200">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Live Godot Editor Bridge Simulator</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                POST /api/godot/prompt
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Test how the in-editor Godot Dock communicates with this AI backend via HTTPClient / HTTPRequest:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 self-center mr-1">Quick Features:</span>
              {[
                { label: '🏗️ Scene Builder', prompt: 'Add CharacterBody2D Player with CollisionShape2D under root' },
                { label: '🤖 Fix Error', prompt: 'Analyze and fix KinematicBody2D move_and_slide error in active script' },
                { label: '🎨 Apply Shader', prompt: 'Create stylized 2D water shader and apply to selected sprite' },
                { label: '🗂️ Organize Assets', prompt: 'Organize all project assets into Textures, Audio, Shaders, Scripts folders' },
                { label: '🧩 Multi-Script Context', prompt: 'Create InventoryManager.gd and ItemData.gd with signals and custom resource' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestPrompt(item.prompt)}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-cyan-900/60 hover:text-cyan-300 border border-zinc-700/80 text-[11px] text-zinc-300 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt to test Godot Bridge..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleTestBridge}
                disabled={testingBridge || !testPrompt.trim()}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testingBridge ? 'Pinging...' : 'Test Bridge'}</span>
              </button>
            </div>

            {testResult && (
              <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-1 border-b border-zinc-800">
                  <span className="text-emerald-400 font-semibold">Bridge Response (HTTP {testResult.status})</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                {testResult.data?.code && (
                  <CodeBlock
                    code={testResult.data.code}
                    language="gdscript"
                    filename="bridge_response.gd"
                  />
                )}
                <div className="text-zinc-300 whitespace-pre-wrap text-[11px] max-h-36 overflow-y-auto font-mono">
                  {testResult.data?.reply || JSON.stringify(testResult, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
