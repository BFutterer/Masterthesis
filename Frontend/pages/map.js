/* map
 * This file contains all functions which deal with file-handling:
 *  - Export of the drawn isochrones together with the starting position to a GeoJSON-file
 *  - Import of one or several GeoJSON-file(s) and draw the content of them into the map
 *  - Merge of several GeoJSON-files into a single one
 *
 *  L = Leaflet
 *  $ = jQuery
 */

 //define global variables
var geojson = null;
var tooltips = [];
var selectedCity;
var boundaryLayer;
var copyIsochrones;
var copyPosition;
var copyData;
var byteStringArray;
var startLocation;

//add isochrones to map
function addGeoJson(json) {
  geojson = L.geoJson(json, {
    style: function(feature) {
      return {
        opacity: feature.properties.opacity * 2,
        weight: 10,
        color: feature.properties.color,
        pane: 'isochronePane'																					          //add Layer to the isochronePane (see http://leafletjs.com/examples/map-panes/)
      };
    },
    onEachFeature: function(feature, layer) {
      var tooltip = layer.bindTooltip(feature.properties.contour + ' min', { sticky: true });	            //tooltip = Kurzinfo, defines what will be shown in case of a mouse-over (x min)
      tooltips.push(tooltip);
      tooltip.addTo(map);
    }
  });

  //render the geojson (creation of the picture data)
  geojson.addTo(map);
}

//get city boundary from OpenStreetMap and display them on the map
//send a request to nominatim to get te boundaries of a specified city or region
function getBoundaryURL(){
  //build url
  //first, fixed part of the url
  boundaryURL = 'http://nominatim.openstreetmap.org/search?format=jsonv2&polygon_geojson=1&q=';			        //http://nominatim.openstreetmap.org/search?ormat=jsonv2polygon_geojson=1&q=ORTSNAME
																																								                            //q = querry	term which is wanted
                                                                                                            //possible extension: limit=<integer>	Limit the number of returned results. Default is 10.
																																								                            //for further parameters see http://wiki.openstreetmap.org/wiki/Nominatim
  //add the wanted term to the first, fixed part
  boundaryURL += city;
  //write the complete URL which is sent to nominatim into the console
  console.log(boundaryURL);
  //call inspect function
  inspect();
}

//send a request to nominatim (boundaryURL) and display the names (display_name) of the response in the dropdown menu
function inspect(evt) {
  // send a HTTP GET request to nominatim by using jQuery
  $.get(																															          //https://stackoverflow.com/questions/247483/http-get-request-in-javascript		answer of nickf and Pistos
    boundaryURL,
    function(data) {
      //copy content of data into a global variable to be able to use the content outside of this function
      copyData = data;

      //get the selected city out of the avaiable possible cities in the dropdown menu
      var select = document.getElementById("selectedCity_value");
      //set the first entry of the select dropdown menu to "choose correct city"
      select.innerHTML = "<option value=100>choose correct city</option>";      //value=100 is needed to avoid errors in drawCityBoundary function
      //insert all display_name names into the dropdown menu to enable the user to select the right city
      for(i = 0; i < data.length; i++) {                                        //https://stackoverflow.com/questions/9895082/javascript-populate-drop-down-list-with-array answer of Felix Kling and Alex Turpin
        var options = data[i]["display_name"];                                  //display only the name (display_name) of the different answers of the response
        //var	val = i                             //löschen?
        var listElement = document.createElement("option");
        listElement.textContent = options;                                      //set the textContent of this listElement to the corresponding display_name entry of the respnse
        listElement.value = i;	                                                //set the value of this listElement to i (number of loops up to this)
        //information: value of listElement is equal to the number of the object in the response (0, 1, 2, ...). Needed to identify which object of the response is choosen and to display this
        console.log(listElement);                                               //write this entry into the console
        select.appendChild(listElement);                                        //add this entry to the dropdown list
      }
    }
  );
}

//draw the coosen city onto the map
function drawCityBoundary(){
  console.log (selectedCity);
  console.log ("copyData" + copyData);
  if (selectedCity == 100) {																					          //avoid error if user clicks at select correct city entry of dropdown menu
    alert("no city is chosen");
    console.log("no city is chosen");
  }else{
    boundaryLayer = new L.GeoJSON(copyData[selectedCity].geojson);              //https://stackoverflow.com/questions/11570669/leaflet-geojson-display
    //information: coordinates of the boundary of the selected city/region are stored in the variable boundaryLayer
    console.log(boundaryLayer);
    map.addLayer(boundaryLayer);																			          //add boundaryLayer to the map
  }
}

//delete boundary layer from the map
function deleteBoundaryLayer(){
  if(boundaryLayer != null){																					          //check if boundaryLayer exists
    map.removeLayer(boundaryLayer);																		          //delete boundaryLayer
  }
}

//capture undesired enter events to avoid errors           funktioniert noch nicht richtig
function handleEnter(e) {																								//change enter key press event		https://stackoverflow.com/questions/905222/enter-key-press-event-in-javascript
  if (e.keyCode === 13) {
    e.preventDefault(); // Ensure it is only this code that runs			//https://stackoverflow.com/questions/13987300/how-to-trigger-enter-key-press-of-textbox
    console.log("Enter was pressed");
    city = e.target.value;
    getBoundaryURL();
    //$("#selectedCity_value").simulate('mousedown');													//https://stackoverflow.com/questions/16056666/expand-select-dropdown			https://stackoverflow.com/questions/360431/can-i-open-a-dropdownlist-using-jquery
    return false;
  }
}

