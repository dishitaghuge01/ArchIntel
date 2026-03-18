import networkx as nx
import numpy as np
from quality_check_model.utils.graph_utils import build_graph


def compute_spatial_metrics(G):

    if len(G.nodes) < 2:
        return {
            "graph_density": 0,
            "avg_shortest_path": 0,
            "mean_depth": 0,
            "integration": 0
        }

    density = nx.density(G)

    try:
        avg_shortest = nx.average_shortest_path_length(G)
    except:
        avg_shortest = 0

    path_lengths = dict(nx.all_pairs_shortest_path_length(G))

    depths = []

    for node in path_lengths:
        depths.extend(path_lengths[node].values())

    mean_depth = sum(depths) / len(depths) if depths else 0

    integration = 1 / mean_depth if mean_depth > 0 else 0

    return {
        "graph_density": float(density),
        "avg_shortest_path": float(avg_shortest),
        "mean_depth": float(mean_depth),
        "integration": float(integration)
    }


def compute_spatial_syntax(parsed_data):
    """
    Compute spatial syntax features from parsed floorplan data.
    
    This function:
    1. Builds an adjacency graph from rooms
    2. Computes spatial metrics (integration, depth, etc.)
    
    Args:
        parsed_data (dict): Output from parse_svg() containing rooms
        
    Returns:
        dict: Spatial syntax features for DQI calculation
    """
    
    rooms = parsed_data.get("rooms", [])
    
    if not rooms:
        return {
            "graph_density": 0,
            "avg_shortest_path": 0,
            "mean_depth": 0,
            "integration": 0
        }
    
    try:
        # Build room adjacency graph
        G = build_graph(rooms)
        
        # Compute spatial metrics
        metrics = compute_spatial_metrics(G)
        
        return metrics
    except Exception as e:
        print(f"Warning: Could not compute spatial syntax features: {e}")
        return {
            "graph_density": 0,
            "avg_shortest_path": 0,
            "mean_depth": 0,
            "integration": 0.4
        }