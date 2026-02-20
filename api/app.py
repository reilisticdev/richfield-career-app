import os
import json
from flask import Flask, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

app = Flask(__name__)

def call_gemini(prompt, is_json=True):
    client = genai.Client(api_key=API_KEY)
    config = types.GenerateContentConfig(response_mime_type="application/json") if is_json else None
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=config
    )
    return json.loads(response.text) if is_json else response.text

# --- ROUTE 1: THE CORE ROADMAP ---
@app.route('/api/match', methods=['POST'])
def match():
    try:
        data = request.json
        scores = data.get('scores', [50, 50, 50, 50, 50])
        program = data.get('program', 'Information Technology')
        
        prompt = f"""
        You are an expert academic advisor for Richfield college in South Africa. Year: 2026.
        Student Program Chosen: '{program}'. 
        Psych Vector (Tech, Biz, People, Creative, Hands-on): {scores}.
        
        Task 1: Determine the best career match based on 2026 SA market data. The career MUST align with '{program}'.
        
        Task 2: Generate an academic roadmap based on the Richfield 2026 Prospectus. 
        CRITICAL RULE: 
        - BSc IT requires a Year 2 major (Programming, Emerging Tech, IT Management, or Network Engineering) that carries to Year 3.
        - BCom requires a Year 2 major (Accounting, Marketing, or Human Resource Management) that carries to Year 3.
        Select the major that best fits their Psych Vector.
        
        Return exactly this JSON structure:
        {{
            "top_role": {{"title": "Exact Role", "match_percentage": 96, "description": "2026 SA market context...", "personality_notes": "Why their vector fits..."}},
            "roadmap": {{
                "year_1": {{"semester_1": "List 2 core modules", "semester_2": "List 2 core modules"}},
                "year_2": {{"semester_1": "List 2 core modules", "semester_2": "List 2 core modules", "mandatory_major": "Name the specific chosen major"}},
                "year_3": {{"semester_1": "List 2 advanced modules", "semester_2": "List 2 advanced modules", "continued_major": "State the 3rd-year version of the major"}}
            }},
            "top_5_roles": [{{"title": "Role 1", "percentage": 96}}, {{"title": "Role 2", "percentage": 89}}, {{"title": "Role 3", "percentage": 85}}, {{"title": "Role 4", "percentage": 81}}, {{"title": "Role 5", "percentage": 76}}]
        }}
        """
        return jsonify(call_gemini(prompt, is_json=True))
    except Exception as e:
        print(f"Match API Error: {e}")
        return jsonify({"error": "Failed to generate roadmap."}), 500

# --- ROUTE 2: THE DREAM JOB PIVOT ---
@app.route('/api/pivot', methods=['POST'])
def pivot():
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
    except Exception:
        return jsonify({"feasibility_score": 50, "gap_analysis": "System busy.", "richfield_bridge": "Use electives.", "market_reality": "Market fluctuates."})

# --- ROUTE 3: THE POSTGRADUATE PATHWAY ---
@app.route('/api/postgrad', methods=['POST'])
def postgrad():
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
    except Exception:
        return jsonify({"career_multiplier": "Increases earnings.", "focus_areas": "Advanced theory.", "comparison_note": "Postgrads enter at management level."})

# --- ROUTE 4: THE RICHFIELD CHATBOT ---
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        program = data.get('program', '')
        scores = data.get('scores', [])
        
        prompt = f"""
        You are a friendly, highly knowledgeable Academic and Career Advisor for Richfield College in South Africa. The year is 2026.
        The student you are talking to is enrolled in '{program}' and has a psychological vector of {scores} (Tech, Biz, People, Creative, Hands-on).
        
        Student asks: "{message}"
        
        Instructions for your response:
        1. Base your advice heavily on Richfield's specific ecosystem. If relevant, mention their 2nd-year major choices, the free IBM/AWS/CISCO certifications, the Entrepreneurship Hub, or SAICA pathways.
        2. Supplement your answer with external, real-world 2026 job market data to explain concepts.
        3. Keep it conversational, encouraging, and concise (2 short paragraphs max). Do not use complex markdown formatting.
        """
        
        # Call Gemini requesting plain text, not JSON
        response_text = call_gemini(prompt, is_json=False)
        return jsonify({"response": response_text})
        
    except Exception as e:
        print(f"Chat API Error: {e}")
        return jsonify({"response": "I'm experiencing a bit of network traffic right now. Could you ask me that again?"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)