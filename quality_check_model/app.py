"""
Floorplan AI Assistant Application

Provides both:
1. FastAPI endpoints for HTTP server
2. CLI for local testing
"""

from fastapi import FastAPI, UploadFile, File
import shutil
import os
import json
import sys

from pydantic import BaseModel
from typing import Optional, Dict, Any

from quality_check_model.pipeline import run_pipeline
from quality_check_model.floorplan_ai_assistant import (
    ask_floorplan_assistant,
    reset_conversation
)

# ================================================
# FastAPI Application
# ================================================

app = FastAPI(
    title="ArchIntel",
    description="Analyze floorplans with AI",
    version="1.0"
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------
# Upload + Process Floorplan
# ---------------------------
@app.post("/analyze/")
async def analyze_floorplan(file: UploadFile = File(...)):
    """
    Upload and analyze a floorplan SVG.
    
    Returns:
        - parsed: Parsed floorplan structure
        - features: Computed design features
        - dqi: Design Quality Index (0-1)
        - quality_class: Quality classification
        - suggestions: Design improvement suggestions
    """
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run full pipeline
    result = run_pipeline(file_path, verbose=True)

    return {
        "message": "Analysis complete",
        "pipeline_result": result
    }


# ---------------------------
# Ask Questions
# ---------------------------
class AskRequest(BaseModel):
    question: str
    plan_id: Optional[int] = None
    pipeline_result: Optional[Dict[str, Any]] = None


@app.post("/ask/")
async def ask_question(request: AskRequest):
    """
    Ask a question about the floorplan.
    
    Two modes:
    1. Legacy: Provide plan_id (from dataset)
    2. Live: Provide pipeline_result (from /analyze endpoint)
    """
    
    if not request.question:
        return {"error": "question parameter required"}
    
    if request.pipeline_result:
        source = request.pipeline_result
    elif request.plan_id is not None:
        source = request.plan_id
    else:
        return {"error": "Either plan_id or pipeline_result required"}
    
    try:
        answer = ask_floorplan_assistant(source, request.question)
        return {"answer": answer}
    except Exception as e:
        return {"error": str(e)}


# ================================================
# CLI Interface
# ================================================

def cli_main():
    """
    Interactive CLI for testing the full pipeline.
    
    Flow:
    1. Ask for SVG file path
    2. Run pipeline → compute features & DQI
    3. Show summary (rooms, DQI, issues)
    4. Allow Q&A loop with LLM
    """
    
    print("\n" + "="*60)
    print("  FLOORPLAN AI ASSISTANT - Interactive Mode")
    print("="*60 + "\n")
    
    # =============================================
    # Step 1: Get SVG path
    # =============================================

    svg_path = input("Enter SVG file path: ")

    # Clean input
    svg_path = svg_path.strip().replace('"', '')

    # 🔥 FIX 1: Convert Git Bash path → Windows path
    if svg_path.startswith("/c/"):
        svg_path = "C:\\" + svg_path[3:].replace("/", "\\")

    # 🔥 FIX 2: Convert backslashes properly
    svg_path = os.path.normpath(svg_path)

    # Debug
    print("\n[DEBUG]")
    print("CWD:", os.getcwd())
    print("Resolved Path:", svg_path)

    # 🔥 FIX 3: Check existence
    if not os.path.exists(svg_path):
        print(f"\n❌ Error: File not found: {svg_path}")
        return

    print("\n✅ File found:", svg_path)
        
    # =============================================
    # Step 2: Run pipeline
    # =============================================
    
    print("\nProcessing floorplan...")
    
    try:
        result = run_pipeline(svg_path, verbose=True)
    except Exception as e:
        print(f"Error processing floorplan: {str(e)}")
        return
    
    # =============================================
    # Step 3: Show summary
    # =============================================
    
    print("\n" + "="*60)
    print("  ANALYSIS SUMMARY")
    print("="*60)
    
    summary = result.get("summary", {})
    num_rooms = summary.get("num_rooms", 0)
    dqi_score = summary.get("dqi_score", 0)
    quality = summary.get("quality_class", "Unknown")
    issues = summary.get("issues_detected", 0)
    
    print(f"\nRooms detected:        {num_rooms}")
    print(f"Total area:            {summary.get('total_area', 0):.2f}")
    print(f"DQI Score:             {dqi_score:.2f}/10")
    print(f"Quality Class:         {quality}")
    print(f"Issues detected:       {issues}")
    
    # Show suggestions
    suggestions = result.get("suggestions", [])
    if suggestions:
        print(f"\nTop Design Issues:")
        for i, sug in enumerate(suggestions[:5], 1):
            print(f"  {i}. {sug.get('issue', 'Unknown')}")
    
    # =============================================
    # Step 4: Q&A Loop
    # =============================================
    
    print("\n" + "="*60)
    print("  ASK QUESTIONS (type 'exit' to quit)")
    print("="*60 + "\n")
    
    reset_conversation()
    
    while True:
        question = input("You: ").strip()
        
        if not question:
            continue
        
        if question.lower() in ["exit", "quit", "bye"]:
            print("Exiting... Goodbye!")
            break
        
        try:
            answer = ask_floorplan_assistant(result, question)
            print(f"\nAssistant:\n{answer}\n")
        except Exception as e:
            print(f"Error: {str(e)}\n")


if __name__ == "__main__":
    
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        # Run CLI mode
        cli_main()
    else:
        # Run FastAPI server
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)