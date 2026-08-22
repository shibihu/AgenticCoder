import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { generateAIResponse, GODOT_MASTER_SKILL_PROMPT, autoSelectBestModel } from './server/aiRouter';
import { GODOT_ADDON_FILES } from './src/data/addonFiles';
import JSZip from 'jszip';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing
  app.use(express.json({ limit: '10mb' }));

  // CORS headers so Godot 4 Editor HTTPRequest from localhost or test clients connects seamlessly
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Godot AI Copilot Pro & Multi-Provider Engine',
      godotBridgeActive: true,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
      claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
      openAIConfigured: !!process.env.OPENAI_API_KEY,
      groqConfigured: !!process.env.GROQ_API_KEY,
      timestamp: Date.now(),
    });
  });

  // Available AI Providers & Recommended Models
  app.get('/api/providers', (req, res) => {
    res.json({
      defaultProvider: 'auto',
      providers: [
        {
          id: 'auto',
          name: '🤖 Auto (Smart Best Model Router)',
          description: 'Intelligently analyzes code & prompt complexity to route to Claude 3.5 Sonnet, Gemini 3.7 Flash, or Groq.',
          isAuto: true,
          models: ['Auto Selected (Claude 3.5 Sonnet / Gemini 3.7 / Groq)'],
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'High-speed reasoning, 1M+ context window, native multimodal understanding.',
          hasServerKey: !!process.env.GEMINI_API_KEY,
          defaultModel: 'gemini-3.7-flash',
          models: ['gemini-3.7-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'],
        },
        {
          id: 'openrouter',
          name: 'OpenRouter (Universal)',
          description: 'Unified API for Claude 3.5 Sonnet, DeepSeek V3/R1, Qwen 2.5, and Llama 3.3.',
          hasServerKey: !!process.env.OPENROUTER_API_KEY,
          defaultModel: 'anthropic/claude-3.5-sonnet',
          models: [
            'anthropic/claude-3.5-sonnet',
            'deepseek/deepseek-chat',
            'deepseek/deepseek-r1',
            'meta-llama/llama-3.3-70b-instruct',
            'openai/gpt-4o',
          ],
        },
        {
          id: 'claude',
          name: 'Anthropic Claude',
          description: 'Top-tier complex GDScript 2.0 system architecture and refactoring.',
          hasServerKey: !!process.env.ANTHROPIC_API_KEY,
          defaultModel: 'claude-3-5-sonnet-20241022',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
        },
        {
          id: 'openai',
          name: 'OpenAI / Codex',
          description: 'State-of-the-art coding and reasoning capabilities.',
          hasServerKey: !!process.env.OPENAI_API_KEY,
          defaultModel: 'gpt-4o',
          models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1'],
        },
        {
          id: 'groq',
          name: 'Groq Cloud (Ultra Fast)',
          description: 'Lightning-fast 500+ tokens/sec inference powered by LPUs for instant code/shaders.',
          hasServerKey: !!process.env.GROQ_API_KEY,
          defaultModel: 'llama-3.3-70b-versatile',
          models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
        },
        {
          id: 'custom',
          name: 'Custom / Local (Ollama, LMStudio)',
          description: 'Connect directly to your local Ollama or OpenAI-compatible server.',
          defaultModel: 'llama3.2',
          defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
          models: ['llama3.2', 'deepseek-coder', 'qwen2.5-coder', 'custom'],
        },
      ],
    });
  });

  // Download complete Godot Addon ZIP endpoint
  app.get('/api/godot/download-addon', async (req, res) => {
    try {
      const zip = new JSZip();
      
      // Place everything inside addons/godot_ai_copilot/
      for (const file of GODOT_ADDON_FILES) {
        zip.file(file.path, file.content);
      }

      const content = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="godot_ai_copilot_addon.zip"');
      res.send(content);
    } catch (err: any) {
      console.error('[Addon Download Error]:', err);
      res.status(500).json({ error: 'Failed to generate addon zip', details: err.message });
    }
  });

  // Main Web Chat AI endpoint (Multi-Provider)
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        messages,
        godotVersion = '4.x',
        mode = 'chat',
        currentCode,
        provider = 'auto',
        model,
        apiKey,
        customEndpoint,
      } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }

      const lastMessage = messages[messages.length - 1];
      let contextualPrompt = lastMessage.content;
      if (currentCode) {
        contextualPrompt += `\n\n--- CURRENT SCRIPT CONTEXT (${godotVersion}) ---\n\`\`\`gdscript\n${currentCode}\n\`\`\``;
      }

      // Build conversation contents
      const conversationHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        content: m.content,
      }));

      conversationHistory.push({
        role: 'user',
        content: contextualPrompt,
      });

      const systemInstruction = GODOT_MASTER_SKILL_PROMPT + `\nTarget Godot Version: ${godotVersion}.\nCurrent Mode: ${mode}.`;

      const aiResult = await generateAIResponse({
        messages: conversationHistory,
        systemInstruction,
        provider,
        model,
        apiKey,
        customEndpoint,
        temperature: 0.35,
        godotVersion,
      });

      res.json({
        reply: aiResult.text,
        providerUsed: aiResult.providerUsed,
        modelUsed: aiResult.modelUsed,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('[Chat API Error]:', err);
      res.status(500).json({
        error: 'Failed to generate Godot AI response',
        details: err.message || String(err),
      });
    }
  });

