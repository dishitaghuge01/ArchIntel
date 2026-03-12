import networkx as nx
import numpy as np

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

    mean_depth = sum(depths) / len(depths)

    integration = 1 / mean_depth if mean_depth > 0 else 0

    return {
        "graph_density": density,
        "avg_shortest_path": avg_shortest,
        "mean_depth": mean_depth,
        "integration": integration
    }