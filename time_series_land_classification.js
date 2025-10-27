// Filter citra Landsat 8 Collection 2 Tier 1 TOA tahun 2024 dengan cloud cover ≤ 5%
// 1. Load Koleksi Citra Landsat 8 Collection 2 Tier 1 Realtime TOA Reflectance
var landsat8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_RT_TOA") // Landsat 8 Realtime TOA Reflectance
  .filterBounds(table) // Filter berdasarkan AOI
  .filterDate('2024-01-01', '2024-12-31') // Filter berdasarkan rentang tanggal
  .filter(ee.Filter.lt('CLOUD_COVER', 5)) // Filter berdasarkan persentase awan
  .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10']); // Pilih band RGB dan NIR (B4, B3, B2, B5)

// 2. Hitung NDVI untuk setiap citra dalam koleksi
var ndviCollection = landsat8.map(function(image) {
  var ndvi = image.normalizedDifference(['B5', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
});

// 3. Ambil citra median untuk mengurangi noise
var all_bands = ndviCollection.median().clip(table);
print('All bands', all_bands);

// Tampilkan Citra di Peta
Map.centerObject(table, 10);
Map.addLayer(all_bands, {bands: ['B4', 'B3', 'B2'], min: 0.07740091620202097, max: 0.13516986614570664, gamma: 1.4}, 'Landsat 8 RGB');

// Klasifikasi Tutupan Lahan KHDTK
// Pembuatan kelas dan perhitungan sampel
var kelas = Hutan_Jati.merge(Ladang_Jagung).merge(Perkebunan_Tebu).merge(Semak_Belukar).merge(Lahan_Terbuka).merge(Sawah);
var bands = ['B4', 'B3', 'B2', 'B5', 'NDVI'];
var selected_input = all_bands.select(bands);

var samples = selected_input.sampleRegions({
  collection: kelas,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

var Tot_hj = selected_input.sampleRegions({
  collection: Hutan_Jati,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

var Tot_la = selected_input.sampleRegions({
  collection: Ladang_Jagung,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

var Tot_pt = selected_input.sampleRegions({
  collection: Perkebunan_Tebu,
  properties: ['lc'],
  scale: 3
  
}).randomColumn('random');
var Tot_sb = selected_input.sampleRegions({
  collection: Semak_Belukar,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

var Tot_lt = selected_input.sampleRegions({
  collection: Lahan_Terbuka,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

var Tot_sa = selected_input.sampleRegions({
  collection: Sawah,
  properties: ['lc'],
  scale: 30
}).randomColumn('random');

print('Total Sampel n =', samples.aggregate_count('.all'));
print('Total Sampel Hutan_Jati =', Tot_hj.aggregate_count('.all'));
print('Total Sampel Ladang_Jagung =', Tot_la.aggregate_count('.all'));
print('Total Sampel Perkebunan_Tebu =', Tot_pt.aggregate_count('.all'));
print('Total Sampel Semak_Belukar =', Tot_sb.aggregate_count('.all'));
print('Total Sampel Lahan_Terbuka =', Tot_lt.aggregate_count('.all'));
print('Total Sampel Sawah =', Tot_sa.aggregate_count('.all'));

// Uji akurasi = 70% (training) dan 30% (validasi/testing)
// Split Sample
var split = 0.7;
var training = samples.filter(ee.Filter.lt('random', split));
var testing = samples.filter(ee.Filter.gte('random', split));
print('Training n =', training.aggregate_count('.all'));
print('Testing n =', testing.aggregate_count('.all'));


// Klasifikasi - Random Forest
var classifier = ee.Classifier.smileRandomForest({numberOfTrees: 100, seed: 1}).train({
  features: training,
  classProperty: 'lc',
  inputProperties: bands
});

var tuplah_KHDTK = selected_input.classify(classifier);
Map.addLayer(tuplah_KHDTK, {min: 1, max: 6, palette: ['036b14', 'ff0000', '00ff00', '0000ff', 'ff00ff', '009999']}, "Getas_2024");


// Uji Akurasi
var validation = testing.classify(classifier);
var testAccuracy = validation.errorMatrix('lc', 'classification');
print('Validation Error Matrix RF =', testAccuracy);
print('Validation Overall Accuracy RF =', testAccuracy.accuracy());



// Export data
Export.image.toDrive({
  image: tuplah_KHDTK,
  description: 'Getas_2024',
  folder: 'TUPLAH_GETAS',
  crs: 'EPSG:32748',
  scale: 30,
  fileFormat: 'GeoTIFF',
  region: table
});

// Analisis Spasial & Temporal Perubahan Tutupan Lahan KHDTK UGM Getas 1998-2024
// Training sample tahun 2024 digunakan untuk seluruh tahun
// Citra terbaik (CLOUD_COVER < 20%), median per tahun

// --- AOI dan Sample Training ---
// Pastikan 'table' dan semua FeatureCollection kelas (Hutan_Jati, dst) sudah tersedia di Assets atau script
var AOI = table; // Polygon AOI

// Gabungkan sample training 2024
var kelas = Hutan_Jati.merge(Ladang_Jagung)
  .merge(Perkebunan_Tebu)
  .merge(Semak_Belukar)
  .merge(Lahan_Terbuka)
  .merge(Sawah);
var bands = ['B4', 'B3', 'B2', 'B5', 'NDVI'];

// --- Fungsi Mendapatkan Koleksi Landsat --- //
function getLandsatCollection(year, aoi) {
  var start = ee.Date.fromYMD(year, 1, 1);
  var end = ee.Date.fromYMD(year, 12, 31);

  var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_TOA')
      .filterBounds(aoi)
      .filterDate(start, end)
      .filter(ee.Filter.lt('CLOUD_COVER', 20))
      .select(['B1','B2','B3','B4','B5','B7'], // Band sesuai urutan output agar konsisten
              ['B1','B2','B3','B4','B5','B7']);
  var l7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_TOA')
      .filterBounds(aoi)
      .filterDate(start, end)
      .filter(ee.Filter.lt('CLOUD_COVER', 20))
      .select(['B1','B2','B3','B4','B5','B7','B8'], // B8 = Pan, tidak dipakai
              ['B1','B2','B3','B4','B5','B7','B8']);
  var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
      .filterBounds(aoi)
      .filterDate(start, end)
      .filter(ee.Filter.lt('CLOUD_COVER', 20))
      .select(['B2','B3','B4','B5','B6','B7','B10'], // Untuk konsistensi: 'B2'->B1, dst
              ['B1','B2','B3','B4','B5','B6','B10']);

  // Pilih koleksi berdasarkan tahun (Landsat 5: t.s.d 2011, 7: 1999-2021, 8: 2013+)
  var collection = ee.ImageCollection([]);
  if (year <= 2011 && year >= 1998) {
    collection = l5.merge(l7);
  } else if (year > 2011 && year < 2013) {
    collection = l7;
  } else if (year >= 2013) {
    collection = l8;
  }
  return collection;
}

// --- Fungsi NDVI Standardisasi Band --- //
function addNDVI(image) {
  // Penamaan band harus disesuaikan dengan urutan standar (B4: Red, B5: NIR)
  var ndvi = image.normalizedDifference(['B5','B4']).rename('NDVI');
  return image.addBands(ndvi);
}

// --- Ambil Sampel Training dari Citra 2024 --- //
var landsat2024 = getLandsatCollection(2024, AOI)
  .map(addNDVI)
  .median()
  .clip(AOI);
var selected_input2024 = landsat2024.select(bands);

var samples = selected_input2024.sampleRegions({
  collection: kelas,
  properties: ['lc'],
  scale: 30 // Gunakan 30 m (standar resolusi Landsat)
}).randomColumn('random');

// Split training/validasi (optional, bila ingin uji akurasi)
var split = 0.7;
var training = samples.filter(ee.Filter.lt('random', split));
var testing = samples.filter(ee.Filter.gte('random', split));

// Latih Random Forest dengan training 2024
var classifier = ee.Classifier.smileRandomForest({numberOfTrees: 100, seed: 1}).train({
  features: training,
  classProperty: 'lc',
  inputProperties: bands
});

// --- Fungsi Klasifikasi per Tahun --- //
function classifyYear(year) {
  var collection = getLandsatCollection(year, AOI)
    .map(addNDVI);
  var median = collection.median().clip(AOI);
  var input = median.select(bands);

  var classified = input.classify(classifier)
    .set('year', year);

  // Visualisasi layer
  Map.addLayer(classified, 
    {min: 1, max: 6, palette: ['036b14', 'ff0000', '00ff00', '0000ff', 'ff00ff', '009999']},
    'LULC_' + year, false // nonaktifkan by default agar tidak berat
  );

  // Ekspor ke Google Drive
  Export.image.toDrive({
    image: classified,
    description: 'LULC_' + year,
    folder: 'TUPLAH_GETAS_TIMESERIES',
    crs: 'EPSG:32748',
    scale: 30,
    region: AOI,
    maxPixels: 1e13
  });
}

// --- Loop Klasifikasi 1998-2024 --- //
var years = ee.List.sequence(1998, 2024);
years.getInfo().forEach(function(y) {
  classifyYear(y);
});

// Tampilkan AOI di peta
Map.centerObject(AOI, 11);
Map.addLayer(AOI, {}, 'AOI');