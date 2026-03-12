import os
import json
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Explicitly allowing all origins to prevent any Next.js CORS blocks
CORS(app, resources={r"/api/*": {"origins": "*"}})

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# ==========================================
# 1. LOAD THE RICHFIELD PROSPECTUS
# ==========================================
prospectus_text = ""
try:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(base_dir, 'data', 'Richfield_2026 Prospectus_28 Oct.pdf')
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                prospectus_text += text + "\n"
    print("SUCCESS: Richfield Prospectus loaded into memory.")
except FileNotFoundError:
    print(f"WARNING: Prospectus PDF not found at {pdf_path}")
    prospectus_text = "Data not found."

# ==========================================
# 2. SYSTEM INSTRUCTIONS
# ==========================================
MATCH_SYSTEM_PROMPT = """
You are an elite, strict academic data extractor for Richfield Graduate Institute of Technology.
CRITICAL DIRECTIVES:
1. ZERO HALLUCINATION: Extract module names, course codes, and credit weights EXACTLY character-for-character as they appear in the provided Richfield 2026 Prospectus text. 
2. ARRAY FORMATTING: You MUST return semester modules as a JSON Array of strings. Example: ["Business Management 511 (10 Credits)", "Economics 511 (10 Credits)"]. Do not return a single long string.
3. MAJOR ALIGNMENT: If the user provides a "Major/Focus Area", you MUST include the core modules PLUS the exact elective modules for that specific major in Year 2 and Year 3. If no major is provided, just list the standard core curriculum.
4. DYNAMIC CAREERS: Tailor the top_role and top_5_roles to align strongly with BOTH their psychometric vector AND their chosen major.
5. JSON ONLY: Return ONLY a valid JSON object without any markdown formatting.
"""

HYBRID_SYSTEM_PROMPT = """
You are an elite Career Strategist and Academic Advisor for Richfield.
CRITICAL DIRECTIVES:
1. ACADEMIC STRICTNESS: For module names and curriculum details, extract EXACTLY from the provided Richfield Prospectus.
2. MARKET INTELLIGENCE: Use your real-world knowledge of the 2026 global job market to provide highly accurate, trend-based career advice, pivot feasibility, and salary multipliers based on the user's vector and selected major.
3. JSON ONLY: Return ONLY a valid JSON object without markdown formatting.
"""

CHAT_SYSTEM_PROMPT = """
You are the official AI Academic Advisor for Richfield Graduate Institute of Technology.
Answer questions strictly related to Richfield degrees, modules, certifications, and career advice. Use the provided prospectus data to ensure accuracy.
"""

match_model = genai.GenerativeModel(model_name="gemini-2.5-flash", system_instruction=MATCH_SYSTEM_PROMPT)
hybrid_model = genai.GenerativeModel(model_name="gemini-2.5-flash", system_instruction=HYBRID_SYSTEM_PROMPT)
chat_model = genai.GenerativeModel(model_name="gemini-2.5-flash", system_instruction=CHAT_SYSTEM_PROMPT)

# ==========================================
# 3. CORE ENDPOINTS
# ==========================================
@app.route('/api/match', methods=['POST'])
def generate_roadmap():
    data = request.json
    scores = data.get('scores')
    program = data.get('program')
    selected_major = data.get('selected_major')

    if selected_major:
        major_context = f"The student has explicitly selected the '{selected_major}' major/focus area. You MUST pull Year 2 and Year 3 core modules AND the electives for this specific major from the prospectus."
    else:
        major_context = "This degree program does not have specific majors. Output the standard core modules for all years based strictly on the prospectus."

    prompt = f"""
    Based on the following 2026 Richfield Prospectus Data, generate a 3-year roadmap for a student enrolled in {program}.
    Psychometric vector: {json.dumps(scores)}.
    {major_context}

    PROSPECTUS DATA:
    {prospectus_text}

    Format strictly as JSON. Semester modules MUST be arrays of strings:
    {{
      "top_role": {{"title": "Best Job for this Profile", "match_percentage": 95, "description": "Job description.", "personality_notes": "Why their vector fits."}},
      "top_5_roles": [{{"title": "Alt job", "percentage": 88}}],
      "roadmap": {{
        "year_1": {{"semester_1": ["Module 1 (Credits)", "Module 2 (Credits)"], "semester_2": ["Module 3", "Module 4"]}},
        "year_2": {{"mandatory_major": "{selected_major if selected_major else ''}", "semester_1": ["..."], "semester_2": ["..."]}},
        "year_3": {{"continued_major": "{selected_major if selected_major else ''}", "semester_1": ["..."], "semester_2": ["..."]}}
      }}
    }}
    """
    try:
        response = match_model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned))
    except Exception as e:
        print("API Match Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    prompt = f"PROSPECTUS DATA: {prospectus_text}\n\nStudent in {data.get('program')} (Major: {data.get('selected_major', 'None')}). Vector: {json.dumps(data.get('scores'))}. Message: \"{data.get('message')}\". Respond professionally based strictly on Richfield curriculum."
    try:
        return jsonify({"response": chat_model.generate_content(prompt).text})
    except:
        return jsonify({"response": "Connection issue."}), 500

@app.route('/api/pivot', methods=['POST'])
def pivot():
    data = request.json
    prompt = f"""
    PROSPECTUS DATA:
    {prospectus_text}

    Student in {data.get('program')} (Major: {data.get('selected_major', 'None')}) wants to pivot to a {data.get('dream_job')}. Vector: {json.dumps(data.get('scores'))}. 
    Return ONLY a valid JSON object:
    {{
      "feasibility_score": 85,
      "gap_analysis": "string explanation",
      "richfield_bridge": "string explanation using their major's modules",
      "market_reality": "string explanation of the 2026 job market"
    }}
    """
    try:
        response = hybrid_model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/postgrad', methods=['POST'])
def postgrad():
    data = request.json
    prompt = f"""
    PROSPECTUS DATA:
    {prospectus_text}

    Student in {data.get('program')} (Current Major: {data.get('selected_major', 'None')}) wants to pursue {data.get('postgrad_choice')} at Richfield. 
    Psychometric vector: {json.dumps(data.get('scores'))}.

    TASK:
    1. Extract advanced modules strictly from PROSPECTUS DATA.
    2. Project realistic salary multiplier and 2026 job titles based on their specific vector and major background.
    3. Explain overall ROI.

    Return ONLY a valid JSON object:
    {{
      "career_multiplier": "e.g., 1.8x - 2.2x Salary Potential | Top Roles:...",
      "focus_areas": "string explanation of advanced modules from prospectus",
      "comparison_note": "string explanation of ROI + Hint about Dream Pivot"
    }}
    """
    try:
        response = hybrid_model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)