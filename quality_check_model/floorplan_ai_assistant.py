import json
import os
from dotenv import load_dotenv
from groq import Groq

from quality_check_model.context_builder import (
    build_floorplan_context,
    build_floorplan_context_live,
    summarize_parsed_data
)

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# conversation memory
conversation_history = []


def build_prompt(context, question):
    """
    Construct the LLM prompt with floorplan context.
    
    Args:
        context (dict): Context from context_builder
        question (str): User's question about the floorplan
        
    Returns:
        str: Formatted prompt for the LLM
    """

    metrics = context.get("metrics", {})
    parsed = context.get("parsed_floorplan") or {}
    suggestions = context.get("suggestions", [])
    feature_importance = context.get("feature_importance", [])

    rooms = parsed.get("rooms", [])
    windows = parsed.get("windows", [])

    # -----------------------------
    # Architectural room categories
    # -----------------------------
    habitable_types = [
        "bedroom",
        "livingroom",
        "kitchen",
        "bath",
        "entry",
        "draughtlobby"
    ]

    # -----------------------------
    # Room calculations
    # -----------------------------
    total_rooms = len(rooms)

    habitable_rooms = [
        r for r in rooms if r.get("type") in habitable_types
    ]

    habitable_room_count = len(habitable_rooms)

    habitable_room_types = list(set(
        r["type"] for r in habitable_rooms
    ))

    # -----------------------------
    # Largest room detection
    # -----------------------------
    largest_room = None
    if rooms:
        largest_room = max(rooms, key=lambda r: r.get("area", 0))

    largest_room_info = {
        "type": largest_room["type"],
        "area": largest_room["area"]
    } if largest_room else None

    # -----------------------------
    # Window count
    # -----------------------------
    window_count = len(windows)

    # -----------------------------
    # Structured summary
    # -----------------------------
    summary = {
        "total_rooms": total_rooms,
        "habitable_room_count": habitable_room_count,
        "habitable_room_types": habitable_room_types,
        "largest_room": largest_room_info,
        "window_count": window_count,
        "dqi": metrics.get("DQI"),
        "quality_class": metrics.get("quality_class")
    }

    prompt = f"""
You are an architectural design analysis assistant.

You must answer questions using ONLY the provided floorplan data.

-----------------------------------
FLOORPLAN SUMMARY
-----------------------------------

{json.dumps(summary, indent=2)}

-----------------------------------
FLOORPLAN METRICS
-----------------------------------

{json.dumps(metrics, indent=2)}

-----------------------------------
FLOORPLAN STRUCTURE
-----------------------------------

{json.dumps(parsed, indent=2)}

-----------------------------------
DETECTED DESIGN ISSUES
-----------------------------------

{json.dumps(suggestions, indent=2)}

-----------------------------------
IMPORTANT DESIGN FACTORS
(Top important features)
-----------------------------------

{json.dumps(feature_importance[:8], indent=2)}

-----------------------------------

User Question:
{question}

Provide a concise architectural response.

Important rules:

1. Answer ONLY the user's question.
2. Do NOT provide extra analysis unless asked.

3. Use the correct data source:

   • Room counts → FLOORPLAN SUMMARY  
   • Metrics like DQI, efficiency, compactness → FLOORPLAN METRICS  
   • Layout / room relationships → FLOORPLAN STRUCTURE  
   • Improvements → DETECTED DESIGN ISSUES + METRICS

4. Never infer counts from ratios.

5. If information is not available, say:
   "Information not available in the floorplan dataset."

Response Guidelines:

• Metric question → return only the value and label  
• Analysis question → short explanation  
• Improvement question → suggestions + reference the metrics used

Keep responses concise and relevant.
"""

    return prompt


def ask_floorplan_assistant(source, question):
    """
    Ask the floorplan assistant a question.
    
    Supports two modes:
    1. Legacy dataset-based: source = plan_id (int)
    2. Live pipeline-based: source = pipeline_output (dict)
    
    Args:
        source: Either plan_id (int) or pipeline_output (dict)
        question (str): User's question about the floorplan
        
    Returns:
        str: Assistant's response
        
    Example (legacy):
        >>> answer = ask_floorplan_assistant(42, "How many rooms?")
        
    Example (live):
        >>> from quality_check_model.pipeline import run_pipeline
        >>> result = run_pipeline("floor.svg")
        >>> answer = ask_floorplan_assistant(result, "How many rooms?")
    """
    
    # ===================================
    # Determine input type
    # ===================================
    
    if isinstance(source, dict):
        # Live pipeline output
        context = build_floorplan_context_live(source)
    elif isinstance(source, int):
        # Legacy plan_id
        context = build_floorplan_context(source)
    else:
        raise ValueError(
            "source must be either plan_id (int) or pipeline_output (dict)"
        )
    
    # ===================================
    # Build prompt and get response
    # ===================================
    
    prompt = build_prompt(context, question)

    # store user question
    conversation_history.append({
        "role": "user",
        "content": question
    })

    messages = [
        {
            "role": "system",
            "content": prompt
        }
    ] + conversation_history

    response = client.chat.completions.create(

        model="llama-3.3-70b-versatile",

        messages=messages,

        temperature=0.2
    )

    answer = response.choices[0].message.content

    # store assistant response
    conversation_history.append({
        "role": "assistant",
        "content": answer
    })

    return answer


def reset_conversation():
    """Reset conversation history for a new session."""
    global conversation_history
    conversation_history = []


# ===================================
# Legacy CLI (dataset-based)
# ===================================

if __name__ == "__main__":

    plan_id = int(input("Enter plan ID: "))

    while True:

        question = input("\nAsk a question about the floorplan: ")

        if question.lower() in ["exit", "quit"]:
            reset_conversation()
            print("Exiting...")
            break

        answer = ask_floorplan_assistant(plan_id, question)

        print("\nAssistant:\n")
        print(answer)