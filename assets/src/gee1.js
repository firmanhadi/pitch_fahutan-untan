
var geometry2 = ee.FeatureCollection("users/efha94/aoi_kubu"); //Area of Interest

// FUNCTIONS

//mask clouds
function maskCloud(image) {
    var QA60 = image.select(['QA60']);
    var B1 = image.select(['B1']).gt(1500);
    var mask1 = image.updateMask(QA60.lt(1));
    return mask1.updateMask(B1.lt(1));
  }
  
  //add indices
  function addIndices(image) {
   var a = image.addBands(image.normalizedDifference(['B8', 'B4']).rename('NDVI'));
   var b = a.addBands(a.normalizedDifference(['B3', 'B8']).rename('NDWI'));
   var c = b.addBands(b.expression(
        '(B8 / B2) - (B8 / B3)', {
          'B8': image.select(['B8']),
          'B2': image.select(['B2']),
          'B3': image.select(['B3'])
        }
      ).rename('ARI'));
    var d = c.addBands(c.expression(
        '(B4 - B2) / B5', {
          'B4': image.select(['B4']),
          'B2': image.select(['B2']),
          'B5': image.select(['B5'])
        }
      ).rename('PSRI'));
    return d.addBands(d.expression(
        '705 + 35*((((RED + RE3)/2) - RE1) / (RE2 - RE1))', {
          'RE1': image.select(['B5']),
          'RE2': image.select(['B6']),
          'RE3': image.select(['B7']),
          'RED' : image.select(['B4'])
        }
      ).rename('REIP'));
  }
  
  

// Import Data (Sentinel-1)

var collection_VV = ee.ImageCollection('COPERNICUS/S1_GRD').
filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).
filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')).
select('VV').
filterBounds(geometry2);

var collection_VH = ee.ImageCollection('COPERNICUS/S1_GRD').
filter(ee.Filter.eq('instrumentMode', 'IW')).
filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')).
filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING')).
select('VH').
filterBounds(geometry2);

var kering_VV = collection_VV.filterDate('2018-05-01', '2018-08-31');
var basah_VV = collection_VV.filterDate('2018-09-01', '2019-04-30');

var kering_VH = collection_VH.filterDate('2018-05-01', '2018-08-31');
var basah_VH = collection_VH.filterDate('2018-09-01', '2019-04-30');

// Calculate minumum

var min_basah_VV = basah_VV.min();
var min_kering_VV = kering_VV.min();
var min_basah_VH = basah_VH.min();
var min_kering_VH = kering_VH.min();

// Calculate maximum
var max_basah_VV = basah_VV.max();
var max_kering_VV = kering_VV.max();
var max_basah_VH = basah_VH.max();
var max_kering_VH = kering_VH.max();

// Clip by geometry2

var clip_max_basah_VV = max_basah_VV.clip(geometry2);
var clip_max_kering_VV = max_kering_VV.clip(geometry2);
var clip_max_basah_VH = max_basah_VH.clip(geometry2);
var clip_max_kering_VH = max_kering_VH.clip(geometry2);


var clip_min_basah_VV = min_basah_VV.clip(geometry2);
var clip_min_kering_VV = min_kering_VV.clip(geometry2);
var clip_min_basah_VH = min_basah_VH.clip(geometry2);
var clip_min_kering_VH = min_kering_VH.clip(geometry2);


var VVWETMAX = clip_max_basah_VV;
var VVDRYMAX = clip_max_kering_VV;
var VHWETMAX = clip_max_basah_VH;
var VHDRYMAX = clip_max_kering_VH;
var VVWETMIN = clip_min_basah_VV;
var VVDRYMIN = clip_min_kering_VV;
var VHWETMIN = clip_min_basah_VH;
var VHDRYMIN = clip_min_kering_VH;

///////////////////////////////////////////////////////////////
//Get Sentinel-2 image stack
///////////////////////////////////////////////////////////////
var S2 = ee.ImageCollection('COPERNICUS/S2')
  .filterDate('2018-05-15', '2018-06-30')
  .filterBounds(geometry2);
var S2_1 = ee.ImageCollection('COPERNICUS/S2')
  .filterDate('2018-07-01', '2018-08-31')
  .filterBounds(geometry2);
var S2 = ee.ImageCollection(S2.merge(S2_1));
///////////////////////////////////////////////////////////////
//END
///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//Map functions over image stack
///////////////////////////////////////////////////////////////
var S2 = S2.map(maskCloud);
var S2 = S2.map(addIndices);
///////////////////////////////////////////////////////////////
//END
///////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////
//Get median value of each index and band and add to map
///////////////////////////////////////////////////////////////
var B2 = S2.select(['B2']).median();
var B3 = S2.select(['B3']).median();
var B4 = S2.select(['B4']).median();
var B8 = S2.select(['B8']).median();
var NDVI = S2.select(['NDVI']).median();
var NDWI = S2.select(['NDWI']).median();
var ARI = S2.select(['ARI']).median();
var PSRI = S2.select(['PSRI']).median();
var REIP = S2.select(['REIP']).median();

