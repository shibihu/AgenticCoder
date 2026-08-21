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
      const { prompt, mode = 'chat', context_code = '', godot_version = '4.x' } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      let enhancedPrompt = `User Prompt from Godot ${godot_version} Editor Dock: "${prompt}"\nMode: ${mode}\n`;
      if (context_code) {
        enhancedPrompt += `\nActive Script in Godot Script Editor:\n\`\`\`gdscript\n${context_code}\n\`\`\`\n`;
      }

      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: enhancedPrompt,
        config: {
          systemInstruction: GODOT_SYSTEM_INSTRUCTION + `\nYou are responding directly to the Godot Editor Dock plugin. Keep responses concise, with clear code blocks that can be directly inserted into the user's active GDScript editor. Target version: ${godot_version}.`,
          temperature: 0.3,
        },
      });

      const text = response.text || '';

      // Extract primary code block if present
      let extractedCode = '';
      const codeBlockMatch = text.match(/```(?:gdscript|gdshader|csharp|tscn)?\n([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        extractedCode = codeBlockMatch[1].trim();
      }

      res.json({
        reply: text,
        code: extractedCode,
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
