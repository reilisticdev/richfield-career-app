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
    # Using the correct, active 2026 free tier model
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

# --- ROUTE 1: CORE ROADMAP ---
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
        return jsonify({"error": f"Backend Error: {str(e)}"}), 500

# --- ROUTE 2: CHATBOT ---
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

# --- ROUTE 3: DREAM JOB PIVOT ---
@app.route('/api/pivot', methods=['GET', 'POST'])
def pivot():
    if request.method == 'GET':
        return jsonify({"status": "API is online."})
    try:
        data = request.json
        scores = data.get('scores', [])
        program = data.get('program', '')
        dream_job = data.get('dream_job', '')
        
        prompt = f"""
        A Richfield student in '{program}' with psych scores {scores} wants to become a '{dream_job}'. Context: 2026 South Africa.
        Return exactly this JSON structure:
        {{
            "feasibility_score": 75,
            "gap_analysis": "Personality/skills they are missing.",
            "richfield_bridge": "How to use Richfield electives/badges to pivot.",
            "market_reality": "2026 SA stats on this role."
        }}
        """
        return jsonify(call_gemini(prompt, is_json=True))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ROUTE 4: POSTGRADUATE PATHWAY ---
@app.route('/api/postgrad', methods=['GET', 'POST'])
def postgrad():
    if request.method == 'GET':
        return jsonify({"status": "API is online."})
    try:
        data = request.json
        program = data.get('program', '')
        postgrad_choice = data.get('postgrad_choice', '')
        
        prompt = f"""
        A Richfield grad in '{program}' wants to pursue '{postgrad_choice}'. Context: 2026 SA Market.
        Return exactly this JSON structure:
        {{
            "career_multiplier": "How this boosts salary/seniority.",
            "focus_areas": "Top 2 advanced research areas.",
            "comparison_note": "Undergrad vs Postgrad comparison."
        }}
        """
        return jsonify(call_gemini(prompt, is_json=True))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run()