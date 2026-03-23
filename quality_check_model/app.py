"""
Main FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from quality_check_model.api.routes import router

app = FastAPI(
    title="ArchIntel",
    description="Analyze floorplans with AI",
    version="1.0"
)

# ======================================
# CORS
# ======================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================
# Register Routes
# ======================================

app.include_router(router)


# ======================================
# CLI MODE (UNCHANGED)
# ======================================

import sys

from quality_check_model.pipeline import run_pipeline
from quality_check_model.floorplan_ai_assistant import (
    ask_floorplan_assistant,
    reset_conversation
)

import os


def cli_main():

    print("\n" + "="*60)
    print("  FLOORPLAN AI ASSISTANT - Interactive Mode")
    print("="*60 + "\n")

    svg_path = input("Enter SVG file path: ")

    svg_path = svg_path.strip().replace('"', '')

    if svg_path.startswith("/c/"):
        svg_path = "C:\\" + svg_path[3:].replace("/", "\\")

    svg_path = os.path.normpath(svg_path)

    print("\n[DEBUG]")
    print("CWD:", os.getcwd())
    print("Resolved Path:", svg_path)

    if not os.path.exists(svg_path):
        print(f"\n❌ Error: File not found: {svg_path}")
        return

    print("\n✅ File found:", svg_path)

    print("\nProcessing floorplan...")

    try:
        result = run_pipeline(svg_path)
    except Exception as e:
        print(f"Error processing floorplan: {str(e)}")
        return

    print("\nAnalysis complete.")

    reset_conversation()

    while True:

        question = input("You: ").strip()

        if question.lower() in ["exit", "quit"]:
            break

        answer = ask_floorplan_assistant(
            result,
            question
        )

        print(answer)


if __name__ == "__main__":

    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        cli_main()

    else:
        import uvicorn

        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000
        )