export type GodotVersion = '4.x' | '3.x';

export type CopilotMode = 
  | 'chat' 
  | 'addon-hub' 
  | 'script-generator' 
  | 'node-architect' 
  | 'shader-lab' 
  | 'godot3-to-4-converter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  codeBlocks?: {
    language: string;
    code: string;
    filename?: string;
    description?: string;
  }[];
  nodeTree?: SceneNode[];
  isStreaming?: boolean;
}

export interface SceneNode {
  name: string;
  type: string;
  script?: string;
  description?: string;
  children?: SceneNode[];
}

export interface AddonFile {
  path: string;
  filename: string;
  content: string;
  description: string;
  language: 'gdscript' | 'config' | 'markdown' | 'scene' | 'python' | 'txt';
}

export interface TemplatePrompt {
  id: string;
  title: string;
  category: 'controller' | 'ai' | 'systems' | 'shaders' | 'ui';
  description: string;
  prompt: string;
  tags: string[];
}

export interface GodotBridgeRequest {
  prompt: string;
  mode?: 'chat' | 'generate_script' | 'fix_error' | 'generate_shader' | 'node_tree';
  context_code?: string;
  godot_version?: GodotVersion;
  node_context?: string;
}

export interface GodotBridgeResponse {
  reply: string;
  code?: string;
  codeLanguage?: string;
  filename?: string;
  nodeTree?: SceneNode[];
  error?: string;
}
