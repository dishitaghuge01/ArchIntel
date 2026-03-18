import networkx as nx
from shapely.geometry import Polygon
from quality_check_model.utils.geometry_utils import share_wall


def build_graph(rooms_data):
    """
    Build adjacency graph from rooms.
    
    Args:
        rooms_data: Either a pandas DataFrame or a list of room dictionaries
        
    Returns:
        networkx.Graph: Room adjacency graph
    """
    
    G = nx.Graph()
    
    # Handle both DataFrame and list inputs
    if hasattr(rooms_data, 'iterrows'):
        # DataFrame input
        return _build_graph_from_dataframe(rooms_data)
    else:
        # List of dictionaries input
        return _build_graph_from_list(rooms_data)


def _build_graph_from_dataframe(plan_rooms):
    """Build graph from pandas DataFrame."""
    
    G = nx.Graph()

    for idx, row in plan_rooms.iterrows():

        G.add_node(
            idx,
            room_type=row["room_type"],
            area=row["area"],
            centroid=(row["centroid_x"], row["centroid_y"])
        )

    for i, room1 in plan_rooms.iterrows():

        for j, room2 in plan_rooms.iterrows():

            if i >= j:
                continue

            if share_wall(room1["polygon"], room2["polygon"]):
                G.add_edge(i, j)

    return G


def _build_graph_from_list(rooms):
    """Build graph from list of room dictionaries."""
    
    G = nx.Graph()
    
    if not rooms:
        return G
    
    # Add nodes
    for idx, room in enumerate(rooms):
        centroid = room.get("centroid", (0, 0))
        
        G.add_node(
            idx,
            room_type=room.get("type", "unknown"),
            area=room.get("area", 0),
            centroid=centroid
        )
    
    # Add edges based on wall sharing
    for i in range(len(rooms)):
        for j in range(i + 1, len(rooms)):
            room1 = rooms[i]
            room2 = rooms[j]
            
            # Get polygons
            poly1_pts = room1.get("polygon", [])
            poly2_pts = room2.get("polygon", [])
            
            if not poly1_pts or not poly2_pts:
                continue
            
            # Create Shapely polygons
            try:
                poly1 = Polygon(poly1_pts).buffer(0)
                poly2 = Polygon(poly2_pts).buffer(0)
                
                if poly1.is_valid and poly2.is_valid and share_wall(poly1, poly2):
                    G.add_edge(i, j)
            except:
                # Skip if polygon creation fails
                continue
    
    return G