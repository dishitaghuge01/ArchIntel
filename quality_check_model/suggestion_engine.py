def generate_suggestions(features):

    issues = []

    # Circulation efficiency
    if features["corridor_ratio"] > 0.20:
        issues.append({
            "issue": "High corridor ratio",
            "metric": "corridor_ratio",
            "value": features["corridor_ratio"],
            "recommendation": "Reduce corridor length by integrating circulation spaces with living areas."
        })

    # Lighting
    if features["window_wall_ratio"] < 0.30:
        issues.append({
            "issue": "Low window-wall ratio",
            "metric": "window_wall_ratio",
            "value": features["window_wall_ratio"],
            "recommendation": "Increase window openings in primary rooms to improve daylight."
        })

    # Ventilation
    if features["cross_ventilation_ratio"] < 0.25:
        issues.append({
            "issue": "Poor cross ventilation",
            "metric": "cross_ventilation_ratio",
            "value": features["cross_ventilation_ratio"],
            "recommendation": "Provide openings on opposite walls to allow cross ventilation."
        })

    # Room proportions
    if features["avg_aspect_ratio"] > 2:
        issues.append({
            "issue": "Elongated room shapes",
            "metric": "avg_aspect_ratio",
            "value": features["avg_aspect_ratio"],
            "recommendation": "Design rooms closer to rectangular proportions."
        })

    # Spatial efficiency
    if features["efficiency"] < 0.75:
        issues.append({
            "issue": "Low space efficiency",
            "metric": "efficiency",
            "value": features["efficiency"],
            "recommendation": "Reduce circulation and service spaces to increase usable area."
        })

    # Zoning
    if features["public_private_separation"] < 0.5:
        issues.append({
            "issue": "Weak public-private zoning",
            "metric": "public_private_separation",
            "value": features["public_private_separation"],
            "recommendation": "Separate private rooms from public living areas."
        })

    # Bathroom adjacency
    if features["bathroom_adjacency"] < 0.5:
        issues.append({
            "issue": "Poor bathroom adjacency",
            "metric": "bathroom_adjacency",
            "value": features["bathroom_adjacency"],
            "recommendation": "Place bathrooms closer to bedrooms for functional convenience."
        })

    # Window availability
    if features["rooms_with_window_ratio"] < 0.7:
        issues.append({
            "issue": "Insufficient window access",
            "metric": "rooms_with_window_ratio",
            "value": features["rooms_with_window_ratio"],
            "recommendation": "Ensure most habitable rooms have access to external windows."
        })

    # Spatial integration
    if features["integration"] < 0.4:
        issues.append({
            "issue": "Low spatial integration",
            "metric": "integration",
            "value": features["integration"],
            "recommendation": "Improve connectivity between spaces to reduce circulation depth."
        })

    # Room compactness
    if features["avg_compactness"] < 0.6:
        issues.append({
            "issue": "Poor room compactness",
            "metric": "avg_compactness",
            "value": features["avg_compactness"],
            "recommendation": "Design more compact room geometries to improve usability."
        })

    return issues