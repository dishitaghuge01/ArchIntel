import ast
import numpy as np
from shapely.geometry import Polygon


def rebuild_polygons(df):

    df["points"] = df["points"].apply(ast.literal_eval)

    df["polygon"] = df["points"].apply(lambda pts: Polygon(pts).buffer(0))

    return df


def share_wall(poly1, poly2, tolerance=15):

    if not poly1.is_valid:
        poly1 = poly1.buffer(0)

    if not poly2.is_valid:
        poly2 = poly2.buffer(0)

    poly1_expanded = poly1.buffer(tolerance)
    poly2_expanded = poly2.buffer(tolerance)

    return poly1_expanded.intersects(poly2_expanded)


def compute_geometric_features(parsed_data):
    """
    Compute geometric features from parsed floorplan data.
    
    Args:
        parsed_data (dict): Output from parse_svg() containing rooms, windows, walls
        
    Returns:
        dict: Geometric features for DQI calculation
    """
    
    rooms = parsed_data.get("rooms", [])
    windows = parsed_data.get("windows", [])
    walls = parsed_data.get("walls", [])
    
    if not rooms:
        return _default_geometric_features()
    
    # -----------------------------------------------
    # Room-level metrics
    # -----------------------------------------------
    room_areas = [r.get("area", 0) for r in rooms]
    total_area = sum(room_areas)
    
    if total_area == 0:
        return _default_geometric_features()
    
    avg_room_area = np.mean(room_areas) if room_areas else 0
    
    # -----------------------------------------------
    # Aspect ratios and rectangularity
    # -----------------------------------------------
    aspect_ratios = []
    rectangularities = []
    compactnesses = []
    
    for room in rooms:
        pts = room.get("polygon", [])
        if pts:
            aspect_ratio = _compute_aspect_ratio(pts)
            rectangularity = _compute_rectangularity(pts)
            compactness = _compute_compactness(pts, room.get("area", 1))
            
            aspect_ratios.append(aspect_ratio)
            rectangularities.append(rectangularity)
            compactnesses.append(compactness)
    
    avg_aspect_ratio = np.mean(aspect_ratios) if aspect_ratios else 1.5
    avg_rectangularity = np.mean(rectangularities) if rectangularities else 0.7
    avg_compactness = np.mean(compactnesses) if compactnesses else 0.7
    
    # -----------------------------------------------
    # Corridor analysis
    # -----------------------------------------------
    corridor_area = sum([r.get("area", 0) for r in rooms if r.get("type") == "corridor"])
    corridor_ratio = corridor_area / total_area if total_area > 0 else 0.15
    
    # -----------------------------------------------
    # Service area (bathrooms, utilities)
    # -----------------------------------------------
    service_types = ["bath", "utility", "laundry", "storage"]
    service_area = sum([r.get("area", 0) for r in rooms if r.get("type") in service_types])
    service_area_ratio = service_area / total_area if total_area > 0 else 0.1
    
    # -----------------------------------------------
    # Window analysis
    # -----------------------------------------------
    window_area = sum([w.get("area", 0) for w in windows])
    external_wall_area = sum([w.get("length", 0) for w in walls if w.get("type") == "external"])
    
    window_wall_ratio = window_area / external_wall_area if external_wall_area > 0 else 0.3
    
    # Rooms with window access
    rooms_with_windows = sum([1 for r in rooms if any(
        _room_has_window(r, w) for w in windows
    )])
    rooms_with_window_ratio = rooms_with_windows / len(rooms) if rooms else 0.7
    
    # -----------------------------------------------
    # Ventilation (cross-ventilation potential)
    # -----------------------------------------------
    cross_ventilation_ratio = _compute_cross_ventilation(rooms, windows)
    
    # -----------------------------------------------
    # Space efficiency
    # -----------------------------------------------
    habitable_types = ["bedroom", "livingroom", "kitchen", "diningroom"]
    habitable_area = sum([r.get("area", 0) for r in rooms if r.get("type") in habitable_types])
    efficiency = habitable_area / total_area if total_area > 0 else 0.75
    
    # -----------------------------------------------
    # Public-private separation
    # -----------------------------------------------
    private_types = ["bedroom", "bath"]
    public_types = ["livingroom", "kitchen", "diningroom"]
    
    private_area = sum([r.get("area", 0) for r in rooms if r.get("type") in private_types])
    public_area = sum([r.get("area", 0) for r in rooms if r.get("type") in public_types])
    
    public_private_separation = _compute_separation(private_area, public_area, total_area)
    
    # -----------------------------------------------
    # Bathroom adjacency to bedrooms
    # -----------------------------------------------
    bathroom_adjacency = _compute_bathroom_adjacency(rooms)
    
    # -----------------------------------------------
    # Compile features
    # -----------------------------------------------
    features = {
        "total_area": float(total_area),
        "avg_room_area": float(avg_room_area),
        "avg_aspect_ratio": float(avg_aspect_ratio),
        "avg_rectangularity": float(avg_rectangularity),
        "avg_compactness": float(avg_compactness),
        "corridor_ratio": float(corridor_ratio),
        "service_area_ratio": float(service_area_ratio),
        "window_wall_ratio": float(window_wall_ratio),
        "rooms_with_window_ratio": float(rooms_with_window_ratio),
        "cross_ventilation_ratio": float(cross_ventilation_ratio),
        "efficiency": float(efficiency),
        "public_private_separation": float(public_private_separation),
        "bathroom_adjacency": float(bathroom_adjacency),
        "num_rooms": len(rooms),
        "num_windows": len(windows),
    }
    
    return features


