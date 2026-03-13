# ==========================================
# SVG FLOORPLAN PARSER
# CubiCasa5K
# ==========================================

import xml.etree.ElementTree as ET
import numpy as np
import os
import re
import json

import json

# ------------------------------------------
# SCALE CONVERSION
# ------------------------------------------

PIXEL_TO_METER = 0.01
AREA_SCALE = PIXEL_TO_METER ** 2
# ------------------------------------------
# Utilities
# ------------------------------------------

def safe_float(val):

    if val is None:
        return 0.0

    nums = re.findall(r"[-+]?\d*\.?\d+", str(val))

    if nums:
        return float(nums[0])

    return 0.0


def polygon_area(pts):

    area = 0
    n = len(pts)

    for i in range(n):

        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]

        area += x1 * y2 - x2 * y1

    return abs(area) / 2


def polygon_bbox(pts):

    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]

    return min(xs), min(ys), max(xs), max(ys)


def polygon_centroid(pts):

    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]

    return np.mean(xs), np.mean(ys)


# ------------------------------------------
# SVG Parser
# ------------------------------------------

class SVGParser:

    def __init__(self, svg_path):

        self.svg_path = svg_path

        self.tree = ET.parse(svg_path)
        self.root = self.tree.getroot()

        self.elements = {
            "rooms": [],
            "windows": [],
            "walls": []
        }

    # --------------------------------------

    def parse_points(self, pts_str):

        pts = []

        for p in pts_str.strip().split():

            x, y = p.split(",")

            pts.append((float(x), float(y)))

        return pts

    # --------------------------------------

    def parse_rooms(self):

        rooms = []

        for elem in self.root.iter():

            cls = elem.attrib.get("class", "").lower()

            if "space" in cls:
                room_type = cls.replace("space", "").strip()
                room_type = room_type.split(" ")[0]
                for child in elem:

                    tag = child.tag.split("}")[-1]

                    if tag == "polygon":

                        pts = self.parse_points(child.attrib["points"])

                        area_pixels = polygon_area(pts)

                        rooms.append({
                            "type": room_type,
                            "polygon": pts,
                            "area": area_pixels * AREA_SCALE,
                            "centroid": polygon_centroid(pts)
                        })

        self.elements["rooms"] = rooms

    # --------------------------------------

    def parse_windows(self):

        windows = []

        for elem in self.root.iter():

            cls = elem.attrib.get("class", "").lower()

            if "window" in cls:

                for child in elem:

                    tag = child.tag.split("}")[-1]

                    if tag == "polygon":

                        pts = self.parse_points(child.attrib["points"])

                        area_pixels = polygon_area(pts)

                        windows.append({
                            "polygon": pts,
                            "area": area_pixels * AREA_SCALE,
                            "centroid": polygon_centroid(pts)
                        })

        self.elements["windows"] = windows

    # --------------------------------------

    def parse_walls(self):

        walls = []

        for elem in self.root.iter():

            cls = elem.attrib.get("class", "").lower()

            if "wall" in cls:

                wall_type = "internal"

                if "external" in cls:
                    wall_type = "external"

                for child in elem:

                    tag = child.tag.split("}")[-1]

                    if tag == "polygon":

                        pts = self.parse_points(child.attrib["points"])

                        walls.append({
                            "type": wall_type,
                            "polygon": pts
                        })

        self.elements["walls"] = walls

    # --------------------------------------

    def parse(self):

        self.parse_rooms()
        self.parse_windows()
        self.parse_walls()

        return self.elements


# ------------------------------------------
# Dataset Parser
# ------------------------------------------
def save_parsed_data(elements, svg_path, output_dir="parsed_floorplans"):

    os.makedirs(output_dir, exist_ok=True)

    plan_id = os.path.basename(os.path.dirname(svg_path))

    output_file = os.path.join(output_dir, f"{plan_id}.json")

    with open(output_file, "w") as f:
        json.dump(elements, f)

    print("Saved:", output_file)
def parse_svg(svg_path):

    parser = SVGParser(svg_path)

    return parser.parse()


def parse_dataset(dataset_root):

    total = 0
    success = 0
    failed = 0

    for root, dirs, files in os.walk(dataset_root):

        # look for svg in any nested folder
        for file in files:

            if file.endswith(".svg"):

                svg_path = os.path.join(root, file)

                total += 1

                try:

                    data = parse_svg(svg_path)

                    plan_id = os.path.basename(root)

                    print("\nProcessing:", plan_id)

                    print("Rooms:", len(data["rooms"]))
                    print("Windows:", len(data["windows"]))
                    print("Walls:", len(data["walls"]))

                    save_parsed_data(data, svg_path)

                    success += 1

                except Exception as e:

                    print("Failed:", svg_path)
                    print("Error:", e)

                    failed += 1

    print("\n-------------------")
    print("Total:", total)
    print("Success:", success)
    print("Failed:", failed)

if __name__ == "__main__":

    dataset_path = "cubicasa5k"

    print("Starting parser")
    print("Dataset path:", dataset_path)

    if not os.path.exists(dataset_path):
        print("ERROR: Dataset folder not found")
        exit()

    print("Dataset exists. Starting parsing...\n")

    parse_dataset(dataset_path)