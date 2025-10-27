# Land Cover Classification and Change Analysis (1998-2024)
## KHDTK UGM Getas Forest Area

<img width="1858" height="885" alt="Screenshot 2025-10-28 012337" src="https://github.com/user-attachments/assets/7bf569d8-fef2-4347-b10f-6538652bc31b" />
 Classification]

## 📋 Project Overview
This project demonstrates automated land cover classification and temporal change analysis using Google Earth Engine for the KHDTK UGM Getas forest area. The analysis covers a 26-year period (1998-2024) using Landsat satellite imagery and machine learning algorithms.

## 🛠️ Technologies Used
- **Google Earth Engine** (JavaScript API)
- **Landsat Satellite Imagery** (Landsat 5, 7, 8 Collection 2)
- **Machine Learning** (Random Forest Classifier)
- **Remote Sensing** (NDVI, Spectral Analysis)

## 📊 Classification Scheme
The land cover is classified into 6 categories:
1. **Hutan Jati**  
2. **Ladang Jagung**  
3. **Perkebunan Tebu**  
4. **Semak Belukar**  
5. **Lahan Terbuka**  
6. **Sawah** 

## 🚀 Script Features

### 1. Data Preprocessing
- Cloud filtering (<5% for 2024, <20% for historical analysis)
- Atmospheric correction (TOA reflectance)
- NDVI calculation for vegetation analysis
- Multi-temporal image compositing (median)

### 2. Machine Learning Classification
- **Algorithm**: Random Forest (100 trees)
- **Input Features**: B2, B3, B4, B5, NDVI
- **Training/Validation Split**: 70%/30%
- **Accuracy Assessment**: Confusion matrix analysis

### 3. Temporal Analysis
- **Time Period**: 1998-2024 (26 years)
- **Satellite Data**: Landsat 5, 7, 8 (seamless integration)
- **Consistent Methodology**: Same classifier applied across all years

## 📁 Data Requirements

### Input Data (must be loaded in GEE Assets):
- `table`: Area of Interest (AOI) boundary
- `Hutan_Jati`: Teak forest training samples
- `Ladang_Jagung`: Corn field training samples  
- `Perkebunan_Tebu`: Sugarcane plantation training samples
- `Semak_Belukar`: Shrubland training samples
- `Lahan_Terbuka`: Bare land training samples
- `Sawah`: Rice field training samples

### Output Products:
- Land cover classification maps (1998-2024)
- Accuracy assessment reports
- GeoTIFF exports for further analysis

## 🖥️ How to Use

### 1. Setup in Google Earth Engine
```javascript
// Load the script in GEE Code Editor
// Ensure all FeatureCollections are imported to Assets
// Run the script step by step
