import json
import os
import re
from google import genai
from google.genai import types
from prompts.chemistry_sme import CHEM_PROMPT
from prompts.biology_sme import BIO_PROMPT
from prompts.physics_sme import PHYS_PROMPT
from dotenv import load_dotenv


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

    # 4. FINAL RETURN 
    # This structure ensures the keys exist for your React UI
    return {
        "experiment_analysis": analysis_data,
        "status": "success"
    }