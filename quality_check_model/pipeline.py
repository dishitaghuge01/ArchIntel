"""
Floorplan Processing Pipeline

End-to-end pipeline for processing SVG floorplans:
1. Parse SVG file
2. Extract geometric features
3. Build spatial graph
4. Compute spatial syntax features
5. Merge all features
6. Compute DQI score
7. Generate design suggestions
8. Return structured output
"""

import os
import json
import logging
from pathlib import Path

from quality_check_model.svg_parser import parse_svg
from quality_check_model.suggestion_engine import generate_suggestions
from quality_check_model.dqi_calculation import compute_dqi
from quality_check_model.utils.geometry_utils import compute_geometric_features
from quality_check_model.utils.feature_utils import compute_spatial_syntax


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_pipeline(svg_path, output_dir=None, verbose=True):
    """
    Process a floorplan SVG file through the complete pipeline.
    
    Args:
        svg_path (str): Path to the SVG file
        output_dir (str): Optional directory to save JSON output
        verbose (bool): Whether to print progress messages
        
    Returns:
        dict: Pipeline output containing:
              - parsed: Parsed floorplan data
              - features: All computed features
              - dqi: Design Quality Index score (0-1)
              - quality_class: Quality classification
              - suggestions: Design improvement suggestions
    """
    
    if not os.path.exists(svg_path):
        raise FileNotFoundError(f"SVG file not found: {svg_path}")
    
    plan_id = Path(svg_path).stem
    
    if verbose:
        logger.info(f"Starting pipeline for: {plan_id}")
    
    try:
        # =============================================
        # STEP 1: Parse SVG
        # =============================================
        if verbose:
            logger.info(f"[1/7] Parsing SVG...")
        
        parsed_data = parse_svg(svg_path)
        num_rooms = len(parsed_data.get("rooms", []))
        
        if verbose:
            logger.info(f"  ✓ Parsed {num_rooms} rooms")
        
        if num_rooms == 0:
            logger.warning("  ⚠ No rooms detected in floorplan")
        
        # =============================================
        # STEP 2: Compute Geometric Features
        # =============================================
        if verbose:
            logger.info(f"[2/7] Computing geometric features...")
        
        geom_features = compute_geometric_features(parsed_data)
        
        if verbose:
            logger.info(f"  ✓ Computed {len(geom_features)} geometric metrics")
        
        # =============================================
        # STEP 3: Build Spatial Graph
        # =============================================
        if verbose:
            logger.info(f"[3/7] Building spatial graph...")
        
        from quality_check_model.utils.graph_utils import build_graph
        
        graph = build_graph(parsed_data.get("rooms", []))
        num_edges = graph.number_of_edges()
        
        if verbose:
            logger.info(f"  ✓ Graph with {num_rooms} nodes, {num_edges} edges")
        
        # =============================================
        # STEP 4: Compute Spatial Syntax Features
        # =============================================
        if verbose:
            logger.info(f"[4/7] Computing spatial syntax features...")
        
        spatial_features = compute_spatial_syntax(parsed_data)
        
        if verbose:
            logger.info(f"  ✓ Computed spatial metrics")
        
        # =============================================
        # STEP 5: Merge All Features
        # =============================================
        if verbose:
            logger.info(f"[5/7] Merging features...")
        
        features = {**geom_features, **spatial_features}
        
        if verbose:
            logger.info(f"  ✓ Total features: {len(features)}")
        
        # =============================================
        # STEP 6: Compute DQI Score
        # =============================================
        if verbose:
            logger.info(f"[6/7] Computing DQI score...")
        
        dqi, quality_class = compute_dqi(features)
        
        features["DQI"] = dqi
        features["quality_class"] = quality_class
        
        dqi_score = dqi * 10  # Convert to 0-10 scale
        
        if verbose:
            logger.info(f"  ✓ DQI: {dqi_score:.2f}/10 ({quality_class})")
        
        # =============================================
        # STEP 7: Generate Suggestions
        # =============================================
        if verbose:
            logger.info(f"[7/7] Generating design suggestions...")
        
        suggestions = generate_suggestions(features)
        num_issues = len(suggestions)
        
        if verbose:
            logger.info(f"  ✓ Found {num_issues} potential improvements")
        
        # =============================================
        # Compile Output
        # =============================================
        output = {
            "plan_id": plan_id,
            "parsed": parsed_data,
            "features": features,
            "dqi": float(dqi),
            "dqi_score": float(dqi_score),
            "quality_class": quality_class,
            "suggestions": suggestions,
            "summary": {
                "num_rooms": num_rooms,
                "total_area": features.get("total_area", 0),
                "dqi_score": float(dqi_score),
                "quality_class": quality_class,
                "issues_detected": num_issues
            }
        }
        
        # =============================================
        # Save Output (Optional)
        # =============================================
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f"{plan_id}.json")
            
            with open(output_path, "w") as f:
                json.dump(output, f, indent=2)
            
            if verbose:
                logger.info(f"\n✓ Pipeline complete! Results saved to: {output_path}\n")
        else:
            if verbose:
                logger.info(f"\n✓ Pipeline complete!\n")
        
        return output
    
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise


def process_floorplan(svg_path, output_dir="processed_floorplans"):
    """
    Convenience wrapper for run_pipeline.
    
    Args:
        svg_path (str): Path to SVG file
        output_dir (str): Directory to save results
        
    Returns:
        dict: Pipeline output
    """
    return run_pipeline(svg_path, output_dir=output_dir, verbose=True)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <svg_path> [output_dir]")
        sys.exit(1)
    
    svg_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "processed_floorplans"
    
    result = run_pipeline(svg_path, output_dir=output_dir, verbose=True)