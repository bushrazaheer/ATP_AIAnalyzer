import json
import os
import re
from google import genai
from google.genai import types
from prompts.chemistry_sme import CHEM_PROMPT
from prompts.biology_sme import BIO_PROMPT
from prompts.physics_sme import PHYS_PROMPT
from dotenv import load_dotenv


def extract_first_line(text):
    if not text:
        return "N/A"
    return str(text).split("\n")[0].strip()


def force_clean_word_equation(text):
    """
    NUCLEAR OPTION: Strip everything except chemical equation format
    """
    if not text:
        return "N/A"
    
    text = str(text).strip()
    
    # Remove common violation patterns FIRST
    banned_phrases = [
        "electrolysis of", "involves", "during", "at the cathode",
        "at the anode", "solution", "with inert", "electrodes",
        "deposition of", "evolution of", "remains in", "the ", "aqueous"
    ]
    
    for phrase in banned_phrases:
        text = text.replace(phrase, "")
    
    # Keep only lines that contain →
    lines = text.split('\n')
    equation_lines = [line for line in lines if '→' in line or '->' in line]
    
    if equation_lines:
        text = equation_lines[0]  # Take first valid equation
    
    # Remove anything after a period (sentences)
    if '.' in text:
        text = text.split('.')[0]
    
    # Remove parenthetical explanations (but keep chemical states)
    import re
    # Remove explanatory parentheticals but keep states like (aq), (s), (l), (g)
    text = re.sub(r'\((?!aq|s|l|g|II|III|IV)\w+[^)]*\)', '', text)
    
    # Clean up whitespace
    text = ' '.join(text.split())
    
    return text.strip()


MODEL_ID = "gemini-2.5-flash"
# Only load .env locally (NOT in Cloud Run)
if os.getenv("K_SERVICE") is None:
    from dotenv import load_dotenv
    load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing")


client = genai.Client(
    api_key=api_key,
    http_options={'api_version': 'v1'} 
)


async def analyze_lab_image(image_bytes, mime_type, subject="chemistry"):

    # 1. Normalize the subject input
    subject = subject.lower().strip() if subject else "chemistry"
    print(f"DEBUG: Selected Subject: '{subject}' | Using Prompt: {'BIO' if subject == 'biology' else 'OTHER'}")
    prompts = {
        "chemistry": CHEM_PROMPT,
        "biology": BIO_PROMPT,
        "physics": PHYS_PROMPT
    }
    
    selected_prompt = prompts.get(subject, CHEM_PROMPT)
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

    # 2. Call the Gemini Model
    response: types.GenerateContentResponse = client.models.generate_content(
        model=MODEL_ID,
        contents=[f"{selected_prompt}\nReturn ONLY raw JSON. Ensure all backslashes are escaped.", image_part]
    )

    # 3. CLEANING LOGIC - This fixes the "Invalid \escape" error
    raw_text = response.text
    print("🔍 ORIGINAL AI RESPONSE:", raw_text[:500])  # Debug log
    
    # Remove potential markdown formatting
    clean_json_string = re.sub(r'```json|```', '', raw_text).strip()

    try:
        # Attempt to parse with strict=False (allows control characters like newlines)
        analysis_data = json.loads(clean_json_string, strict=False)
    except json.JSONDecodeError:
        # Emergency Fallback: Escape backslashes if the AI used LaTeX or stray symbols
        fixed_string = clean_json_string.replace('\\', '\\\\')
        try:
            analysis_data = json.loads(fixed_string, strict=False)
        except Exception as final_error:
            print(f"Final Parsing Failure: {final_error}")
            # Return a structured error so the frontend doesn't crash
            return {"error": "JSON_PARSE_FAILED", "raw_response": raw_text[:100]}

    # 4. SANITIZE STRINGS RECURSIVELY
    def sanitize_data(obj):
        if isinstance(obj, dict):
            return {k: sanitize_data(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize_data(item) for item in obj]
        elif isinstance(obj, str):
            return (
                obj.replace("\\", "\\\\")
                .replace("\n", " ")
                .replace("\t", " ")
            )
        return obj

    analysis_data = sanitize_data(analysis_data)

    # 5. FORCE CLEAN WORD EQUATION - TRIPLE LAYER PROTECTION
    try:
        if "equations" in analysis_data and "word" in analysis_data["equations"]:
            raw_word_eq = analysis_data["equations"]["word"]
            print("🔍 ORIGINAL WORD EQ:", raw_word_eq)  # Debug
            
            # Layer 1: Force clean
            cleaned = force_clean_word_equation(raw_word_eq)
            
            # Layer 2: Remove states if they snuck in (for word equations only)
            cleaned = cleaned.replace('(aq)', '').replace('(s)', '').replace('(l)', '').replace('(g)', '')
            
            # Layer 3: Ensure it's one line
            if '\n' in cleaned:
                cleaned = cleaned.split('\n')[0]
            
            # Layer 4: Remove trailing explanation markers
            cleaned = cleaned.split(',')[0]  # Stop at first comma
            
            # Clean up extra spaces
            cleaned = ' '.join(cleaned.split())
            
            analysis_data["equations"]["word"] = cleaned
            print("✅ CLEANED WORD EQ:", cleaned)  # Debug
            
    except Exception as e:
        print("⚠️ Word equation nuclear clean failed:", e)
        analysis_data["equations"]["word"] = "N/A"

    # 6. FINAL VALIDATION CHECK
    if "equations" in analysis_data and "word" in analysis_data["equations"]:
        word_eq = analysis_data["equations"]["word"]
        
        # If it still contains banned phrases, force fallback
        if any(phrase in word_eq.lower() for phrase in ["electrolysis", "involves", "during", "deposition"]):
            print("⚠️ Word equation still contaminated, forcing generic format")
            analysis_data["equations"]["word"] = "reactant + reactant → product + product"

    # 7. FINAL RETURN
    return {
        "experiment_analysis": analysis_data,
        "status": "success"
    }