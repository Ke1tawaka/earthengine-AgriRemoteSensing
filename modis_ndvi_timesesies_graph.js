var geometry = /* color: #0b4a8b */ee.Geometry.Point([139.2026711630873, 37.68588734571812]),
    geometry2 = /* color: #d63000 */ee.Geometry.Point([136.2490923333221, 35.071430162982374]),
    geometry3 = /* color: #98ff00 */ee.Geometry.Point([130.90498900886223, 32.86309130939945]);
var countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw"),
    Terra16 = ee.ImageCollection("MODIS/006/MOD13Q1"),
    Aqua16 = ee.ImageCollection("MODIS/006/MYD13Q1");


// Specify name of country. 
var country_names = ['Japan']; 
// select the country from the fusion table
var region = countries.filter(ee.Filter.inList('Country', country_names)).geometry();

var ndviVis = {
  min: 0.0,
  max: 8000.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],};
  
var point1 = ee.Feature(    
    geometry,
    {label: 'RedOne'});
var point2 = ee.Feature(  
    geometry2,
    {label: 'GreenOne'});
var point3 = ee.Feature(  
    geometry3,
    {label: 'BlueOne'});
var pts = ee.FeatureCollection([point1,point2,point3]);

// set vis start date
var startdate = ee.Date.fromYMD(2016,1,1);
var enddate = ee.Date.fromYMD(2016,12,30);

// filter the data collection
var s2_terra_image =  Terra16
  .filterDate(startdate, enddate)
  .filterBounds(region)
  .select('NDVI')
  .map(function(image){return image.clip(region)}) ;
  
var s2_aqua_image =  Aqua16
  .filterDate(startdate, enddate)
  .filterBounds(region)
  .select('NDVI')
  .map(function(image){return image.clip(region)}) ;

// merge collections
var MOD_merged = s2_terra_image.merge(s2_aqua_image)

// sort by date
var MOD_merge_sorted = MOD_merged.sort("system:time_start")
print(MOD_merge_sorted)


var polygon = ee.Geometry.Polygon([
  [geometry,geometry2,geometry3]]);

var centroid = polygon.centroid();

Map.centerObject(centroid,6)

//make time series graph

var tempTimeSeries = ui.Chart.image.seriesByRegion({
  imageCollection: MOD_merge_sorted,
  regions: pts,
  reducer: ee.Reducer.mean(),
//  band: 'EVI',
  scale: 200,
  xProperty: 'system:time_start',
  seriesProperty: 'label'
});
tempTimeSeries.setChartType('ScatterChart');
tempTimeSeries.setOptions({
  title: 'Temporal sequence of NDVI in '+country_names,
  vAxis: {
    title: 'NDVI'
  },
  lineWidth: 1,
  pointSize: 4,
  series: {
    0: {color: '#d63000'},
    1: {color: '#98ff00'},
    2: {color: '#0b4a8b'}
  }
});
print(tempTimeSeries);
