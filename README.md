# Cost Prediction Model

This directory contains a simple prototype for estimating construction costs using building features. The current implementation is a Jupyter notebook that performs a basic linear regression on a sample dataset.

## Contents

- `dataset1.csv` – dataset containing building features and construction cost estimates (see [Dataset Features](#dataset-features) below).
- `linear_regression.ipynb` – notebook demonstrating data loading, preprocessing, train/test split, model training, prediction and evaluation metrics.

## Dataset Features

The dataset includes the following variables (columns):

| Feature | Description | Unit |
|---------|-------------|------|
| **V-1** | Project locality defined in terms of zip codes | N/A (categorical) |
| **V-2** | Total floor area of the building | m² |
| **V-3** | Lot area | m² |
| **V-4** | Total preliminary estimated construction cost (beginning of project prices) | 10,000 IRR |
| **V-5** | Preliminary estimated construction cost (beginning of project prices) | 10,000 IRR |
| **V-6** | Equivalent preliminary estimated construction cost (in selected base year prices) | 10,000 IRR |
| **V-7** | Duration of construction | time units |
| **V-8** | Price per unit at the beginning of project | 10,000 IRR/m² |
| **V-10** | Target variable (actual construction cost or final cost estimate) | 10,000 IRR |

### Feature Notes

- **V-1** is categorical (zip code) and may need encoding.
- **V-4, V-5, V-6, V-8, V-10** are in units of 10,000 Iranian Rial (IRR).
- **V-4, V-5, V-6** represent different cost estimates and inflation adjustments.
- **V-10** is the target variable for the regression model.

## Usage

1. Open `linear_regression.ipynb` in Jupyter or VS Code.
2. Inspect the preprocessing section to clean and normalize data. Modify as needed for your own features.
3. Run all cells to train a `LinearRegression` model and compute evaluation scores (R², MAE, MSE, RMSE).
4. Adapt the notebook to use a larger dataset, cross-validation, alternative models, and feature engineering.

## Extending the project

To move beyond this prototype:

- **Data preparation**: collect more realistic building data, handle missing values, categorical variables, outliers, and external factors such as location-based cost indices or inflation.
- **Model development**: experiment with different algorithms (ridge, random forest, XGBoost, etc.) and perform hyperparameter tuning.
- **Evaluation**: implement robust validation (cross-validation, residual analysis) and track multiple metrics.
- **Automation**: convert notebook logic into standalone scripts or modules, and save preprocessing artifacts (`scaler`, encoders) with the model.
- **Deployment**: provide a CLI/API to input building features and return a cost estimate, with uncertainty measures.

## License and attribution

This prototype is provided for educational purposes and does not represent a production-ready system. Use the code and data at your own risk.
