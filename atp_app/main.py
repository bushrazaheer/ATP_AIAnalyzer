from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from engine import analyze_lab_image

app = FastAPI()

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), subject: str = Form("chemistry")):
    try:
        content = await file.read()
        result = await analyze_lab_image(content, file.content_type, subject)
        
        # Flatten the result so React can see 'detections' immediately
        return {
            "status": "success",
            **result 
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message": str(e)}
if __name__ == "__main__":
    import uvicorn
    # Force 127.0.0.1 to stop the 'Site can't be reached' browser error
    uvicorn.run(app, host="127.0.0.1", port=8000)