def _default_geometric_features():
    """Return default feature values when parsing fails."""
    return {
        "total_area": 0,
        "avg_room_area": 20,
        "avg_aspect_ratio": 1.5,
        "avg_rectangularity": 0.7,
        "avg_compactness": 0.7,
        "corridor_ratio": 0.15,
        "service_area_ratio": 0.1,
        "window_wall_ratio": 0.3,
        "rooms_with_window_ratio": 0.7,
        "cross_ventilation_ratio": 0.25,
        "efficiency": 0.75,
        "public_private_separation": 0.5,
        "bathroom_adjacency": 0.5,
        "num_rooms": 0,
        "num_windows": 0,
    }


def _compute_aspect_ratio(polygon_points):
    """Compute aspect ratio (width/height) of a polygon."""
    if not polygon_points:
        return 1.5
    
    xs = [p[0] for p in polygon_points]
    ys = [p[1] for p in polygon_points]
    
    width = max(xs) - min(xs)
    height = max(ys) - min(ys)
    
    if height == 0:
        return 1.0
    
    return max(width / height, height / width)


def _compute_rectangularity(polygon_points):
    """Compute how rectangular the polygon is (0-1)."""
    if not polygon_points or len(polygon_points) < 3:
        return 0.7
    
    try:
        poly = Polygon(polygon_points)
        area = poly.area
        bbox = poly.bounds
        bbox_area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        
        if bbox_area == 0:
            return 0.7
        
        rectangularity = area / bbox_area
        return min(1.0, max(0, rectangularity))
    except:
        return 0.7


def _compute_compactness(polygon_points, area):
    """Compute compactness using perimeter-area ratio."""
    if not polygon_points or area <= 0:
        return 0.7
    
    try:
        poly = Polygon(polygon_points)
        perimeter = poly.length
        
        # Compactness = 4π * Area / Perimeter²
        # Normalize to [0,1] where 1 is a perfect circle
        if perimeter == 0:
            return 0.7
        
        compactness = (4 * np.pi * area) / (perimeter ** 2)
        return min(1.0, max(0, compactness))
    except:
        return 0.7


def _room_has_window(room, window):
    """Check if a room contains or is adjacent to a window."""
    room_bounds = _get_bounds(room.get("polygon", []))
    window_bounds = _get_bounds(window.get("polygon", []))
    
    if not room_bounds or not window_bounds:
        return False
    
    # Simple bounding box overlap check
    return _bounds_intersect(room_bounds, window_bounds)


def _get_bounds(polygon_points):
    """Get bounding box (min_x, min_y, max_x, max_y)."""
    if not polygon_points:
        return None
    xs = [p[0] for p in polygon_points]
    ys = [p[1] for p in polygon_points]
    return (min(xs), min(ys), max(xs), max(ys))


def _bounds_intersect(bounds1, bounds2, tolerance=5):
    """Check if two bounding boxes intersect or are close."""
    if not bounds1 or not bounds2:
        return False
    
    x1_min, y1_min, x1_max, y1_max = bounds1
    x2_min, y2_min, x2_max, y2_max = bounds2
    
    return (x1_max + tolerance >= x2_min and 
            x2_max + tolerance >= x1_min and 
            y1_max + tolerance >= y2_min and 
            y2_max + tolerance >= y1_min)


def _compute_cross_ventilation(rooms, windows):
    """
    Estimate cross-ventilation potential.
    Rooms on opposite sides of the plan can cross-ventilate.
    """
    if not rooms or len(rooms) < 2:
        return 0.25
    
    # Simple heuristic: count rooms that could have opposite windows
    centroids = [r.get("centroid", (0, 0)) for r in rooms if r.get("centroid")]
    
    if not centroids:
        return 0.25
    
    # Rooms on left and right sides
    left_rooms = sum(1 for c in centroids if c[0] < np.mean([c[0] for c in centroids]))
    right_rooms = len(centroids) - left_rooms
    
    cross_vent_ratio = min(left_rooms, right_rooms) / max(len(centroids), 1)
    
    return min(1.0, cross_vent_ratio + 0.1)


def _compute_separation(private_area, public_area, total_area):
    """
    Compute public-private separation quality.
    High value means good separation between public and private zones.
    """
    if total_area == 0:
        return 0.5
    
    private_ratio = private_area / total_area
    public_ratio = public_area / total_area
    
    # Well-separated when both exist and are distinct
    if private_ratio > 0.2 and public_ratio > 0.2:
        return 0.7
    elif private_ratio > 0.15 or public_ratio > 0.15:
        return 0.5
    else:
        return 0.3


def _compute_bathroom_adjacency(rooms):
    """
    Compute bathroom adjacency to bedrooms.
    """
    bathrooms = [r for r in rooms if r.get("type") in ["bath", "bathroom"]]
    bedrooms = [r for r in rooms if r.get("type") == "bedroom"]
    
    if not bathrooms or not bedrooms:
        return 0.5
    
    # Simple heuristic: count adjacent pairs
    adjacent_pairs = 0
    
    for bath in bathrooms:
        bath_centroid = bath.get("centroid", (0, 0))
        
        for bed in bedrooms:
            bed_centroid = bed.get("centroid", (0, 0))
            
            # Distance between centroids
            dist = np.sqrt((bath_centroid[0] - bed_centroid[0])**2 + 
                          (bath_centroid[1] - bed_centroid[1])**2)
            
            # If within reasonable distance, consider them adjacent
            if dist < 100:
                adjacent_pairs += 1
    
    if not bedrooms:
        return 0.5
    
    adjacency_ratio = min(1.0, adjacent_pairs / len(bedrooms))
    
    return adjacency_ratio