///////////////////////////////////////////////////////////////
//Clip to Kubu Raya
///////////////////////////////////////////////////////////////
var B2 = B2.clip(geometry2);
var B3 = B3.clip(geometry2);
var B4 = B4.clip(geometry2);
var B8 = B8.clip(geometry2);
var NDVI = NDVI.clip(geometry2);
var NDWI = NDWI.clip(geometry2);
var ARI = ARI.clip(geometry2);
var PSRI = PSRI.clip(geometry2);
var REIP = REIP.clip(geometry2);
///////////////////////////////////////////////////////////////


var colorbrewer = require('users/gena/packages:colorbrewer');

// Display map
Map.centerObject(geometry2, 8);
Map.addLayer(clip_min_basah_VV, {min:-30,max:0}, 'Musim hujan (minimum VV) ');
Map.addLayer(clip_min_kering_VV, {min:-30,max:0}, 'Musim kemarau (minimum VV)');
Map.addLayer(clip_max_basah_VV, {min:-30,max:0}, 'Musim hujan (maximum VH)');
Map.addLayer(clip_max_kering_VV, {min:-30,max:0}, 'Musim kemarau (maximum VH)');
Map.addLayer(clip_min_basah_VH, {min:-30,max:0}, 'Musim hujan (minimum VV) ');
Map.addLayer(clip_min_kering_VH, {min:-30,max:0}, 'Musim kemarau (minimum VV)');
Map.addLayer(clip_max_basah_VH, {min:-30,max:0}, 'Musim hujan (maximum VH)');
Map.addLayer(clip_max_kering_VH, {min:-30,max:0}, 'Musim kemarau (maximum VH)');

Map.addLayer(NDVI, {min:-0.5, max:0.9, palette: colorbrewer.Palettes.RdYlGn[11]}, 'NDVI');
Map.addLayer(NDWI, {min:-1, max:1, palette: colorbrewer.Palettes.Blues[9]}, 'NDWI');
Map.addLayer(ARI, {min:-1, max:0.3, palette: colorbrewer.Palettes.PRGn[11]}, 'ARI');
Map.addLayer(PSRI, {min:-1, max:1, palette: colorbrewer.Palettes.PRGn[11]}, 'PSRI');
Map.addLayer(REIP, {min:715, max:730, palette: colorbrewer.Palettes.PRGn[11]}, 'REIP');
///////////////////////////////////////////////////////////////
//END
///////////////////////////////////////////////////////////////

//Classification

var S2Composite = B2.addBands([B3.B4.B8.NDVI.NDWI.ARI.PSRI.REIP]);
var S1Composite = VVWETMAX.VVWETMIN.VVDRYMAX.VVDRYMIN.VHWETMAX.VHWETMIN.VHDRYMAX.VHDRYMIN;
var newComposite = S2Composite(S1Composite);


var bands =['B2', 'B3', 'B4', 'B8', 'NDVI', 'NDWI','ARI', 'PSRI','REIP', 'VVWETMAX','VVDRYMAX','VHWETMAX','VHDRYMAX','VVWETMIN','VVDRYMIN','VVWETMIN','VHDRYMIN'];

// merge all training file geometries into a single vector
var training_pts = urban.merge(vegetation).merge(water);

// get the spectral reflectance under the training points
var training = newComposite.select(bands).sampleRegions({
  collection: training_pts, 
  properties: ['class'], 
  scale: 30
});



//Export Sentinel-1 images to drive
///////////////////////////////////////////////////////////////


// Export the image, specifying scale and region.
Export.image.toDrive({
    image: clip_min_basah_VV,
    description: '00_KubuRaya_Min_Basah_VV',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_min_kering_VV,
    description: '00_KubuRaya_Min_Kering_VV',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_max_basah_VV,
    description: '00_KubuRaya_Max_Basah_VV',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_max_kering_VV,
    description: '00_KubuRaya_Max_Kering_VV',
    scale: 30,
    region: geometry2
  });
  
  // Export the image, specifying scale and region.
  Export.image.toDrive({
    image: clip_min_basah_VH,
    description: '00_KubuRaya_Min_Basah_VH',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_min_kering_VH,
    description: '00_KubuRaya_Min_Kering_VH',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_max_basah_VH,
    description: '00_KubuRaya_Max_Basah_VH',
    scale: 30,
    region: geometry2
  });
  
  
  Export.image.toDrive({
    image: clip_max_kering_VH,
    description: '00_KubuRaya_Max_Kering_VH',
    scale: 30,
    region: geometry2
  });
  

///////////////////////////////////////////////////////////////
//Export Sentinel-2 indices to drive
///////////////////////////////////////////////////////////////
Export.image.toDrive({
  image: B2,
  description: '00_KubuRaya_B2',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: B3,
  description: '00_KubuRaya_B3',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: B4,
  description: '00_KubuRaya_B4',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: B8,
  description: '00_KubuRaya_B8',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: NDWI,
  description: '00_KubuRaya_NDWI',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: NDVI,
  description: '00_KubuRaya_NDVI',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: ARI,
  description: '00_KubuRaya_ARI',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: PSRI,
  description: '00_KubuRaya_PSRI',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
Export.image.toDrive({
  image: REIP,
  description: '00_KubuRaya_REIP',
  scale: 30,
  region: geometry2,
  maxPixels: 10E10
});
///////////////////////////////////////////////////////////////
//END
///////////////////////////////////////////////////////////////

