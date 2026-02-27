import os
import json
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) 

# Configure Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# ==========================================
# LOAD THE PROSPECTUS PDF (BULLETPROOF PATH)
# ==========================================
prospectus_text = ""
try:
    # This automatically finds the exact folder this app.py file is sitting in
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # This securely builds the path to your PDF inside the data folder
    pdf_path = os.path.join(base_dir, 'data', 'Richfield_2026 Prospectus_28 Oct.pdf')
    
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                prospectus_text += text + "\n"
    print("SUCCESS: Prospectus PDF loaded correctly into the AI's memory!")
except FileNotFoundError:
    print(f"WARNING: Prospectus PDF not found at {pdf_path}")
    prospectus_text = "Prospectus data not found."


# ==========================================
# ENTERPRISE SYSTEM INSTRUCTIONS
# ==========================================

MATCH_SYSTEM_PROMPT = """
You are an elite, strict academic data extractor and systems architect for Richfield Graduate Institute of Technology.

CRITICAL DIRECTIVES:
1. ZERO HALLUCINATION: You MUST extract module names, course codes, NQF levels, and credit weights EXACTLY character-for-character as they appear in the provided Richfield 2026 Prospectus text. 
2. EXACT FORMATTING: When listing a module, include the module name, course code, and credit weight exactly as found in the prospectus tables (e.g., "Programming 511 (15 Credits)"). Do not paraphrase or simplify.
3. STRICT ACCURACY: If a student selects a specific degree, only pull the exact modules listed under that degree for the correct semester and year. Do not add modules that are not in the official text.
4. JSON ONLY: You must return ONLY a valid JSON object without any markdown formatting (no ```json).
"""

CHAT_SYSTEM_PROMPT = """
You are the official, professional AI Academic and Career Advisor for Richfield Graduate Institute of Technology.

MANDATORY RULES:
1. STRICT BOUNDARIES: Your ONLY purpose is to answer questions regarding Richfield degrees, IT/Business modules, industry certifications, academic roadmaps, and professional career advice.
2. OFF-TOPIC REJECTION: If a user asks about anything outside of academia, tech, business, or careers, you MUST reply with: "I am a Richfield Academic Advisor. I can only assist you with questions related to your degree, modules, or career trajectory."
3. PROFESSIONAL TONE: You must remain strictly professional, encouraging, and academic. Do not engage with inappropriate language or swearing. Reply ONLY with: "Please maintain a professional tone. How can I assist you with your academic roadmap today?"
4. CONTEXT AWARE: Use the provided student context to give personalized academic advice based ONLY on the Richfield curriculum.
"""

# Initialize Gemini 2.5 Flash with strict guardrails
match_model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=MATCH_SYSTEM_PROMPT
)

chat_model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=CHAT_SYSTEM_PROMPT
)

# ==========================================
# API ROUTES
# ==========================================

@app.route('/api/match', methods=['POST'])
def generate_roadmap():
    data = request.json
    scores = data.get('scores')
    program = data.get('program')

    prompt = f"""
    Based on the following 2026 Richfield Prospectus Data, generate a 3-year academic and career roadmap for a student enrolled in {program}.
    Their psychometric vector scores are: {json.dumps(scores)}.

    PROSPECTUS DATA:
    {prospectus_text}

    Format the output strictly as a JSON object with this exact structure:
    {{
      "top_role": {{"title": "", "match_percentage": 0, "description": "", "personality_notes": ""}},
      "top_5_roles": [{{"title": "", "percentage": 0}}],
      "roadmap": {{
        "year_1": {{"semester_1": "List exact modules and credits here", "semester_2": "List exact modules and credits here"}},
        "year_2": {{"mandatory_major": "", "semester_1": "List exact modules here", "semester_2": "List exact modules here"}},
        "year_3": {{"continued_major": "", "semester_1": "List exact modules here", "semester_2": "List exact modules here"}}
      }}
    }}
    """
    
    try:
        response = match_model.generate_content(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned_response))
    except Exception as e:
        print("Error generating roadmap:", str(e))
        return jsonify({"error": "Failed to generate roadmap"}), 500


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message')
    program = data.get('program')
    scores = data.get('scores')

    prompt = f"""
    Student Context: Enrolled in {program}. Psychometric vector: {json.dumps(scores)}.
    
    Student Message: "{message}"
    
    Respond directly to the student's message using your strict system instructions. Ensure any reference to modules or credits perfectly matches the official Richfield naming conventions.
    """
    
    try:
        response = chat_model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        print("Chat Error:", str(e))
        return jsonify({"response": "I am currently experiencing a connection issue. Please try again."}), 500


@app.route('/api/pivot', methods=['POST'])
def pivot():
    data = request.json
    prompt = f"Student in {data.get('program')} wants to be a {data.get('dream_job')}. Scores: {json.dumps(data.get('scores'))}. Return a JSON with feasibility_score (int), gap_analysis (string), richfield_bridge (string), market_reality (string)."
    
    try:
        response = match_model.generate_content(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned_response))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/postgrad', methods=['POST'])
def postgrad():
    data = request.json
    prompt = f"Student in {data.get('program')} wants to pursue {data.get('postgrad_choice')}. Return a JSON with career_multiplier (string), focus_areas (string), comparison_note (string)."
    
    try:
        response = match_model.generate_content(prompt)
        cleaned_response = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned_response))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)