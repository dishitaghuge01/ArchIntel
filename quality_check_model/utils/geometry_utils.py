import ast
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