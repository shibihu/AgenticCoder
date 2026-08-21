"""
Godot AI Copilot - Standalone Python Local Host Server.

Runs a local bridge on http://localhost:3000 to serve Godot Editor requests
and web clients.

Installation:
    pip install -r requirements.txt

Usage:
    export GEMINI_API_KEY="your-gemini-api-key"
    python local_server.py
"""

from __future__ import annotations

import os
import sys
from typing import Any, Dict, List
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from google import genai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = 3000
HOST = "0.0.0.0"

SYSTEM_INSTRUCTION = """You are Godot AI Copilot, a senior expert game engine architect and GDScript engineer specialized in Godot 4.x (and Godot 3.x when asked).

Your guidelines:
1. Always write modern GDScript 2.0 unless Godot 3 is explicitly requested:
   - Use CharacterBody2D / CharacterBody3D instead of KinematicBody
   - Use @export, @onready, @rpc annotations
   - Use typed variables (e.g. var speed: float = 300.0)
   - Use Callable signals: body_entered.connect(_on_body_entered)
   - Use await instead of yield()
   - Use move_and_slide() without arguments (set self.velocity beforehand)
2. For shaders, produce standard Godot .gdshader code with shader_type canvas_item or spatial.
3. Write production-ready, clean, well-commented code without unnecessary external dependencies.
4. When returning code, wrap it cleanly in markdown codeblocks (```gdscript or ```gdshader).
"""


def get_ai_client() -> genai.Client:
    """Initialize and return the Google GenAI client."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[WARNING] GEMINI_API_KEY is not set. Responses will be simulated.", file=sys.stderr)
    return genai.Client(api_key=api_key)


@app.route("/api/health", methods=["GET"])
def health_check() -> Any:
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "Godot AI Copilot Python Local Bridge", "port": PORT})


@app.route("/api/godot/prompt", methods=["POST"])
def handle_godot_prompt() -> Any:
    """
    Handle direct prompt requests from Godot Editor dock plugin.
    Expected JSON payload:
    {
        "prompt": str,
        "godot_version": "4.x" | "3.x",
        "current_code": str (optional),
        "mode": str (optional)
    }
    """
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    godot_version = data.get("godot_version", "4.x")
    current_code = data.get("current_code", "")

    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    user_content = f"Godot Target Version: {godot_version}\n\nUser Request: {prompt}"
    if current_code:
        user_content += f"\n\nActive Script Context in Godot Editor:\n```gdscript\n{current_code}\n```"

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "reply": f"# Godot Local Python Server received: '{prompt}'\n# Please set GEMINI_API_KEY in your environment to get AI responses.",
            "code": f"# Set export GEMINI_API_KEY='your_key'\nfunc _ready():\n    print('Hello from local Godot AI Copilot!')\n"
        })

    try:
        client = get_ai_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_content,
            config={
                "system_instruction": SYSTEM_INSTRUCTION,
                "temperature": 0.3,
            }
        )

        reply_text = response.text or ""

        # Extract code block if present
        code = ""
        if "```gdscript" in reply_text:
            code = reply_text.split("```gdscript")[1].split("```")[0].strip()
        elif "```gdshader" in reply_text:
            code = reply_text.split("```gdshader")[1].split("```")[0].strip()
        elif "```" in reply_text:
            code = reply_text.split("```")[1].split("```")[0].strip()

        return jsonify({
            "reply": reply_text,
            "code": code,
        })
    except Exception as exc:
        print(f"[ERROR] Gemini generation error: {exc}", file=sys.stderr)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/chat", methods=["POST"])
def handle_chat() -> Any:
    """Handle chat messages from the web frontend."""
    data: Dict[str, Any] = request.get_json(silent=True) or {}
    messages: List[Dict[str, str]] = data.get("messages", [])
    godot_version = data.get("godotVersion", "4.x")

    if not messages:
        return jsonify({"error": "Messages array cannot be empty"}), 400

    last_msg = messages[-1].get("content", "")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return jsonify({
            "reply": "⚠️ GEMINI_API_KEY is not set in your environment. Run `export GEMINI_API_KEY='...'` and restart `python local_server.py`."
        })

    try:
        client = get_ai_client()
        prompt_content = f"Target Godot Version: {godot_version}\n\n" + "\n".join(
            [f"{m.get('role', 'user')}: {m.get('content', '')}" for m in messages]
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt_content,
            config={
                "system_instruction": SYSTEM_INSTRUCTION,
                "temperature": 0.4,
            }
        )
        return jsonify({"reply": response.text or "No response received."})
    except Exception as exc:
        print(f"[ERROR] Chat error: {exc}", file=sys.stderr)
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print(f" Godot AI Copilot - Python Local Host Server")
    print(f" Listening on http://localhost:{PORT}")
    print(f" Direct Godot Endpoint: http://localhost:{PORT}/api/godot/prompt")
    print("=" * 60)
    app.run(host=HOST, port=PORT, debug=True)
