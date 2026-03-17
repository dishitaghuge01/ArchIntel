#!/usr/bin/env python
# coding: utf-8

# In[44]:


import pandas as pd
import networkx as nx
import importlib

# utils imports
from utils.geometry_utils import rebuild_polygons
import utils.graph_utils as graph_utils

# reload in case graph_utils changed
importlib.reload(graph_utils)
from utils.graph_utils import build_graph


# In[45]:


rooms_df = pd.read_csv("rooms_dataset.csv")

rooms_df.head()


# In[46]:


rooms_df = rebuild_polygons(rooms_df)


# In[48]:


def compute_spatial_metrics(G):

    graph_density = nx.density(G)

    components = list(nx.connected_components(G))

    path_lengths = []
    mean_depths = []

    for comp in components:

        subgraph = G.subgraph(comp)

        if len(subgraph.nodes) > 1:

            avg_shortest = nx.average_shortest_path_length(subgraph)
            path_lengths.append(avg_shortest)

            lengths = dict(nx.shortest_path_length(subgraph))

            depths = []

            for node in lengths:
                depths.append(sum(lengths[node].values())/(len(lengths[node])-1))

            mean_depths.append(sum(depths)/len(depths))

    if len(path_lengths) > 0:
        avg_shortest_path = sum(path_lengths)/len(path_lengths)
        mean_depth = sum(mean_depths)/len(mean_depths)
    else:
        avg_shortest_path = 0
        mean_depth = 0

    if mean_depth != 0:
        integration = 1/mean_depth
    else:
        integration = 0

    return {
        "graph_density": graph_density,
        "avg_shortest_path": avg_shortest_path,
        "mean_depth": mean_depth,
        "integration": integration
    }
    


# In[49]:


results = []

for plan_id in rooms_df["plan_id"].unique():

    plan_rooms = rooms_df[rooms_df["plan_id"] == plan_id]

    G = build_graph(plan_rooms)

    metrics = compute_spatial_metrics(G)

    metrics["plan_id"] = plan_id

    results.append(metrics)


# In[50]:


spatial_features_df = pd.DataFrame(results)

spatial_features_df.head()


# In[51]:


spatial_features_df.to_csv("spatial_syntax_features.csv", index=False)


# In[ ]:




