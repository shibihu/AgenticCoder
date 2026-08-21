import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Code2, 
  FileCode, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  RefreshCw, 
  Zap,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import { ChatMessage, GodotVersion } from '../types';
import { CodeBlock } from './CodeBlock';
import { TEMPLATE_PROMPTS } from '../data/templates';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (content: string, contextCode?: string) => Promise<void>;
  isLoading: boolean;
  godotVersion: GodotVersion;
  onClearChat: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  godotVersion,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [contextCode, setContextCode] = useState('');
  const [showContextEditor, setShowContextEditor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    await onSendMessage(textToSend, contextCode.trim() ? contextCode : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyTemplate = (promptText: string) => {
    setInputText(promptText);
    textareaRef.current?.focus();
  };

  // Helper to parse message text and render markdown codeblocks cleanly
  const renderMessageContent = (content: string) => {
    const segments: React.ReactNode[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let blockIdx = 0;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        segments.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {formatInlineText(textBefore)}
          </div>
        );
      }

      const lang = match[1] || 'gdscript';
      const code = match[2];
      segments.push(
        <CodeBlock
          key={`code-${match.index}-${blockIdx++}`}
          code={code}
          language={lang}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      segments.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
          {formatInlineText(textAfter)}
        </div>
      );
    }

    return segments;
  };

  // Inline formatting helper for bold and code backticks
  const formatInlineText = (text: string): React.ReactNode => {
    // Process markdown headers and bullet points
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={lIdx} className="text-base font-bold text-zinc-100 mt-3 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={lIdx} className="text-lg font-bold text-zinc-100 mt-4 mb-1.5 border-b border-zinc-800 pb-1">{line.slice(3)}</h2>;
      }
      if (line.startsWith('# ')) {
        return <h1 key={lIdx} className="text-xl font-extrabold text-zinc-100 mt-4 mb-2">{line.slice(2)}</h1>;
      }
      // Bullet list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={lIdx} className="flex items-start space-x-2 my-0.5 pl-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>{renderInlineSegments(line.trim().slice(2))}</span>
          </div>
        );
      }
      return (
        <p key={lIdx} className="my-1">
          {renderInlineSegments(line)}
        </p>
      );
    });
  };

  const renderInlineSegments = (line: string): React.ReactNode => {
    // Match inline code `code` and **bold**
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-zinc-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-[13px] border border-zinc-700/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="text-zinc-100 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] max-w-6xl mx-auto p-3 sm:p-4 gap-3">
      {/* Quick starter chips */}
      {messages.length <= 1 && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Quick Godot {godotVersion} Game Dev Starters</span>
            </div>
            <span className="text-[11px] text-zinc-400">Click any prompt to begin</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEMPLATE_PROMPTS.slice(0, 6).map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl.prompt)}
                className="text-left p-2.5 rounded-lg bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-700/50 transition-all group"
              >
                <div className="font-semibold text-xs text-zinc-200 group-hover:text-cyan-300 flex items-center justify-between">
                  <span>{tmpl.title}</span>
                  <Zap className="w-3 h-3 text-zinc-500 group-hover:text-cyan-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{tmpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-md ${
                  isUser
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'bg-cyan-950 border border-cyan-700/50 text-cyan-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-xl p-4 text-xs sm:text-sm shadow-md ${
                  isUser
                    ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-700/40 rounded-tr-none'
                    : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-zinc-800/50 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    {isUser ? 'You (Game Developer)' : `Godot AI Copilot (${godotVersion})`}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-zinc-200">
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/50 text-cyan-400 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-300 flex items-center space-x-3">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Godot AI is architecting GDScript & analyzing game nodes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Optional Context Code Drawer */}
      {showContextEditor && (
        <div className="p-3 bg-zinc-900/90 border border-zinc-700/80 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-300 font-semibold">
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <FileCode className="w-4 h-4" />
              <span>Attach Active Script Context (Optional)</span>
            </span>
            <button
              onClick={() => setShowContextEditor(false)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Paste your existing GDScript or shader code here to ask the AI to refactor, debug, or add features directly into your code.
          </p>
          <textarea
            value={contextCode}
            onChange={(e) => setContextCode(e.target.value)}
            placeholder="extends CharacterBody2D\n\n@export var speed: float = 300.0\n..."
            rows={4}
            className="w-full bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-zinc-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Input Area */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-lg">
        <div className="flex items-center justify-between mb-2 text-[11px] text-zinc-400">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowContextEditor(!showContextEditor)}
              className={`flex items-center space-x-1 px-2 py-0.5 rounded border transition-colors ${
                contextCode.trim()
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>{contextCode.trim() ? 'Script Attached ✓' : '+ Attach Script'}</span>
            </button>
            <span className="text-zinc-500">|</span>
            <span>Target: <strong className="text-cyan-400">Godot {godotVersion}</strong></span>
          </div>
          {messages.length > 1 && (
            <button
              onClick={onClearChat}
              className="flex items-center space-x-1 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>

        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask Godot AI Copilot (e.g. "Create a 2D Platformer controller with wall jumps", "Shader for water ripple", "Fix move_and_slide error")...`}
            rows={2}
            className="flex-1 bg-zinc-950/80 text-zinc-100 placeholder-zinc-500 p-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-md shadow-cyan-950/40 transition-all flex-shrink-0"
            title="Send prompt to Godot AI (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
