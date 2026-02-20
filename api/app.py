import os
import json
import traceback
from flask import Flask, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)

def call_gemini(prompt, is_json=True):
    API_KEY = os.environ.get("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("CRITICAL: GEMINI_API_KEY is missing from Vercel's Environment Variables!")
        
    client = genai.Client(api_key=API_KEY)
    model_id = 'gemini-2.5-flash'
    
    config = types.GenerateContentConfig(response_mime_type="application/json") if is_json else None
    
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=config
    )
    
    raw_text = response.text.strip()
    
    # Strip hidden markdown formatting if Google injects it
    if is_json:
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        return json.loads(raw_text.strip())
        
    return raw_text

@app.route('/api/match', methods=['GET', 'POST'])
def match():
    if request.method == 'GET':
        return jsonify({"status": "API is online."})
    try:
        data = request.json
        scores = data.get('scores', [50, 50, 50, 50, 50])
        program = data.get('program', 'Information Technology')
        
        prompt = f"""
        You are an expert academic advisor for Richfield college in South Africa. Year: 2026.
        Student Program Chosen: '{program}'. Psych Vector: {scores}.
        
        Return exactly this JSON structure and nothing else:
        {{
            "top_role": {{"title": "Role", "match_percentage": 96, "description": "Desc", "personality_notes": "Notes"}},
            "roadmap": {{
                "year_1": {{"semester_1": "Mods", "semester_2": "Mods"}},
                "year_2": {{"semester_1": "Mods", "semester_2": "Mods", "mandatory_major": "Major"}},
                "year_3": {{"semester_1": "Mods", "semester_2": "Mods", "continued_major": "Major"}}
            }},
            "top_5_roles": [{{"title": "Role 1", "percentage": 96}}]
        }}
        """
        return jsonify(call_gemini(prompt, is_json=True))
    except Exception as e:
        error_msg = str(e)
        print(f"BACKEND CRASH: {error_msg}")
        # This will send the exact error directly to your frontend!
        return jsonify({"error": f"Backend Error: {error_msg}"}), 500

@app.route('/api/chat', methods=['GET', 'POST'])
def chat():
    if request.method == 'GET':
        return jsonify({"status": "API is online."})
    try:
        data = request.json
        message = data.get('message', '')
        program = data.get('program', '')
        scores = data.get('scores', [])
        
        prompt = f"Student in '{program}' asks: '{message}'. Advise based on Richfield 2026."
        return jsonify({"response": call_gemini(prompt, is_json=False)})
    except Exception as e:
        return jsonify({"response": f"AI Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run()