import React from 'react';
import { 
  Bot, 
  Download, 
  HelpCircle, 
  Layers, 
  Code2, 
  FolderCheck, 
  Sparkles, 
  Workflow, 
  CheckCircle2, 
  ArrowRightLeft,
  Flame
} from 'lucide-react';
import { CopilotMode, GodotVersion } from '../types';

interface HeaderProps {
  currentMode: CopilotMode;
  onSelectMode: (mode: CopilotMode) => void;
  godotVersion: GodotVersion;
  onSelectGodotVersion: (v: GodotVersion) => void;
  onOpenInstallModal: () => void;
  onDownloadAddonZip: () => void;
  isDownloadingZip?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  godotVersion,
  onSelectGodotVersion,
  onOpenInstallModal,
  onDownloadAddonZip,
  isDownloadingZip = false,
}) => {
  const navItems: { id: CopilotMode; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'AI Copilot Chat', icon: <Bot className="w-4 h-4" /> },
    { id: 'addon-hub', label: 'Godot Addon Hub', icon: <FolderCheck className="w-4 h-4" /> },
    { id: 'script-generator', label: 'Script & Systems', icon: <Code2 className="w-4 h-4" /> },
    { id: 'node-architect', label: 'Scene Architect', icon: <Workflow className="w-4 h-4" /> },
    { id: 'shader-lab', label: 'Shader VFX Lab', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'godot3-to-4-converter', label: 'Godot 3 ➔ 4', icon: <ArrowRightLeft className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-sky-400 p-[1px] shadow-lg shadow-cyan-950/40">
            <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" title="AI Bridge Online" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-sm sm:text-base text-zinc-100 tracking-tight flex items-center gap-1.5">
                <span>Godot AI Copilot</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50 font-mono">
                  v4.x ADDON
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Agentic Game Dev Assistant & In-Editor Godot Addon Bridge</p>
          </div>
        </div>

        {/* Right side controls: Version selector, Bridge status & Addon download */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
          {/* Godot version toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => onSelectGodotVersion('4.x')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                godotVersion === '4.x'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Godot 4.x
            </button>
            <button
              onClick={() => onSelectGodotVersion('3.x')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                godotVersion === '3.x'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Godot 3.x
            </button>
          </div>

          {/* Bridge Status Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bridge Active</span>
          </div>

          {/* Setup Guide button */}
          <button
            onClick={onOpenInstallModal}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Addon Guide</span>
          </button>

          {/* Download Addon ZIP button */}
          <button
            onClick={onDownloadAddonZip}
            disabled={isDownloadingZip}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/50 transition-all active:scale-95"
            title="Download the Godot Addon ZIP to drop into your project"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? 'Zipping...' : 'Drop Addon (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto no-scrollbar border-t border-zinc-900">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const active = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-zinc-800/90 text-cyan-300 border border-zinc-700/80 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span className={active ? 'text-cyan-400' : 'text-zinc-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