//clear map
function clearAllFromMap(){                                                     //https://stackoverflow.com/questions/28646317/how-to-remove-all-layers-and-features-from-map answer of iH8
  //clear all layers
  map.eachLayer(function (layer) {																		          //loop over all the layers added to the map using the eachLayer method of L.Map
    if(layer != osmLayer) {																						          //check if layer is not background-map layer (osmLayer)
      map.removeLayer(layer);																					          //call the removeLayer method of L.Map on each of them to delete
    }
  });

  //clear text fields
  document.getElementById("giveId").value = "";
  document.getElementById("city_value").value = "";
}

//get the coordinates where the user clicked at the map
function getLocation(e){
  startLocation = [{"lat":e.latlng.lat, "lon":e.latlng.lng}];
  position = e.latlng;																								          //different format in comparison to startLocation, needed for marker
  //call of the generateIsochrones function to compute the isochrones
  generateIsochrones();
}

/*compute the colors for the isochrones from green to red depending on the number of isochrones and change color from HSV system to RGB system
 *RGB color schema is needed for display colors on computer screen.
 *HSV color schema is needed for compute the color for each isochrone dependend on the number of isochrones, because it is easier to compute the values just for one scale (Hue-scale 0 to 1) insted of interdependent 3 scales (red, green, blue)
 */
function HSVtoRGB(h, s, v) {                                                    //http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately answer of Adam Price and Paul S.
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

//generate the isochrones
function generateIsochrones() {
  //check if a startLocation is set, if not return
  if(typeof startLocation == 'undefined') return;

  //draw as many isochrones as minutes defined for travel time and set their color automatically from green to red
  var contour = new Array();
  var localminutes = $("#minutes_value").val();
  var localsetId = $("#giveId").val();
  for(i=1; i <= localminutes; i++) {
    var color = HSVtoRGB((96/255)*(i-1)/(localminutes), 1, 1);	                //first color is red [((96/255)*(1-1)/(minutes-1), 1, 1) = 0], last color is green [((96/255)*(20-1)/(20-1), 1, 1) = 0.37]
    //information: 96= green value in HSV-system 255=maximum value in HSV-system, see https://github.com/FastLED/FastLED/wiki/FastLED-HSV-Colors
    contour[i - 1] = {"time": i,"color": "rgb("+color.r+","+color.g+","+color.b+")"};	//{"time":20,"color":"#abcdef"}		contour i-1 = i, because computer starts counting by 0, but minutes starts couning by 1
  }

  //build url to send to the backend for computation of the isochrones
  var url = 'http://localhost:8002/isochrone?json=';									          //origin: https://matrix.mapzen.com
  //example of a origin complete URL: https://matrix.mapzen.com/isochrone?json={"locations":[{"lat":40.744014,"lon":-73.990508}],"costing":"auto","contours":[{"time":15,"color":"ff0000"}]}&id=Walk_From_Office
  var json = {
    locations: startLocation,																					          //starting point, coordinates will be get by click onto the map, see  function
    costing: $("#select_vehicle").val(),															          //choose of the transportation mode: auto, bicycle, pedestrian, bus,...
    //information: $("#select_vehicle").val()		get value of element with Id select_vehicle
    contours: contour,																								          //syntax: {"time":20,"color":"#abcdef"}
    /*information:
     *the bigger the intervalls are, the longer the computation will last
     *color have to be specified the other way round (error in valhalla): (time 1, color for time =3) (time 2, color for time =2) (time 3, color for time =1)
     *"time": in minutes	"color": hexadecimal with # (wrong content in valhalla docs: without #, for example ff0000 instead of #ff0000 for red. But # is needed)
     * if color is not defined default colors are used instead
     */
    polygons: $("#polygon_value").val(),															          //true: filled polygons, false: isochrones
    denoise: $("#denoise_value").val(),																          //noise = Lärm, rauschen => denoise = entrauschen, values between 0 and 1
    generalize: $("#generalization_value").val(),											          //the higher the number, the stronger the generalization will be: standard value: 150
    //information: declaration in meter as tolerance value for the Douglas-Peuker algorithm
    id: encodeURIComponent(localsetId)																			    //name of the isochrone request
    //information: encodeURIComponent: to enable also special characters for the name. This changes this characters to %something for the request.
  };

  console.log(json);

  //creation of the complete URL (url + json) and convert the URL in an appropriate format
  url += escape(JSON.stringify(json));

  //grab the url
  $.getJSON(url,function computeIsochrones(isochrones){
    //clear geojson if its not null
    if(geojson != null)
      geojson.removeFrom(map);
    //clear the tooltips
    tooltips.forEach(function (tooltip) {															          //tooltips are in an array -> forEach (lika a loop)
        tooltip.removeFrom(map);
    });
    tooltips = [];

    //create the geojson object
    addGeoJson(isochrones);																						          // call of function addGeoJson to create the isochrones

    //copy the geojson response of valhalla (called isochrones) to a global variable
    copyIsochrones = isochrones;
    copyPosition = position;
  })

  //set a marker to the starting position
  //clear old marker and other layers
  map.eachLayer(function (layer) {																		          //Loop over all the layers added to the map using the eachLayer method of L.Map			https://stackoverflow.com/questions/28646317/how-to-remove-all-layers-and-features-from-map 	 answer of iH8
    if(layer != osmLayer) {																						          //if layer is not background-map layer delete it
      map.removeLayer(layer);																					          //call the removeLayer method of L.Map on each of them
      }
    });

  //set new marker
  var marker = L.marker(position);																				      //set a marker to the current clicked position
  map.addLayer(marker);
  marker.bindPopup("<b>Name:</b><br />"+localsetId.toString()+"<br /><b>Starting point:</b><br />"+position.toString());	   //display the coordinates of the clicked point in the popup window
}
