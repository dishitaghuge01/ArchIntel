# Architectural Intelligence Platform: Cost Prediction & Design Quality Evaluation

A dual-component intelligent system for analyzing building and floorplan data. This project integrates **construction cost prediction** and **AI-driven design quality assessment** with improvement recommendations.

## Table of Contents

- [Overview](#overview)
- [Project Architecture](#project-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Component Details](#component-details)
- [Features & Datasets](#features--datasets)
- [Design Quality Index (DQI)](#design-quality-index-dqi)
- [Development Guide](#development-guide)

---

## Overview

This project provides two integrated services for the real estate and architecture industry:

1. **Cost Prediction Model**: Estimates construction costs for buildings based on characteristics (location, area, structural features, and preliminary estimates).
2. **Design Quality Evaluator**: Assesses floorplan quality across five dimensions (efficiency, zoning, lighting/ventilation, proportions, circulation) using extracted geometric and spatial features, returning both a Quality Index score and actionable design improvement suggestions.

### Key Capabilities

- 📊 **Predictive Analytics**: Linear regression-based cost forecasting
- 🏗️ **Architectural Analysis**: Extracts 20+ quantifiable design features from floorplans
- 🤖 **AI-Powered Insights**: LLM-based Q&A and design suggestions via Groq integration
- 🌐 **REST API**: FastAPI web service for seamless integration
- 📈 **Quality Scoring**: Comprehensive Design Quality Index with 5-dimension evaluation

---

## Project Architecture

```
mini_project/
├── cost_prediction_model/          # Construction cost prediction
│   ├── dataset1.csv                # Building features & costs (Iranian real estate)
│   └── linear_regression.ipynb     # Cost prediction model notebook
│
├── quality_check_model/            # Floorplan quality evaluation
│   ├── app.py                      # FastAPI web service
│   ├── pipeline.py                 # 7-step floorplan analysis pipeline
│   ├── Core Analysis Modules
│   │   ├── svg_parser.py           # SVG floorplan parsing
│   │   ├── dqi_calculation.py      # Design Quality Index computation
│   │   ├── suggestion_engine.py    # Design improvement suggestions
│   │   └── spatial_syntax_features.py  # Graph-based spatial metrics
│   ├── AI Integration
│   │   ├── floorplan_ai_assistant.py   # Groq LLM integration
│   │   └── context_builder.py          # LLM context management
│   ├── Data & Features
│   │   ├── cubicasa5k/             # CubiCasa5K dataset (1000+ floorplans)
│   │   ├── parsed_floorplans/      # Pre-parsed floorplan JSON files
│   │   ├── features/               # Extracted features CSV files
│   │   ├── dataset_with_dqi.csv    # Complete dataset with DQI scores
│   │   ├── rooms_dataset.csv       # Individual room data
│   │   └── cubicasa_plan_index.csv # Plan metadata index
│   ├── Development Notebooks
│   │   ├── room_detection.ipynb
│   │   ├── geometric_features.ipynb
│   │   ├── graph_construction.ipynb
│   │   ├── spatial_syntax_features.ipynb
│   │   ├── functional_zoning_features.ipynb
│   │   ├── plan_level_features.ipynb
│   │   ├── dqi_calculation.ipynb
│   │   ├── merge_features.ipynb
│   │   ├── ml_model_training.ipynb
│   │   ├── floorplan_evaluator.ipynb
│   │   ├── prepare_dataset.ipynb
│   │   └── dataset_loader.ipynb
│   ├── utils/                      # Utility modules
│   ├── requirements.txt            # Python dependencies
│   └── models/                     # Trained ML models
│
└── README.md                       # This file
```

---

## Installation

### Prerequisites

- Python 3.8+
- Anaconda or pip for dependency management
- Jupyter Notebook or VS Code with Jupyter extension (for notebooks)

### Setup Steps

1. **Clone or navigate to the project**:
   ```bash
   cd mini_project
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   conda create -n floorplan_analysis python=3.10
   conda activate floorplan_analysis
   ```

3. **Install dependencies**:
   ```bash
   # For quality check model
   cd quality_check_model
   pip install -r requirements.txt
   cd ..
   ```

4. **Set up environment variables** (if needed):
   - Create a `.env` file for API keys (e.g., Groq API key)
   - Example: `GROQ_API_KEY=your_api_key_here`

---

## Usage

### 1. Cost Prediction Model

**Quick Start** - Predict construction costs:

```bash
cd cost_prediction_model
jupyter notebook linear_regression.ipynb
```

- Opens the cost prediction notebook
- Load `dataset1.csv`
- View data preprocessing, model training, and evaluation metrics
- Modify features or train with your own dataset

### 2. Design Quality Evaluation

#### **Option A: FastAPI Web Service**

```bash
cd quality_check_model
python app.py
```

**Endpoints**:
- `POST /analyze/` - Analyze a floorplan from SVG
  - Input: SVG file content
  - Output: DQI scores, quality classification, design suggestions
  
- `POST /ask/` - Ask questions about floorplan design
  - Input: Question + floorplan context
  - Output: AI-generated design insights via Groq LLM

#### **Option B: Pipeline Script**

```bash
cd quality_check_model
python pipeline.py --input floorplan.svg --output results.json
```

**Pipeline Steps**:
1. Parse SVG floorplan
2. Detect rooms and extract geometry
3. Build spatial connectivity graph
4. Compute geometric features (aspect ratio, compactness, etc.)
5. Calculate spatial syntax metrics (integration, depth, density)
6. Compute functional zoning scores
7. Generate Design Quality Index and suggestions

#### **Option C: Jupyter Notebooks (Development)**

Explore data and models interactively:

```bash
cd quality_check_model
jupyter notebook
```

- Open `dataset_loader.ipynb` - Load and explore datasets
- Open `room_detection.ipynb` - Visualize room extraction
- Open `dqi_calculation.ipynb` - Understand DQI scoring
- Open `ml_model_training.ipynb` - Train quality prediction model
- Open `floorplan_evaluator.ipynb` - Evaluate model performance

---

## Project Structure

### Cost Prediction Model (`cost_prediction_model/`)

| File | Purpose |
|------|---------|
| `dataset1.csv` | Building dataset with 9 feature variables and cost target |
| `linear_regression.ipynb` | Machine learning pipeline: load → preprocess → train → evaluate |

**Dataset Features** (V-1 to V-10):
- **V-1**: Project locality (categorical zip code)
- **V-2**: Total floor area (m²)
- **V-3**: Lot area (m²)
- **V-4**: Total preliminary cost estimate (10,000 IRR)
- **V-5**: Preliminary cost estimate (10,000 IRR)
- **V-6**: Equivalent cost in base year prices (10,000 IRR)
- **V-7**: Construction duration
- **V-8**: Price per unit (10,000 IRR/m²)
- **V-10**: **TARGET** - Final construction cost (10,000 IRR)

### Quality Check Model (`quality_check_model/`)

#### Core Python Modules

| File | Purpose |
|------|---------|
| `app.py` | FastAPI web service with `/analyze/` and `/ask/` endpoints |
| `pipeline.py` | Orchestrates 7-step floorplan analysis end-to-end |
| `svg_parser.py` | Parses SVG files and extracts room polygons |
| `dqi_calculation.py` | Computes Design Quality Index scores and classifications |
| `suggestion_engine.py` | Generates design improvement recommendations |
| `floorplan_ai_assistant.py` | Groq LLM integration for design Q&A |
| `context_builder.py` | Loads datasets and builds LLM context |
| `spatial_syntax_features.py` | Computes graph-based spatial metrics (integration, depth, density) |

#### Utility Modules (`utils/`)

| Module | Purpose |
|--------|---------|
| `geometry_utils.py` | Polygon operations: area, centroid, bounding box, aspect ratio |
| `graph_utils.py` | Room adjacency graph construction and analysis |
| `feature_utils.py` | Feature computation and aggregation |

#### Data & Features Directories

| Path | Content |
|------|---------|
| `cubicasa5k/` | CubiCasa5K dataset with 1000+ SVG floorplans organized by quality |
| `parsed_floorplans/` | ~1000 pre-parsed floorplan structures in JSON format |
| `features/` | Extracted features: geometric, spatial syntax, zoning, plan-level |
| `dataset_with_dqi.csv` | Complete dataset: features + DQI scores for ~4000 plans |
| `rooms_dataset.csv` | Individual room data: type, area, centroid, vertices, plan_id |
| `cubicasa_plan_index.csv` | Metadata index for CubiCasa plans |

---

## Component Details

### Cost Prediction Model

**Algorithm**: Linear Regression

**Workflow**:
1. Load `dataset1.csv` with building characteristics
2. Preprocess: handle missing values, encode categorical V-1
3. Split into training/test sets
4. Train linear regression model
5. Evaluate: R², MAE, MSE, RMSE
6. Generate cost predictions for new buildings

**Extensions**:
- Integrate location-based cost indices
- Add more predictive features (construction type, materials, labor rates)
- Experiment with Ridge, Lasso, Elastic Net, or ensemble models
- Implement cross-validation for robustness

---

### Design Quality Model

**Overview**: Analyzes floorplans across 5 quality dimensions to produce a 0-10 Design Quality Index.

**7-Step Pipeline**:

1. **SVG Parsing** (`svg_parser.py`)
   - Load SVG floorplan
   - Extract room polygons and metadata

2. **Room Detection** (`room_detection.ipynb`)
   - Identify individual rooms
   - Extract room types (living, bedroom, kitchen, etc.)

3. **Geometric Analysis** (`geometric_features.ipynb`, `geometric_utils.py`)
   - Compute per-room features: aspect ratio, compactness, rectangularity
   - Aggregate: average, standard deviation across plan

4. **Spatial Graph Construction** (`graph_construction.ipynb`, `graph_utils.py`)
   - Build adjacency graph of rooms
   - Compute connectivity metrics

5. **Spatial Syntax Metrics** (`spatial_syntax_features.ipynb`, `spatial_syntax_features.py`)
   - Graph density
   - Integration (1/mean_depth)
   - Mean depth & average shortest path

6. **Functional Zoning & Plan-Level Features** (`functional_zoning_features.ipynb`, `plan_level_features.ipynb`)
   - Public/private separation
   - Bathroom adjacency
   - Corridor efficiency
   - Window and ventilation ratios

7. **DQI Calculation & Recommendations** (`dqi_calculation.py`, `suggestion_engine.py`)
   - Compute weighted DQI score
   - Classify quality level (Poor/Average/Good/Excellent)
   - Generate AI-powered design suggestions via `suggestion_engine.py`

---

## Features & Datasets

### Extracted Features

#### Geometric Features (`features/geometry_features.csv`)
- `num_rooms` - Number of rooms in plan
- `avg_room_area`, `std_room_area` - Room size statistics (m²)
- `avg_aspect_ratio` - Average aspect ratio (length/width) across rooms
- `avg_compactness` - Measure of how efficient room shapes are (4π×area/perimeter²)
- `avg_rectangularity` - How close rooms are to perfect rectangles

#### Spatial Syntax Features (`features/spatial_syntax_features.csv`)
- `graph_density` - Connectivity intensity of the room network
- `avg_shortest_path` - Average minimum walking distance between rooms
- `mean_depth` - Average connectivity depth in the space
- `integration` - How central/well-connected the space is (1/mean_depth)

#### Functional Zoning Features (`features/functional_zoning_features.csv`)
- `public_private_separation` - Isolation degree of private vs. public zones
- `bathroom_adjacency` - Proximity of bathrooms to bedrooms/living areas
- `service_area_ratio` - Proportion of utility/service spaces

#### Plan-Level Features (`features/plan_level_features.csv`)
- `efficiency` - Usable area / gross area ratio
- `corridor_ratio` - Circulation space as % of total area
- `rooms_with_window_ratio` - Percentage of rooms with external windows
- `cross_ventilation_ratio` - Rooms opening on opposite sides
- `window_wall_ratio` - Window area / external wall area

### Datasets

| Dataset | Records | Purpose |
|---------|---------|---------|
| `cubicasa5k/` | 1000+ SVGs | Source floorplan collection (mixed quality) |
| `parsed_floorplans/` | ~1000 JSON | Pre-parsed structures for efficient loading |
| `dataset_with_dqi.csv` | ~4000 | Complete dataset with extracted features + DQI |
| `rooms_dataset.csv` | Varies | Individual room attributes and spatial data |
| `cubicasa_plan_index.csv` | 1000+ | Plan metadata and indexing |

---

## Design Quality Index (DQI)

### Scoring Formula

The Design Quality Index combines 5 weighted architectural dimensions:

$$\text{DQI Score} = (0.25 \times E + 0.20 \times Z + 0.20 \times L + 0.15 \times P + 0.20 \times C) \times 10$$

**Final Score Range**: 0-10

### Dimensions

| Dimension | Weight | Components | Interpretation |
|-----------|--------|------------|-----------------|
| **E (Efficiency)** | 25% | Space efficiency + (1 - corridor_ratio) + room_area | How well space is utilized |
| **Z (Zoning)** | 20% | Public/private separation + bathroom_adjacency + (1 - service_ratio) | Functional organization |
| **L (Lighting & Ventilation)** | 20% | Window ratio + cross_ventilation + window_wall_ratio | Natural light & airflow quality |
| **P (Proportions)** | 15% | Compactness + rectangularity + aspect_ratio | Aesthetic room proportions |
| **C (Circulation)** | 20% | Integration + normalized_depth + path_efficiency | Movement & flow through space |

### Quality Classifications

| DQI Range | Classification | Interpretation |
|-----------|----------------|-----------------|
| 0.0 - 4.0 | **Poor** | Significant design issues; major improvements needed |
| 4.0 - 6.0 | **Average** | Acceptable but with optimization opportunities |
| 6.0 - 8.0 | **Good** | Well-designed; minor refinements possible |
| 8.0 - 10.0 | **Excellent** | Outstanding design across all dimensions |

### Usage in Model

The DQI serves as:
1. **Target Variable**: For training quality prediction models
2. **Quality Metric**: For evaluating floorplan designs
3. **Feedback Tool**: For architects to compare designs against benchmarks
4. **Basis for Suggestions**: Design improvement engine targets weak dimensions

---

## Development Guide

### Running Notebooks for Analysis

Each notebook in `quality_check_model/` documents a specific analysis stage:

#### Data Discovery
- `dataset_loader.ipynb` - Load CubiCasa5K data, explore statistics
- `prepare_dataset.ipynb` - Data cleaning, normalization, validation

#### Feature Engineering
- `room_detection.ipynb` - Extract rooms from SVG, visualize geometry
- `geometric_features.ipynb` - Compute per-room geometric metrics
- `graph_construction.ipynb` - Build and analyze room connectivity graphs
- `spatial_syntax_features.ipynb` - Calculate integration, depth, density
- `functional_zoning_features.ipynb` - Compute public/private separation
- `plan_level_features.ipynb` - Compute plan-wide efficiency metrics
- `merge_features.ipynb` - Consolidate all features into unified dataset

#### Modeling
- `dqi_calculation.ipynb` - Implement DQI scoring algorithm
- `ml_model_training.ipynb` - Train quality prediction model
- `floorplan_evaluator.ipynb` - Evaluate model performance

### Adding New Features

1. Create analysis notebook in appropriate directory
2. Implement feature computation using utilities in `utils/`
3. Add results to feature CSV in `features/`
4. Update `merge_features.ipynb` to include new features
5. Retrain `ml_model_training.ipynb`

### Extending the API

Modify `app.py` to add endpoints:

```python
@app.post("/new-endpoint/")
async def new_endpoint(floorplan_data):
    # Implement analysis logic
    return results
```

### Integration with LLM

`floorplan_ai_assistant.py` uses Groq API for AI-powered insights:

```python
# Query LLM for design suggestions
response = llm_client.query(floorplan_context, user_question)
```

Requires `GROQ_API_KEY` in `.env` file.

---

## Requirements

**Python**: 3.8+

**Key Dependencies**:
- `pandas==2.2.2`, `numpy==1.26.4` - Data processing
- `scikit-learn==1.4.2`, `scipy==1.12.0` - Machine learning & statistics
- `networkx==3.3` - Graph analysis
- `shapely==2.0.4`, `svgpathtools==1.6.1` - Geometric operations
- `lxml==5.2.1` - SVG parsing
- `opencv-python==4.9.0.80`, `Pillow==10.3.0` - Image processing
- `matplotlib==3.8.4`, `seaborn==0.13.2` - Visualization
- `jupyter==1.0.0` - Interactive notebooks
- `tqdm==4.66.4`, `python-dotenv==1.0.1` - Utilities

See [quality_check_model/requirements.txt](quality_check_model/requirements.txt) for exact versions.

---

## License and Attribution

This project is provided for educational and research purposes. The cost prediction model uses Iranian real estate data, and the design quality model is trained on the **CubiCasa5K dataset**. Use the code and data at your own risk, and ensure compliance with original dataset licenses and terms of use.

---

## Contact & Support

For questions about:
- **Cost Prediction**: See `cost_prediction_model/README.md` patterns
- **Design Quality**: Review relevant notebooks in `quality_check_model/`
- **API Usage**: Check `quality_check_model/app.py` documentation
- **Features**: Consult feature engineering notebooks
