import React, { useState } from 'react';
import { CopilotMode, GodotVersion, ChatMessage } from './types';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { AddonHub } from './components/AddonHub';
import { ScriptGenerator } from './components/ScriptGenerator';
import { NodeArchitect } from './components/NodeArchitect';
import { ShaderLab } from './components/ShaderLab';
import { Godot3To4Converter } from './components/Godot3To4Converter';
import { AddonInstallModal } from './components/AddonInstallModal';
import { GODOT_ADDON_FILES } from './data/addonFiles';
import JSZip from 'jszip';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg',
    role: 'assistant',
    timestamp: Date.now(),
    content: `### Welcome to Godot AI Copilot & Addon Hub! 🚀

I am your agentic game development assistant specialized in **Godot 4.x & GDScript 2.0**. You can use me directly here in the web app, or **drop my custom addon plugin into your Godot project** to chat and generate code directly inside the Godot Editor dock!

#### What I can help you build:
- **Physics Controllers**: CharacterBody2D/3D platformers with coyote time, jump buffering, wall jumping, and dash mechanics.
- **Game Architectures**: Finite State Machines (FSM), grid inventory systems, dialogue managers, and save/load systems.
- **Godot Shaders (.gdshader)**: Stylized 2D water, burning dissolve effects, CRT scanlines, and pixel outlines.
- **Scene Trees & Nodes**: Optimal scene composition and @onready boilerplate.
- **Godot 3 ➔ 4 Migration**: Automatic GDScript refactoring for breaking changes.

Click any of the quick prompts above or ask me anything to get started!`
  }
];

export default function App() {
  const [currentMode, setCurrentMode] = useState<CopilotMode>('chat');
  const [godotVersion, setGodotVersion] = useState<GodotVersion>('4.x');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  // Send message to server Gemini AI endpoint
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
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'No response received from Godot AI.',
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
          content: `⚠️ **Connection Error**: Could not complete request to Godot AI.\n\`\`\`\n${err.message || String(err)}\n\`\`\`\nPlease verify your network or try again.`,
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
        onDownloadAddonZip={handleDownloadAddonZip}
        isDownloadingZip={isDownloadingZip}
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
    </div>
  );
}
