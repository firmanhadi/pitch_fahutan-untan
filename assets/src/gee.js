var roi = Bandung;
var landsat8= ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");
// Define the location variable
// Never forget the ; 
var location = roi;

// Make your map centered to the location
Map.centerObject(roi);

// bands to be considered	
var Landsat_8_BANDS = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7' ];

// New standard naming scheme
var STD_NAMES       = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2'];

// make a function to obtain landsat 8 image from the collection
function getlandsat8(imageC, start_date, end_date, location){
  var l8_l1t = ee.ImageCollection(imageC)
  .filterDate(start_date, end_date) 	// extract images only within date range
  .filterBounds(location) 		// also specify the interested spatial bounds 
  .select(Landsat_8_BANDS, STD_NAMES)		// change the naming of the bands
   .median()
   ; 		// median will try to remove clouds (at the expense of information)
  return l8_l1t;		// return this image to the vat\riable where this function was called	
}

// Specify the start and end dates as fromYMD objects
var start_date = "2017-05-15"; 
var end_date = "2017-05-30";

// Get data by calling the function and specifying the call values
var l8_l1t = getlandsat8(landsat8, start_date, end_date, location);

// display whatever has been returned . wth band combinations.
Map.addLayer(l8_l1t, {bands: ['red', 'green', 'blue'], min:0, max:2500}, 'L8', 1);


// 1  -------------------------------------------------------------------

// make ndvi function
function addNDVI(image) {
  
  var result = image.addBands(image.normalizedDifference(['nir', 'red']).rename('NDVI'));
  
  return result;  }

// add a new band as  NDVI
var newComposite = addNDVI(l8_l1t);

// from newComposite , select only ndvi band
var ndviLayer = newComposite.select('NDVI');

// Display only the ndvi band
Map.addLayer(ndviLayer, {bands: ['NDVI']}, 'NDVI', 0);



// 2  -------------------------------------------------------------------

// bands to be used to extract training dataset
var bands =['blue', 'green', 'red', 'nir', 'swir1', 'swir2','NDVI' ]

// merge all training file geometries into a single vector
var training_pts = urban.merge(vegetation).merge(water);

// get the spectral reflectance under the training points
var training = newComposite.select(bands).sampleRegions({
  collection: training_pts, 
  properties: ['class'], 
  scale: 30
});







// 3  -------------------------------------------------------------------

var classifier = ee.Classifier.cart().train({
  features: training,
  classProperty : 'class',
  inputProperties: bands 
});

var CARTclassified = newComposite.select(bands).classify(classifier);

print(CARTclassified);

Map.addLayer(CARTclassified, {min:1, max:3, palette:['yellow', 'green','blue']}, 'classifiedimage', 1);






// 4 --------------------------------------------

                
Export.image.toDrive({
  image: CARTclassified,
  region: roi,
  description: "BandungL8",
  scale: 30.0
});