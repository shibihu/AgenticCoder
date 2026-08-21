import React, { useState } from 'react';
import { X, Download, FolderCheck, CheckCircle2, Copy, Check, ExternalLink, Terminal, Cpu } from 'lucide-react';
import { GODOT_ADDON_FILES } from '../data/addonFiles';
import JSZip from 'jszip';

interface AddonInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverUrl?: string;
}

export const AddonInstallModal: React.FC<AddonInstallModalProps> = ({
  isOpen,
  onClose,
  serverUrl = window.location.origin,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

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
      console.error('Failed to build zip:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyServerUrl = async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Install Godot 4 Addon Plugin</h2>
              <p className="text-xs text-zinc-400">Drop into your Godot project to get AI Copilot directly inside the Godot Editor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-zinc-300">
          {/* Step 1 */}
          <div className="flex items-start space-x-4 p-4 rounded-lg bg-zinc-950/40 border border-zinc-800">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-900 text-cyan-200 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-zinc-100">Download and Extract the Addon</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Download the pre-packaged zip archive containing the <code className="text-cyan-300 bg-zinc-800 px-1.5 py-0.5 rounded">addons/godot_ai_copilot</code> folder.
              </p>
              <button
                onClick={handleDownloadZip}
                disabled={downloading}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-950/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Building Zip...' : 'Download addons.zip'}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4 p-4 rounded-lg bg-zinc-950/40 border border-zinc-800">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-900 text-cyan-200 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-zinc-100">Paste in your Godot Project Folder</h3>
              <p className="text-zinc-400 text-xs">
                Copy the <code className="text-amber-300 bg-zinc-800 px-1 py-0.5 rounded">addons</code> directory into the root of your Godot 4 project:
              </p>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800/80 font-mono text-xs text-zinc-300 space-y-1">
                <div className="text-cyan-400">📁 your_game_project/</div>
                <div className="pl-4 text-amber-300">└── 📁 addons/</div>
                <div className="pl-8 text-zinc-300">└── 📁 godot_ai_copilot/</div>
                <div className="pl-12 text-zinc-400">├── plugin.cfg</div>
                <div className="pl-12 text-zinc-400">├── godot_ai_copilot.gd</div>
                <div className="pl-12 text-zinc-400">├── dock.tscn</div>
                <div className="pl-12 text-zinc-400">├── dock.gd</div>
                <div className="pl-12 text-zinc-400">└── bridge.gd</div>
                <div className="pl-4 text-zinc-400">└── project.godot</div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4 p-4 rounded-lg bg-zinc-950/40 border border-zinc-800">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-900 text-cyan-200 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-zinc-100">Enable the Plugin in Godot 4</h3>
              <p className="text-zinc-400 text-xs">
                In Godot Engine, navigate to <strong className="text-zinc-200">Project</strong> → <strong className="text-zinc-200">Project Settings...</strong> → <strong className="text-zinc-200">Plugins</strong> tab. Find <strong className="text-cyan-300">Godot AI Copilot</strong> and toggle <strong className="text-emerald-400">Enable</strong>!
              </p>
              <div className="p-3 bg-zinc-950 rounded border border-emerald-900/40 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>The <strong>AI Copilot</strong> dock tab will appear in the bottom dock panel!</span>
              </div>
            </div>
          </div>

          {/* Server Bridge Endpoint URL */}
          <div className="p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4" />
                <span>Web Helper Bridge Endpoint URL</span>
              </span>
              <button
                onClick={handleCopyServerUrl}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-900/70 hover:bg-cyan-800 text-cyan-200 text-xs"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Paste this URL in your Godot Editor dock header to connect directly to this AI assistant:
            </p>
            <div className="p-2 rounded bg-zinc-950 font-mono text-xs text-cyan-300 border border-zinc-800 select-all">
              {serverUrl}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
