import pandas as pd
import json
import numpy as np
import os

from quality_check_model.suggestion_engine import generate_suggestions


# ================================================================
# DATASET-BASED FUNCTIONS (Legacy - for existing workflow)
# ================================================================

# Load dataset
try:
    df = pd.read_csv("quality_check_model/dataset_with_dqi.csv")
except:
    df = pd.DataFrame()


def compute_dataset_statistics(df):

    stats = {}

    numeric_cols = df.select_dtypes(include=np.number).columns

    for col in numeric_cols:

        stats[col] = {
            "mean": df[col].mean(),
            "min": df[col].min(),
            "max": df[col].max()
        }

    return stats


try:
    dataset_stats = compute_dataset_statistics(df)
except:
    dataset_stats = {}


# Load feature importance
try:
    feature_importance = pd.read_csv("quality_check_model/feature_importance.csv")
    feature_importance = feature_importance.sort_values(
        by="Importance",
        ascending=False
    )
    feature_importance_records = feature_importance.to_dict(orient="records")
except:
    feature_importance_records = []


# ================================================================
# Load parsed floorplan JSON
# ================================================================

def load_parsed_floorplan(plan_id):

    project_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )

    file_path = os.path.join(
        project_root,
        "quality_check_model",
        "parsed_floorplans",
        f"{plan_id}.json"
    )

    print("Looking for parsed floorplan at:", file_path)

    if not os.path.exists(file_path):
        print("Parsed floorplan not found:", file_path)
        return {}

    with open(file_path, "r") as f:
        data = json.load(f)

    return data


# ================================================================
# Summarize parsed geometry
# ================================================================

def summarize_parsed_data(data):
    """
    Create a structured summary of parsed floorplan data.
    
    Args:
        data (dict): Parsed floorplan data with rooms, windows, walls
        
    Returns:
        dict: Structured summary of key properties
    """

    if data is None:
        return {}

    rooms = data.get("rooms", [])
    windows = data.get("windows", [])
    walls = data.get("walls", [])

    # -------------------------
    # Room categories
    # -------------------------

    habitable_types = [
        "bedroom",
        "livingroom",
        "kitchen",
        "bath",
        "entry",
        "draughtlobby"
    ]

    habitable_rooms = [
        r for r in rooms if r.get("type") in habitable_types
    ]

    # -------------------------
    # Largest room
    # -------------------------

    largest_room = None

    if rooms:
        largest_room = max(rooms, key=lambda r: r.get("area", 0))

    external_walls = [
        w for w in walls if w.get("type") == "external"
    ]

    summary = {

        "total_rooms": len(rooms),

        "habitable_room_count": len(habitable_rooms),

        "room_types": [r.get("type") for r in rooms],

        "window_count": len(windows),

        "external_wall_count": len(external_walls),

        "largest_room": {
            "type": largest_room.get("type"),
            "area": largest_room.get("area")
        } if largest_room else None
    }

    return summary


# ================================================================
# DATASET-BASED WORKFLOW (Legacy)
# ================================================================

def get_floorplan_metrics(plan_id):
    """Retrieve metrics for a plan from the dataset."""

    row = df[df["plan_id"] == plan_id]

    if row.empty:
        print("Plan ID not found in dataset:", plan_id)
        return {}

    return row.iloc[0].to_dict()


def build_floorplan_context(plan_id):
    """
    Build LLM context from dataset-based metrics (Legacy).
    
    This function loads pre-computed metrics from CSV and uses them
    to construct context for the LLM assistant.
    
    Args:
        plan_id (int): Plan ID to look up in the dataset
        
    Returns:
        dict: Context dictionary with all information for LLM
    """

    metrics = get_floorplan_metrics(plan_id)

    parsed_data = load_parsed_floorplan(plan_id)

    parsed_summary = summarize_parsed_data(parsed_data)

    if metrics is None or len(metrics) == 0:
        suggestions = []
    else:
        suggestions = generate_suggestions(metrics)

    context = {

        "metrics": metrics,

        # FULL JSON for spatial reasoning
        "parsed_floorplan": parsed_data,

        # structured facts for reliability
        "parsed_summary": parsed_summary,

        "dataset_statistics": dataset_stats,

        "feature_importance": feature_importance_records,

        "suggestions": suggestions
    }

    return context


# ================================================================
# LIVE PIPELINE WORKFLOW (New)
# ================================================================

def build_floorplan_context_live(pipeline_output):
    """
    Build LLM context from live pipeline output.
    
    This function takes the output from the pipeline and constructs
    context for the LLM assistant without requiring pre-computed datasets.
    
    Use this for:
    - Real-time SVG uploads
    - Dynamic floorplan analysis
    - On-demand feature computation
    
    Args:
        pipeline_output (dict): Output from pipeline.run_pipeline():
                              {
                                  "plan_id": string,
                                  "parsed": dict,
                                  "features": dict,
                                  "dqi": float,
                                  "quality_class": string,
                                  "suggestions": list
                              }
        
    Returns:
        dict: Context dictionary with all information for LLM:
              {
                  "metrics": dict,              # All computed features
                  "parsed_floorplan": dict,     # Parsed SVG structure
                  "parsed_summary": dict,       # Structured summary
                  "feature_importance": list,   # Top important features
                  "suggestions": list           # Design issues found
              }
    """
    
    # Extract components from pipeline output
    features = pipeline_output.get("features", {})
    parsed_data = pipeline_output.get("parsed", {})
    suggestions = pipeline_output.get("suggestions", [])
    
    # Create structured summary
    parsed_summary = summarize_parsed_data(parsed_data)
    
    # Get feature importance (rank features by absolute value)
    feature_importance = _compute_live_feature_importance(features)
    
    # Build metrics dictionary (with DQI and quality class)
    metrics = {
        **features,
        "DQI": pipeline_output.get("dqi", 0),
        "quality_class": pipeline_output.get("quality_class", "Unknown")
    }
    
    # Construct context
    context = {
        "metrics": metrics,
        
        # FULL JSON for spatial reasoning
        "parsed_floorplan": parsed_data or {},
        
        # Structured facts for reliability
        "parsed_summary": parsed_summary,
        
        # Feature importance from live computation
        "feature_importance": feature_importance,
        
        # Design suggestions/issues
        "suggestions": suggestions
    }
    
    return context


def _compute_live_feature_importance(features):
    """
    Compute feature importance from live pipeline features.
    
    Ranks features by their absolute value as a simple heuristic.
    
    Args:
        features (dict): Computed features from pipeline
        
    Returns:
        list: List of dicts with 'Feature' and 'Importance' keys
    """
    
    # Select key features for importance ranking
    important_keys = [
        "DQI",
        "efficiency",
        "corridor_ratio",
        "window_wall_ratio",
        "avg_compactness",
        "integration",
        "public_private_separation",
        "rooms_with_window_ratio",
        "cross_ventilation_ratio",
        "avg_rectangularity",
        "mean_depth",
        "integration"
    ]
    
    importance_list = []
    
    for key in important_keys:
        if key in features:
            val = features[key]
            if isinstance(val, (int, float)):
                importance_list.append({
                    "Feature": key,
                    "Importance": float(abs(val))
                })
    
    # Sort by importance (descending)
    importance_list.sort(key=lambda x: x["Importance"], reverse=True)
    
    # Return top 10
    return importance_list[:10]