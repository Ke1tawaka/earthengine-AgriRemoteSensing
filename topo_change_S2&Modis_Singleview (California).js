var cliparea = 
    /* color: #24d609 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-121.69996653416617, 40.09329318009501],
          [-121.69996653416617, 39.42610297322932],
          [-120.57936106541617, 39.42610297322932],
          [-120.57936106541617, 40.09329318009501]]], null, false),
    s2_1c = ee.ImageCollection("COPERNICUS/S2"),
    S2 = ee.ImageCollection("COPERNICUS/S2_SR"),
    Center = 
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.Point([-121.13814337719135, 39.70971107739959]),
    cliparea4hist = 
    /* color: #11d6d1 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-121.23163087807634, 39.773060280358926],
          [-121.23163087807634, 39.526692005919884],
          [-120.89242799721697, 39.526692005919884],
          [-120.89242799721697, 39.773060280358926]]], null, false),
    geometry = 
    /* color: #ff0000 */
    /* shown: false */
    ee.Geometry.Point([-121.19719964698075, 39.660152352930396]),
    geometry2 = 
    /* color: #50ff00 */
    /* shown: false */
    ee.Geometry.Point([-121.67524013674073, 39.54131968416673]),
    geometry3 = 
    /* color: #001aff */
    /* shown: false */
    ee.Geometry.Point([-121.0941663757544, 39.63392336102186]),
    Terra16 = ee.ImageCollection("MODIS/006/MOD13Q1"),
    Aqua16 = ee.ImageCollection("MODIS/006/MYD13Q1"),
    output = 
    /* color: #c6d616 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-121.52646883829924, 39.96350471010554],
          [-121.52646883829924, 39.51788120566474],
          [-120.75055941447111, 39.51788120566474],
          [-120.75055941447111, 39.96350471010554]]], null, false);

// NDVI parameter
var visparam_ndvi = [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555',
    'FCD163', '99B718', '74A901', '66A000',
    '529400', '3E8601', '207401', '056201',
    '004C00', '023B01', '012E01', '011D01',
    '011301'
];
// NDVI diff parameter
var visparam_diff = ['FFFFFF', 'FF0000'];

var point1 = ee.Feature(    
geometry,
{label: 'RedPoint'});
var point2 = ee.Feature(  
geometry2,
{label: 'GreenPoint'});
var point3 = ee.Feature(  
geometry3,
{label: 'BluePoint'});
var pts = ee.FeatureCollection([point1,point2,point3]);

// After imaes
var s2_bf = ee.ImageCollection(S2.filterBounds(cliparea).filterDate('2020-07-01', '2020-07-20')
.filterMetadata("CLOUDY_PIXEL_PERCENTAGE","not_greater_than",5));
// Before images
var s2_af = ee.ImageCollection(S2.filterBounds(cliparea).filterDate('2020-10-01', '2020-10-20')
.filterMetadata("CLOUDY_PIXEL_PERCENTAGE","not_greater_than",5));

// checking images
print(s2_af);
print(s2_bf);

// image composite with median
var s2_af_sc = s2_af.reduce(ee.Reducer.median()).clip(cliparea);
var s2_bf_sc = s2_bf.reduce(ee.Reducer.median()).clip(cliparea);

// before & after NDVI
var s2_af_sc_ndvi = s2_af_sc.normalizedDifference(['B8_median', 'B4_median']);
var s2_bf_sc_ndvi = s2_bf_sc.normalizedDifference(['B8_median', 'B4_median']);

// Fter NDVI - Before NDVI
var diff_ndvi = s2_af_sc_ndvi.subtract(s2_bf_sc_ndvi);

// Histogram around the affected area
var histogram = ui.Chart.image.histogram(diff_ndvi, cliparea4hist, 30)
.setSeriesNames(['NDVI']);
print(histogram);

/*
threshhold decided from graph (16thNov 3,381 - 5thSep_ndvi 7,911)/10000=-0.45
*/
// image bainarize
var result = diff_ndvi.lt(-0.4);

// MODIS Graph section
var startdate = ee.Date.fromYMD(2020,1,1);
var enddate = ee.Date.fromYMD(2020,12,20);

// filter the data collection
var s2_terra_image =  Terra16
.filterDate(startdate, enddate)
.filterBounds(cliparea)
.select('NDVI')
.map(function(image){return image.clip(cliparea)}) ;

var s2_aqua_image =  Aqua16
.filterDate(startdate, enddate)
.filterBounds(cliparea)
.select('NDVI')
.map(function(image){return image.clip(cliparea)}) ;

// merge collections
var MOD_merged = s2_terra_image.merge(s2_aqua_image);

// sort by date
var MOD_merge_sorted = MOD_merged.sort("system:time_start");
print(MOD_merge_sorted);

/* for center of three points 
var polygon = ee.Geometry.Polygon([
[geometry,geometry2,geometry3]]);
var centroid = polygon.centroid();
Map.centerObject(centroid,11)
*/

Map.centerObject(Center,10);

//modis ndvi graph
var tempTimeSeries = ui.Chart.image.seriesByRegion({
imageCollection: MOD_merge_sorted,
regions: pts,
reducer: ee.Reducer.mean(),
scale: 200,
xProperty: 'system:time_start',
seriesProperty: 'label'});
tempTimeSeries.setChartType('ScatterChart');
tempTimeSeries.setOptions({
title: 'Temporal sequence of NDVI in AOI',
vAxis: {title: 'NDVI'},
lineWidth: 1,
pointSize: 4,
series: {
0: {color: '#d63000'},
1: {color: '#98ff00'},
2: {color: '#0b4a8b'}
}});
print(tempTimeSeries);

//addlayer
Map.addLayer(s2_af_sc,
{
bands: ['B4_median', 'B3_median', 'B2_median'], 
min: 0,max: 2500
},'TrueColor_After');
Map.addLayer(s2_bf_sc,
{
bands: ['B4_median', 'B3_median', 'B2_median'], 
min: 0,max: 2500
},'TrueColor_Before');
Map.addLayer(s2_af_sc,
{
bands: ['B8_median', 'B4_median', 'B3_median'], 
min: 0,max: 2500
},'FalseColor_After');
Map.addLayer(s2_bf_sc,
{
bands: ['B8_median', 'B4_median', 'B3_median'], 
min: 0,max: 2500
},'FalseColor_Before');
Map.addLayer(
s2_af_sc_ndvi, 
{min: 0, max: 1, palette: visparam_ndvi}, 'NDVI_After');
Map.addLayer(
s2_bf_sc_ndvi, 
{min: 0, max: 1, palette: visparam_ndvi}, 'NDVI_Before');

Map.addLayer(
result, 
{min: 0, max: 1, palette: visparam_diff}, 'Subtruct');
/*
Export.image.toDrive({
image:s2_af_sc,
description: 'Truecolor_af',
scale: 30,
region: output,
maxPixels:34089663741});

Export.image.toDrive({
image:s2_bf_sc,
description: 'Truecolor_bf',
scale: 30,
region: output,
maxPixels:34089663741});

Export.image.toDrive({
image:s2_af_sc_ndvi,
description: 'NDVI_After',
scale: 30,
region: output,
maxPixels:34089663741});

Export.image.toDrive({
image:s2_bf_sc_ndvi,
description: 'NDVI_Before',
scale: 30,
region: output,
maxPixels:34089663741});

Export.image.toDrive({
image:result,
description: 'ndvi_diff',
scale: 30,
region: output,
maxPixels:34089663741});
*/