// Helper to robustly extract action objects from AI response regardless of formatting
function extractActionsFromText(text: string): any[] {
  const actions: any[] = [];
  if (!text) return actions;

  // 1. Check all markdown code blocks (```action, ```json, ```godot_action, etc.)
  const actionBlockRegex = /```(?:action|json|godot_action)?\n([\s\S]*?)```/gi;
  let match;
  while ((match = actionBlockRegex.exec(text)) !== null) {
    const raw = match[1].trim();
    if (!raw.startsWith('{') && !raw.startsWith('[')) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === 'object' && (item.type || item.action)) {
            if (item.action && !item.type) item.type = item.action;
            actions.push(item);
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.actions)) {
          for (const item of parsed.actions) {
            if (item && typeof item === 'object') {
              if (item.action && !item.type) item.type = item.action;
              actions.push(item);
            }
          }
        } else if (parsed.type || parsed.action) {
          if (parsed.action && !parsed.type) parsed.type = parsed.action;
          actions.push(parsed);
        }
      }
    } catch (e) {
      // Try to find JSON objects inside
      const jsonObjectRegex = /\{[\s\S]*?"(?:type|action)"\s*:\s*"[^"]+"[\s\S]*?\}/g;
      let objMatch;
      while ((objMatch = jsonObjectRegex.exec(raw)) !== null) {
        try {
          const item = JSON.parse(objMatch[0]);
          if (item && (item.type || item.action)) {
            if (item.action && !item.type) item.type = item.action;
            actions.push(item);
          }
        } catch (_) {}
      }
    }
  }

  // 2. If no actions found yet, scan for raw JSON blocks in text
  if (actions.length === 0) {
    const knownActions = [
      'wrap_with_body', 'attach_collision', 'make_collision',
      'add_node', 'create_node', 'new_node', 'instantiate_node',
      'delete_node', 'remove_node', 'destroy_node',
      'set_node_properties', 'set_node_property', 'set_property', 'set_properties', 'modify_property',
      'toggle_visibility', 'set_visibility',
      'reparent_node', 'reparent', 'move_node',
      'attach_script', 'set_script',
      'create_collision_shape', 'add_collision_shape',
      'create_scene', 'new_scene',
      'apply_shader', 'set_shader', 'create_shader',
      'replace_active_script', 'replace_script', 'update_script',
      'delete_file', 'remove_file', 'delete_matching', 'move_file', 'rename_file', 'create_file', 'organize_assets'
    ];
    const pattern = new RegExp(`\\{[\\s\\S]*?"(?:type|action)"\\s*:\\s*"(?:${knownActions.join('|')})"[\\s\\S]*?\\}`, 'gi');
    let stMatch;
    while ((stMatch = pattern.exec(text)) !== null) {
      try {
        const item = JSON.parse(stMatch[0]);
        if (item && (item.type || item.action)) {
          if (item.action && !item.type) item.type = item.action;
          actions.push(item);
        }
      } catch (_) {}
    }
  }

  return actions;
}

