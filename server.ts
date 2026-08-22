import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getGeminiAI, GODOT_SYSTEM_INSTRUCTION } from './server/gemini';
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
      service: 'Godot AI Copilot & Addon Hub',
      godotBridgeActive: true,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: Date.now(),
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

  // Main Web Chat AI endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, godotVersion = '4.x', mode = 'chat', currentCode } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required' });
        return;
      }

      const ai = getGeminiAI();
      const lastMessage = messages[messages.length - 1];

      let contextualPrompt = lastMessage.content;
      if (currentCode) {
        contextualPrompt += `\n\n--- CURRENT SCRIPT CONTEXT (${godotVersion}) ---\n\`\`\`gdscript\n${currentCode}\n\`\`\``;
      }

      // Build conversation contents
      const conversationHistory = messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      conversationHistory.push({
        role: 'user',
        parts: [{ text: contextualPrompt }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: conversationHistory,
        config: {
          systemInstruction: GODOT_SYSTEM_INSTRUCTION + `\nTarget Godot Version: ${godotVersion}.\nCurrent Mode: ${mode}.`,
          temperature: 0.4,
          topP: 0.95,
        },
      });

      const text = response.text || 'No response generated from model.';

      res.json({
        reply: text,
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

  // Dedicated Godot Engine Editor Addon Bridge Endpoint
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

      enhancedPrompt += `
CRITICAL DIRECTIVE:
You are an active Agentic IDE Copilot plugin running inside Godot Editor with FULL FILE SYSTEM & IN-EDITOR SCENE EXECUTION PERMISSIONS.
NEVER say "As an AI I cannot modify files" or "You must do this manually".
Whenever the user asks to add nodes, delete files, remove assets, organize folders, create shaders, create scenes, or refactor code, you MUST output an action block using:
\`\`\`action
{
  "actions": [
    { "type": "add_node", "node_type": "CharacterBody2D", "name": "Player", "parent": "", "add_collision_shape": true },
    { "type": "delete_matching", "pattern": "Polish" },
    { "type": "apply_shader", "shader_code": "shader_type canvas_item; ...", "save_path": "res://Shaders/water.gdshader" }
  ]
}
\`\`\`

Supported action commands:
1. SCENE & NODES:
   - Add Node: { "type": "add_node", "node_type": "CharacterBody2D|Sprite2D|Area2D|Camera2D|PointLight2D|MeshInstance3D", "name": "NodeName", "parent": "ParentNodeName", "properties": {"position": [100, 200]}, "add_collision_shape": true }
   - Collision Shape: { "type": "create_collision_shape", "parent": "Player", "shape": "rectangle|circle|capsule" }
   - New Scene: { "type": "create_scene", "path": "res://Scenes/Level1.tscn", "root_type": "Node2D|Node3D|CharacterBody2D", "name": "Level1" }

2. FILES & ASSETS:
   - Delete Matching: { "type": "delete_matching", "pattern": "<name_or_substring>" }
   - Delete Specific: { "type": "delete_file", "path": "res://Assets/path/file.png" }
   - Move/Rename: { "type": "move_file", "from": "res://file.png", "to": "res://Assets/Textures/file.png" }
   - Create Script/File: { "type": "create_file", "path": "res://scripts/filename.gd", "content": "<gdscript_code>" }
   - Auto Organize Assets: { "type": "organize_assets" }

3. SHADERS:
   - Apply Shader: { "type": "apply_shader", "shader_code": "<shader_code>", "save_path": "res://Shaders/my_shader.gdshader" }

4. SCRIPTS:
   - Replace Current Active Script: { "type": "replace_active_script", "content": "<gdscript_code>" }

Respond with confirmation of the action and the action JSON block.`;

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: enhancedPrompt,
        config: {
          systemInstruction: GODOT_SYSTEM_INSTRUCTION + `\nYou are Godot AI Agentic IDE Copilot Pro with real file-modification, scene building, shader applying, and code-execution tools. ALWAYS output \`\`\`action blocks for IDE operations. NEVER state that you cannot access files. Target version: ${godot_version}.`,
          temperature: 0.1,
        },
      });

      const text = response.text || '';

      // Extract primary code block if present
      let extractedCode = '';
      const codeBlockMatch = text.match(/```(?:gdscript|gdshader|csharp|tscn)?\n([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1] && !codeBlockMatch[0].startsWith('```action')) {
        extractedCode = codeBlockMatch[1].trim();
      }

      // Extract actions JSON if present
      let actions: any[] = [];
      const actionMatch = text.match(/```action\n([\s\S]*?)```/);
      if (actionMatch && actionMatch[1]) {
        try {
          const parsed = JSON.parse(actionMatch[1].trim());
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions;
          }
        } catch (e) {
          console.warn('Could not parse action block:', e);
        }
      }

      res.json({
        reply: text,
        code: extractedCode,
        actions: actions,
        mode: mode,
        godot_version: godot_version,
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
