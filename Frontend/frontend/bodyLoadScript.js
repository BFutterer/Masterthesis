/* bodyLoadScript
 * This file contains all functions which are called when the page is loaded completely:
 *  - make a map
 *  - crate a pane for the isochrones and set its z-index higher than the z-index of standard overlays
 *  - add OSM tile layer to map
 *  - add sidebar, scale, geocoder, menu button to map
 *
 *  L = Leaflet
 *
 *  Documentation for Valhalla isochrone at https://mapzen.com/documentation/mobility/isochrone/api-reference/
 */

function onBodyLoad(){
  var minutes = 4;																											        //default values of the variables which are used in more than one function, cannot be null
  var city = "Kreuzlingen";

  //create a map
  //initialize the map and set its view to the chosen geographcal coordinates (latitude/Breitengrad, longitude/Längengrad, zoom level)
   map = L.map('map').setView([47.6, 9.15], 13);                                //47.6, 9.15 (Kreuzlingen)

  //create a pane for the isochrones																		        //http://leafletjs.com/examples/map-panes/
  map.createPane('isochronePane');

  //set z-Indexes for the pane
  map.getPane('isochronePane').style.zIndex = 401;					                    //https://gis.stackexchange.com/questions/20331/how-to-change-leaflet-map-panes-layering-order-z-index
  //information: leaflet-overlay-pane (Pane for vector overlays (Paths), like Polylines and Polygons): z-index: 400 (see http://leafletjs.com/reference-1.0.0.html#map-pane)

  //use osm tiles
  osmLayer = L.tileLayer('http://b.tile.openstreetmap.org/{z}/{x}/{y}.png', {		//add a OSM tile layer to add to the map
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributers'	//Copyright
  });
  osmLayer.addTo(map);

  //add sidebar to the map
  var sidebar = L.control.sidebar('sidebar', {
    closeButton: true,
    position: 'left'																										        //possibilities for position: left or right
  });
  map.addControl(sidebar);

  //add a scale bar to the map
  L.control.scale().addTo(map);

  //add Geocoder to the map
  var osmGeocoder = new L.Control.OSMGeocoder({placeholder: 'Search location...'});
  map.addControl(osmGeocoder);
  $(".leaflet-control-geocoder").addClass("leaflet-bar easy-button-container leaflet-control");		//add the elements of the class leaflet-control-geocoder to these 3 classes, these can be changed in Control.OSMGeocoder.css)

  //add menu button to the map
  L.easyButton('<span id="menuButton">&equiv;</span>', function(){
    sidebar.toggle();
  }, 'Menu and settings').addTo(map);

  //hook up the callback (set onClick-Listener)
  map.on('click', getLocation);

  //run exportFunction if export button is clicked
  document.getElementById('export').onclick = exportFunction;	                  //not the function is called, but the function is trasfered as object (like a variable)
}