// Dedicated Godot Engine Editor Addon Bridge Endpoint (Multi-Provider)
// This is called by the in-editor Godot Dock (addons/godot_ai_copilot/dock.gd)
app.post('/api/godot/prompt', async (req, res) => {
  try {
    const {
      prompt,
      mode = 'chat',
      context_code = '',
      godot_version = '4.x',
      project_files = [],
      scene_tree = null,
      selected_nodes = [],
      provider = 'auto',
      model,
      api_key,
      custom_endpoint,
    } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    let enhancedPrompt = `User Prompt from Godot ${godot_version} Editor: "${prompt}"\nMode: ${mode}\n`;
    if (context_code) {
      enhancedPrompt += `\nActive Script in Godot Script Editor:\n\`\`\`gdscript\n${context_code}\n\`\`\`\n`;
    }
    if (scene_tree && scene_tree.nodes && scene_tree.nodes.length > 0) {
      enhancedPrompt += `\nCurrent Edited Scene Hierarchy (Root: ${scene_tree.root_name} [${scene_tree.root_type}]):\n${JSON.stringify(scene_tree.nodes, null, 2)}\n`;
    }
    if (selected_nodes && selected_nodes.length > 0) {
      enhancedPrompt += `\nSelected Nodes in 2D/3D Viewport:\n${JSON.stringify(selected_nodes, null, 2)}\n`;
    }
    if (project_files && project_files.length > 0) {
      enhancedPrompt += `\nProject Files Known in FileSystem (${project_files.length} files scanned):\n${project_files.slice(0, 100).join('\n')}\n`;
    }

    enhancedPrompt += `\nCRITICAL INSTRUCTION:
You are an active Agentic IDE Copilot plugin running inside Godot Editor.
Whenever the user asks to modify scene nodes, change properties (like visibility, modulate, position, scale), add nodes, wrap objects with colliders, delete files, remove assets, organize folders, create shaders, create scenes, reparent nodes, or refactor code, you MUST output a valid action block:
\`\`\`action
{
  "type": "set_node_properties",
  "target": "Interaction/Button/TextureRect",
  "properties": {
    "visible": false
  }
}
\`\`\`
Always use relative paths (e.g. "Interaction/Button/TextureRect") or node names (e.g. "TextureRect"). NEVER use internal editor paths starting with "/root/@EditorNode".
Respond with a brief, clear explanation in the user's language (Thai or English), followed by the action block.`;

    const systemInstruction = GODOT_MASTER_SKILL_PROMPT + `\nYou are Godot AI Agentic IDE Copilot Pro with direct in-editor file-modification, scene building, shader applying, and code-execution abilities. Target version: ${godot_version}.`;

    const aiResult = await generateAIResponse({
      messages: [{ role: 'user', content: enhancedPrompt }],
      systemInstruction,
      provider,
      model,
      apiKey: api_key,
      customEndpoint: custom_endpoint,
      temperature: 0.1,
      godotVersion: godot_version,
    });

    const text = aiResult.text || '';

    // Extract primary code block if present (gdscript/gdshader/csharp/tscn)
    let extractedCode = '';
    const codeBlockMatch = text.match(/```(?:gdscript|gdshader|csharp|tscn)\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      extractedCode = codeBlockMatch[1].trim();
    }

    // Extract actions using robust multi-pattern extractor
    const actions = extractActionsFromText(text);

    res.json({
      reply: text,
      code: extractedCode,
      actions: actions,
      mode: mode,
      godot_version: godot_version,
      providerUsed: aiResult.providerUsed,
      modelUsed: aiResult.modelUsed,
    });
  } catch (err: any) {
    console.error('[Godot Bridge Error]:', err);
    res.status(500).json({
      error: 'Bridge error processing Godot prompt',
      details: err.message || String(err),
    });
  }
});

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Godot AI Copilot Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Startup Fatal Error]:', err);
  process.exit(1);
});

