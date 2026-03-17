"""
Design Quality Index (DQI) Calculation Module

Computes DQI scores for floorplans based on 5 key dimensions:
- E: Efficiency (efficiency, corridor_ratio, avg_room_area)
- Z: Zoning (public_private_separation, bathroom_adjacency, service_area_ratio)
- L: Lighting & Ventilation (rooms_with_window_ratio, cross_ventilation_ratio, window_wall_ratio)
- P: Proportions & Compactness (avg_compactness, avg_rectangularity, avg_aspect_ratio)
- C: Circulation & Integration (integration, mean_depth, avg_shortest_path)

DQI = 0.25*E + 0.20*Z + 0.20*L + 0.15*P + 0.20*C
Score = DQI * 10
"""

import numpy as np


def safe_get(features, key, default=0.5):
    """
    Safely retrieve feature value with default fallback.
    """
    val = features.get(key, default)
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    return float(val)


def categorize_score(score):
    """
    Categorize floorplan quality based on DQI score (0-10).
    """
    if score < 4:
        return "Poor"
    elif score < 6:
        return "Average"
    elif score < 8:
        return "Good"
    else:
        return "Excellent"


def compute_dqi(features):
    """
    Compute Design Quality Index (DQI) and quality class.
    
    Args:
        features (dict): Dictionary containing design metrics
        
    Returns:
        tuple: (dqi_score, quality_class)
        
    Example:
        >>> features = {
        ...     "efficiency": 0.8,
        ...     "corridor_ratio": 0.15,
        ...     "avg_room_area": 25,
        ...     "public_private_separation": 0.6,
        ...     "bathroom_adjacency": 0.7,
        ...     "service_area_ratio": 0.1,
        ...     "rooms_with_window_ratio": 0.8,
        ...     "cross_ventilation_ratio": 0.5,
        ...     "window_wall_ratio": 0.35,
        ...     "avg_compactness": 0.7,
        ...     "avg_rectangularity": 0.75,
        ...     "avg_aspect_ratio": 1.2,
        ...     "integration": 0.5,
        ...     "mean_depth": 3.0,
        ...     "avg_shortest_path": 2.5
        ... }
        >>> dqi, quality = compute_dqi(features)
    """
    
    # -----------------------------------------------
    # E: EFFICIENCY
    # -----------------------------------------------
    efficiency = safe_get(features, "efficiency", 0.75)
    corridor_ratio = safe_get(features, "corridor_ratio", 0.15)
    avg_room_area = safe_get(features, "avg_room_area", 25)
    
    # Normalize avg_room_area to [0,1] range (assume 50 is max)
    normalized_room_area = min(avg_room_area / 50, 1.0)
    
    E = (efficiency + (1 - corridor_ratio) + normalized_room_area) / 3
    
    # -----------------------------------------------
    # Z: ZONING
    # -----------------------------------------------
    public_private_separation = safe_get(features, "public_private_separation", 0.5)
    bathroom_adjacency = safe_get(features, "bathroom_adjacency", 0.5)
    service_area_ratio = safe_get(features, "service_area_ratio", 0.15)
    
    Z = (public_private_separation + bathroom_adjacency + (1 - service_area_ratio)) / 3
    
    # -----------------------------------------------
    # L: LIGHTING & VENTILATION
    # -----------------------------------------------
    rooms_with_window_ratio = safe_get(features, "rooms_with_window_ratio", 0.7)
    cross_ventilation_ratio = safe_get(features, "cross_ventilation_ratio", 0.3)
    window_wall_ratio = safe_get(features, "window_wall_ratio", 0.3)
    
    L = (rooms_with_window_ratio + cross_ventilation_ratio + window_wall_ratio) / 3
    
    # -----------------------------------------------
    # P: PROPORTIONS & COMPACTNESS
    # -----------------------------------------------
    avg_compactness = safe_get(features, "avg_compactness", 0.7)
    avg_rectangularity = safe_get(features, "avg_rectangularity", 0.7)
    avg_aspect_ratio = safe_get(features, "avg_aspect_ratio", 1.2)
    
    # Aspect ratio should be close to 1 (square), so invert
    normalized_aspect_ratio = max(0, 1 - abs(avg_aspect_ratio - 1) / 2)
    
    P = (avg_compactness + avg_rectangularity + normalized_aspect_ratio) / 3
    
    # -----------------------------------------------
    # C: CIRCULATION & INTEGRATION
    # -----------------------------------------------
    integration = safe_get(features, "integration", 0.4)
    mean_depth = safe_get(features, "mean_depth", 3.0)
    avg_shortest_path = safe_get(features, "avg_shortest_path", 2.5)
    
    # Normalize depth and path length to [0,1] range
    normalized_depth = max(0, 1 - (mean_depth / 5))  # assume 5 is max depth
    normalized_path = max(0, 1 - (avg_shortest_path / 5))
    
    C = (integration + normalized_depth + normalized_path) / 3
    
    # -----------------------------------------------
    # DQI CALCULATION
    # -----------------------------------------------
    dqi = (0.25 * E + 0.20 * Z + 0.20 * L + 0.15 * P + 0.20 * C)
    
    # Clamp to [0, 1]
    dqi = max(0, min(1, dqi))
    
    # Convert to score [0, 10]
    score = dqi * 10
    
    # Categorize
    quality_class = categorize_score(score)
    
    return dqi, quality_class




