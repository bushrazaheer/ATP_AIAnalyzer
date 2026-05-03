import os
import json
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import uvicorn
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. PASTE YOUR NEW API KEY HERE
NEW_API_KEY = "AIzaSyA1YPElj1sOpjftSFKqHaAcqJ3_ZKZBkiM"
client = genai.Client(
    api_key=NEW_API_KEY,
    http_options={'api_version': 'v1'} 
)

# 2. SET TO THE LATEST 2.0 FLASH
MODEL_ID = "models/gemini-2.0-flash-lite"

SYSTEM_PROMPT = """You are an O-Level Science SME. Analyze the lab image and return JSON.
Structure: { "title": "", "apparatus": [], "reagents": [], "safety_precautions": [], 
"steps": [{"text": "", "obs": "", "error_hint": ""}], "results_table": {"title": "", "columns": []} }"""

@app.post("/analyze")
async def analyze_experiment(file: UploadFile = File(...)):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            image_data = await file.read()
            image_part = types.Part.from_bytes(data=image_data, mime_type=file.content_type)
            
            prompt = f"{SYSTEM_PROMPT}\n\nReturn only raw JSON data."

            response = client.models.generate_content(
                model=MODEL_ID,
                contents=[prompt, image_part]
            )
            
            clean_json = response.text.replace('```json', '').replace('```', '').strip()
            return json.loads(clean_json)

        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                print(f"Server busy (Attempt {attempt + 1}). Retrying in 2 seconds...")
                time.sleep(2) # Brief cooldown before retrying
                continue
            
            print(f"Backend Debug: {str(e)}")
            return {"status": "error", "message": "Server is busy. Please try again in a moment."}
    
    
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)