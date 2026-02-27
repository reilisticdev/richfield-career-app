import os
import json
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) 

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
# 2. SYSTEM INSTRUCTIONS (THE 3 BRAINS)
# ==========================================

# BRAIN 1: STRICT MODEL (For the 3-Year Undergraduate Roadmap)
MATCH_SYSTEM_PROMPT = """
You are an elite, strict academic data extractor for Richfield Graduate Institute of Technology.
CRITICAL DIRECTIVES:
1. ZERO HALLUCINATION: Extract module names, course codes, and credit weights EXACTLY character-for-character as they appear in the provided Richfield 2026 Prospectus text. 
2. EXACT FORMATTING: E.g., "Programming 511 (15 Credits)". Do not paraphrase.
3. STRICT ACCURACY: Only pull the exact modules listed under the student's specific degree for the correct semester and year.
4. JSON ONLY: Return ONLY a valid JSON object without any markdown formatting (no ```json).
"""

# BRAIN 2: HYBRID MODEL (For Pivot and Postgrad - Combines PDF Curriculum with 2026 Global Job Market data)
HYBRID_SYSTEM_PROMPT = """
You are an elite Career Strategist and Academic Advisor for Richfield.
CRITICAL DIRECTIVES:
1. ACADEMIC STRICTNESS: For module names and curriculum details, extract EXACTLY from the provided Richfield Prospectus. Do not hallucinate curriculum.
2. MARKET INTELLIGENCE: For career projections, job titles, and salary multipliers, actively use your advanced knowledge of the 2026 global job market. Provide highly accurate, trend-based career advice based on the user's psychometric vector.
3. JSON ONLY: Return ONLY a valid JSON object without any markdown formatting (no ```json).
"""

# BRAIN 3: CHATBOT MODEL
CHAT_SYSTEM_PROMPT = """
You are the official AI Academic Advisor for Richfield Graduate Institute of Technology.
Answer questions strictly related to Richfield degrees, modules, certifications, and career advice. Use the provided prospectus data to ensure accuracy. Reject off-topic questions politely. Maintain a premium, professional tone.
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

    prompt = f"""
    Based on the following 2026 Richfield Prospectus Data, generate a 3-year academic and career roadmap for a student enrolled in {program}.
    Psychometric vector: {json.dumps(scores)}.

    PROSPECTUS DATA:
    {prospectus_text}

    Format strictly as JSON:
    {{
      "top_role": {{"title": "Best Job Title", "match_percentage": 95, "description": "Job description.", "personality_notes": "Why their vector fits."}},
      "top_5_roles": [{{"title": "Alt job", "percentage": 88}}],
      "roadmap": {{
        "year_1": {{"semester_1": "List exact modules and credits", "semester_2": "List exact modules and credits"}},
        "year_2": {{"mandatory_major": "Major choice", "semester_1": "Modules", "semester_2": "Modules"}},
        "year_3": {{"continued_major": "Major continued", "semester_1": "Modules", "semester_2": "Modules"}}
      }}
    }}
    """
    try:
        response = match_model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    prompt = f"PROSPECTUS DATA: {prospectus_text}\n\nStudent in {data.get('program')}. Vector: {json.dumps(data.get('scores'))}. Message: \"{data.get('message')}\". Respond professionally based strictly on Richfield curriculum."
    try:
        return jsonify({"response": chat_model.generate_content(prompt).text})
    except:
        return jsonify({"response": "Connection issue. Try again."}), 500

@app.route('/api/pivot', methods=['POST'])
def pivot():
    data = request.json
    prompt = f"""
    PROSPECTUS DATA:
    {prospectus_text}

    Student in {data.get('program')} wants to pivot to a {data.get('dream_job')}. Vector: {json.dumps(data.get('scores'))}. 
    Based on the prospectus data and their current degree, return ONLY a valid JSON object with the exact keys:
    {{
      "feasibility_score": 85,
      "gap_analysis": "string explanation",
      "richfield_bridge": "string explanation using prospectus modules",
      "market_reality": "string explanation of the 2026 job market for this role"
    }}
    """
    try:
        # Notice we are now using the Hybrid Model here!
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

    Student in {data.get('program')} wants to pursue {data.get('postgrad_choice')} at Richfield. 
    Psychometric vector: {json.dumps(data.get('scores'))}.

    TASK:
    1. For "focus_areas": Extract the advanced modules/curriculum for {data.get('postgrad_choice')} STRICTLY from the PROSPECTUS DATA.
    2. For "career_multiplier": Use your real-world knowledge of the 2026 tech and business job market. Project a realistic salary multiplier (e.g., 1.5x - 2.5x) AND list 2-3 specific high-paying 2026 job titles that perfectly match both this postgrad degree and the student's psychometric vector.
    3. For "comparison_note": Explain the overall Return on Investment (ROI) of this degree and INCLUDE a short hint reminding the user that they can use the "Dream Pivot" tab to calculate the exact feasibility of transitioning into these senior roles.

    Return ONLY a valid JSON object with the exact keys:
    {{
      "career_multiplier": "e.g., 1.8x - 2.2x Salary Potential | Top 2026 Roles: Senior AI Engineer, Enterprise Architect",
      "focus_areas": "string explanation of advanced modules from the prospectus",
      "comparison_note": "string explanation of ROI + 'Hint: Use the Dream Pivot tab to test your transition into these senior roles!'"
    }}
    """
    try:
        # Notice we are now using the Hybrid Model here too!
        response = hybrid_model.generate_content(prompt)
        cleaned = response.text.replace('```json', '').replace('```', '').strip()
        return jsonify(json.loads(cleaned))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)