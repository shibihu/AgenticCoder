import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Key, 
  Cpu, 
  Globe, 
  Check, 
  RefreshCw, 
  Layers, 
  Zap, 
  Bot, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { AIProvider, AIModelConfig } from '../types';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIModelConfig;
  onSaveConfig: (config: AIModelConfig) => void;
}

interface ProviderOption {
  id: AIProvider;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  models: string[];
  defaultModel: string;
  apiKeyHelpUrl?: string;
  requiresKey: boolean;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'auto',
    name: 'Auto-Select (Smart Best Model)',
    badge: 'RECOMMENDED',
    badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800/60',
    description: 'Dynamically routes each request to the strongest model (Claude 3.5 Sonnet, Gemini 3.7 Flash, or Groq) based on prompt depth & system complexity.',
    models: ['Auto-Routed (Smart Engine Selection)'],
    defaultModel: 'Auto-Routed',
    requiresKey: false,
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'BUILT-IN',
    badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-800/60',
    description: 'Gemini 3.7 Flash & 2.5 Pro for 1M+ context window, rapid GDScript iteration, and native scene tree understanding.',
    models: ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
    defaultModel: 'gemini-3.7-flash',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    requiresKey: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Universal Gateway)',
    badge: 'MULTI-LLM',
    badgeColor: 'bg-purple-950 text-purple-400 border-purple-800/60',
    description: 'Access Claude 3.5 Sonnet, DeepSeek V3, DeepSeek R1, Qwen 2.5 Coder, and Llama 3.3 70B through a single OpenRouter key.',
    models: [
      'anthropic/claude-3.5-sonnet',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1',
      'meta-llama/llama-3.3-70b-instruct',
      'qwen/qwen-2.5-coder-32b-instruct',
      'openai/gpt-4o',
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    apiKeyHelpUrl: 'https://openrouter.ai/keys',
    requiresKey: true,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    badge: 'PRO CODING',
    badgeColor: 'bg-amber-950 text-amber-400 border-amber-800/60',
    description: 'Claude 3.5 Sonnet direct API for high-precision Godot architecture, complex refactoring, and state machine design.',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiKeyHelpUrl: 'https://console.anthropic.com/',
    requiresKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI / Codex',
    badge: 'GPT-4o',
    badgeColor: 'bg-green-950 text-green-400 border-green-800/60',
    description: 'GPT-4o & reasoning models for GDScript 2.0 coding, algorithm optimization, and math calculations.',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1'],
    defaultModel: 'gpt-4o',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    requiresKey: true,
  },
  {
    id: 'groq',
    name: 'Groq Cloud (LPU Fast)',
    badge: '500+ T/S',
    badgeColor: 'bg-orange-950 text-orange-400 border-orange-800/60',
    description: 'Ultra-low latency inference for instant Godot script generating and shader tweaking.',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    requiresKey: true,
  },
  {
    id: 'custom',
    name: 'Custom / Local (Ollama, LM Studio)',
    badge: 'OFFLINE',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Connect to your local Ollama (localhost:11434) or any OpenAI-compatible API endpoint.',
    models: ['llama3.2', 'deepseek-coder', 'qwen2.5-coder', 'custom'],
    defaultModel: 'llama3.2',
    requiresKey: false,
  },
];

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(config.provider || 'auto');
  const [selectedModel, setSelectedModel] = useState<string>(config.model || '');
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [customEndpoint, setCustomEndpoint] = useState<string>(config.customEndpoint || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setSelectedProvider(config.provider || 'auto');
    setSelectedModel(config.model || '');
    setApiKey(config.apiKey || '');
    setCustomEndpoint(config.customEndpoint || '');
    setTestResult(null);
  }, [config, isOpen]);

  const currentProviderObj = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  const handleSelectProvider = (provId: AIProvider) => {
    setSelectedProvider(provId);
    const prov = PROVIDERS.find((p) => p.id === provId);
    if (prov) {
      setSelectedModel(prov.defaultModel);
      if (provId === 'custom' && !customEndpoint) {
        setCustomEndpoint('http://localhost:11434/v1/chat/completions');
      }
    }
    setTestResult(null);
  };

  const handleSave = () => {
    onSaveConfig({
      provider: selectedProvider,
      model: selectedModel || currentProviderObj.defaultModel,
      apiKey: apiKey.trim(),
      customEndpoint: customEndpoint.trim(),
    });
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say "Godot AI Copilot Connected!" in 5 words.' }],
          provider: selectedProvider,
          model: selectedModel || currentProviderObj.defaultModel,
          apiKey: apiKey.trim(),
          customEndpoint: customEndpoint.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setTestResult({
          success: false,
          message: data.error || data.details || 'Connection failed. Please verify API key/endpoint.',
        });
      } else {
        setTestResult({
          success: true,
          message: `Connected successfully! Provider: ${data.providerUsed || selectedProvider} (${data.modelUsed || selectedModel})`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error connecting to API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                AI Provider & Model Settings
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  Multi-LLM Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Configure Gemini, OpenRouter, Claude, OpenAI, Groq, or Local Ollama</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
          {/* Provider Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-zinc-200 uppercase tracking-wider mb-2.5">
              Select AI Engine / Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROVIDERS.map((prov) => {
                const isSelected = selectedProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    onClick={() => handleSelectProvider(prov.id)}
                    className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-zinc-900/90 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5">
                        {prov.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${prov.badgeColor}`}>
                        {prov.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {prov.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-cyan-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>Model Selection ({currentProviderObj.name})</span>
                {selectedProvider === 'auto' && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Auto-Selected at Runtime
                  </span>
                )}
              </label>
              
              {selectedProvider === 'auto' ? (
                <div className="px-3.5 py-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>The router automatically selects the highest-scoring model for GDScript code generation, node hierarchies, shaders, and physics wrappers.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                  >
                    {currentProviderObj.models.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === currentProviderObj.defaultModel ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="Or type custom model name (e.g. deepseek/deepseek-r1)"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Custom API Key input if not Auto or if user wants to override */}
            {selectedProvider !== 'auto' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>API Key {currentProviderObj.requiresKey ? '(Required)' : '(Optional override)'}</span>
                  </span>
                  {currentProviderObj.apiKeyHelpUrl && (
                    <a
                      href={currentProviderObj.apiKeyHelpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                    >
                      Get API Key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${currentProviderObj.name} API Key...`}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  API keys are stored securely in your browser's local storage and used directly for your requests.
                </p>
              </div>
            )}

            {/* Custom Endpoint (for Custom/Local or Proxies) */}
            {selectedProvider === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Custom Endpoint URL</span>
                </label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="http://localhost:11434/v1/chat/completions"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Test Connection Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 break-words">{testResult.message}</div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-950/40 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
