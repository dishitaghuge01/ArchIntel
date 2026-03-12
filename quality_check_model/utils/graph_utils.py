import networkx as nx
from utils.geometry_utils import share_wall

def build_graph(plan_rooms):

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