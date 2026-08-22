import React, { useState, useEffect } from 'react';
import { CopilotMode, GodotVersion, ChatMessage, AIModelConfig } from './types';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { AddonHub } from './components/AddonHub';
import { ScriptGenerator } from './components/ScriptGenerator';
import { NodeArchitect } from './components/NodeArchitect';
import { ShaderLab } from './components/ShaderLab';
import { Godot3To4Converter } from './components/Godot3To4Converter';
import { AddonInstallModal } from './components/AddonInstallModal';
import { ProviderSettingsModal } from './components/ProviderSettingsModal';
import { GODOT_ADDON_FILES } from './data/addonFiles';
import JSZip from 'jszip';

const DEFAULT_AI_CONFIG: AIModelConfig = {
  provider: 'auto',
  model: 'Auto-Routed',
  apiKey: '',
  customEndpoint: '',
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    timestamp: Date.now(),
    providerUsed: 'Multi-LLM Auto Router',
    modelUsed: 'Smart Engine',
    content: `### Welcome to Godot AI Copilot Pro & Addon Hub! 🚀

I am your agentic game development assistant specialized in **Godot 4.x & GDScript 2.0**, powered by an **Intelligent Multi-Provider AI Engine** (Google Gemini, OpenRouter, Anthropic Claude, OpenAI, Groq, & Local Ollama).

#### 🌟 Advanced In-Editor & Web Capabilities:
- **🛡️ Auto Physics Collider Wrapper**: Ask *"Make collision for Chest"* -> Wraps your Sprite in a \`StaticBody2D\` / \`Area2D\` and creates an auto-sized \`CollisionShape2D\` matching the texture dimensions!
- **🏗️ In-Editor Scene Builder**: Generates nodes, reparents hierarchy, and configures transforms directly in Godot.
- **🤖 1-Click Error Diagnostics**: Analyzes Godot Script Editor stacktraces and applies instant refactors.
- **🎨 Shader Studio (.gdshader)**: Stylized water, dissolving burns, outlines, and screen-space post-processing.
- **🔄 Godot 3 ➔ 4 Migration**: Automatic GDScript refactoring for breaking changes.

Click **Config** in the top bar to choose your preferred AI Provider or use **Auto Best Model**!`
  }
];

export default function App() {
  const [currentMode, setCurrentMode] = useState<CopilotMode>('chat');
  const [godotVersion, setGodotVersion] = useState<GodotVersion>('4.x');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [aiConfig, setAiConfig] = useState<AIModelConfig>(() => {
    try {
      const saved = localStorage.getItem('godot_ai_config');
      return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  });

  // Save AI Config to localStorage
  const handleSaveAIConfig = (newConfig: AIModelConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('godot_ai_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Could not save ai config:', e);
    }
  };

  // Send message to server Multi-Provider AI endpoint
  const handleSendMessage = async (content: string, contextCode?: string) => {
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content,
        timestamp: Date.now(),
      }
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          godotVersion,
          mode: currentMode,
          currentCode: contextCode,
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
          customEndpoint: aiConfig.customEndpoint,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || `Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'No response received from Godot AI.',
          providerUsed: data.providerUsed,
          modelUsed: data.modelUsed,
          timestamp: Date.now(),
        }
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **AI Engine Error**: Could not complete request to Godot AI.\n\`\`\`\n${err.message || String(err)}\n\`\`\`\nTip: You can change the Provider or enter an API Key via the **Config** button in the top menu.`,
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Download the complete Addons ZIP package
  const handleDownloadAddonZip = async () => {
    setIsDownloadingZip(true);
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
      console.error('Download addon error:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSendToChatFromOtherViews = (promptText: string) => {
    setCurrentMode('chat');
    handleSendMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        godotVersion={godotVersion}
        onSelectGodotVersion={setGodotVersion}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onDownloadAddonZip={handleDownloadAddonZip}
        isDownloadingZip={isDownloadingZip}
        aiConfig={aiConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentMode === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            godotVersion={godotVersion}
            onClearChat={() => setMessages(INITIAL_MESSAGES)}
          />
        )}

        {currentMode === 'addon-hub' && (
          <AddonHub
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          />
        )}

        {currentMode === 'script-generator' && (
          <ScriptGenerator
            godotVersion={godotVersion}
            onSendToChat={handleSendToChatFromOtherViews}
          />
        )}

        {currentMode === 'node-architect' && (
          <NodeArchitect
            godotVersion={godotVersion}
            onSendToChat={handleSendToChatFromOtherViews}
          />
        )}

        {currentMode === 'shader-lab' && (
          <ShaderLab
            godotVersion={godotVersion}
            onSendToChat={handleSendToChatFromOtherViews}
          />
        )}

        {currentMode === 'godot3-to-4-converter' && (
          <Godot3To4Converter />
        )}
      </main>

      {/* Addon Installation Guide Modal */}
      <AddonInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* AI Provider & Model Settings Modal */}
      <ProviderSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={aiConfig}
        onSaveConfig={handleSaveAIConfig}
      />
    </div>
  );
}

