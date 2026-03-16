import pandas as pd
import json
import numpy as np
import os

from quality_check_model.suggestion_engine import generate_suggestions


# -------------------------------
# Load dataset
# -------------------------------

df = pd.read_csv("quality_check_model/dataset_with_dqi.csv")


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


dataset_stats = compute_dataset_statistics(df)


# -------------------------------
# Feature importance
# -------------------------------

feature_importance = pd.read_csv("quality_check_model/feature_importance.csv")

feature_importance = feature_importance.sort_values(
    by="Importance",
    ascending=False
)

feature_importance_records = feature_importance.to_dict(orient="records")


# -------------------------------
# Load parsed floorplan JSON
# -------------------------------

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


# -------------------------------
# Summarize parsed geometry
# -------------------------------

def summarize_parsed_data(data):

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


# -------------------------------
# Floorplan metrics
# -------------------------------

def get_floorplan_metrics(plan_id):

    row = df[df["plan_id"] == plan_id]

    if row.empty:
        print("Plan ID not found in dataset:", plan_id)
        return {}

    return row.iloc[0].to_dict()


# -------------------------------
# Build LLM context
# -------------------------------

def build_floorplan_context(plan_id):

    metrics = get_floorplan_metrics(plan_id)

    parsed_data = load_parsed_floorplan(plan_id)

    parsed_summary = summarize_parsed_data(parsed_data)

    if metrics is None:
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