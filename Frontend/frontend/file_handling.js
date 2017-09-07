/* file handling
 * This file contains all functions which deal with file-handling:
 *  - checkOfFileAPI()      Check if File APIs (File, FileReader, FileList and Blob) that are needed for file handling are supported by the browser
 *  - exportFunction(e)     Export of the drawn isochrones together with the starting position to a GeoJSON file
 *  - handleFileSelect(evt) Import of one or several GeoJSON file(s) and draw the content of them into the map
 *  - mergeSelected(evt)    Merge of several GeoJSON files into a single one
 */

//check of File APIs
function checkOfFileAPI(){                                                      //https://www.html5rocks.com/en/tutorials/file/dndfiles/
  //Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
  //Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

//Export of isochrones and startpoint to a GeoJSON file
function exportFunction(e) {
  //check of File APIs
  checkOfFileAPI();

  if (copyPosition == null || copyIsochrones == null){
    alert("No start location is set or no isochrones were computed!");
    return;                                                                     //leave the function if no starting position is defined
  }

  //Combine GeoJSON from startpoint and isochrones into a single GeoJSON
  var combineExports = [{																										    //https://www.experts-exchange.com/questions/28285333/How-to-combine-JSON-and-GeoJSON-files-for-Leaflet.html comment by Albert Van Halen
    startpoint: copyPosition,																								    //startpoint and isochrones are the names of the objects in the GeoJSON file
    isochrones: copyIsochrones,                                                 //information: []->save content inside the brackets into an Array
  }]

  //stringify the combined GeoJSON to be able to save it into a GeoJSON file
  var completeAnalysis = JSON.stringify(combineExports);

  // Create export																														  //$("#export").attr(attribute, value) represents document.getElementById('export').setAttribute(attribute, value) in jQuery
  $("#export").attr("href", 'data: text/json;charset=utf-8,' + encodeURIComponent(completeAnalysis));     //overrides the placeholder #  for the link in the export button (see Mapview_webpage.html line 153)
  $("#export").attr('download','accessability_analysis_' + $("#giveId").val() + '.geojson');              //name of the file which will be exported: accessability_analysis_CITYNAME.geojson  CITYNAME can be freely choosen by the user by inserting a name in the input of textfield giveId
}

//Import content of a GeoJSON file
function handleFileSelect(evt) {
  //check of File APIs
  checkOfFileAPI();

  //create a FileList object
  var files = evt.target.files;

  //loop through the FileList
  for (var i = 0, f; f = files[i]; i++) {
    //create a FileReader
  	var reader = new FileReader();

    // Get the content of the file and parse it to JSON
  	reader.onload = (function(theFile) {
  	   return function(e) {
         //convert dataURL to file object                                       https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript  answer of Matthew
  		     var byteString = atob(e.target.result.split(',')[1]);					      //atob() method decodes a base-64 encoded string
           //parse byteString to JSON object                                    https://stackoverflow.com/questions/1086404/string-to-object-in-js  answer of code ninja
           byteStringArray = JSON.parse(byteString);

           for (i = 0; i < byteStringArray.length; i++){
  		         var importGeojson = byteStringArray[i]["isochrones"];
               console.log(importGeojson);                                      //write importGeojson into the console
               addGeoJson(importGeojson);
  		         var pos = byteStringArray[i]["startpoint"];
               if(pos != undefined) {
                 console.log(pos);

                 //zoom to the startpoint of the accessabilityanalysis
                 map.setView([pos["lat"], pos["lng"]], 13);
                    //call of function addGeoJson in map.js to draw the isochrones

    	           //set marker for the startpoint at the map
                 //set a marker to the startpoint
    		         var startmarker = L.marker([pos["lat"], pos["lng"]]);
                 //add the marker to the map
    		         map.addLayer(startmarker);
               }
           }
  	   };
  	 })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
}

//Merge several GeoJSON files into a single one
function mergeSelected(evt) {
  //check of File APIs
  checkOfFileAPI();

  //create a FileList object
  var files = evt.target.files;

  //create the array for the unifyed GeoJSON and the markers and an object in which the merged files are added
  var mergeArray = new Array();
  var markers = new Array();
	var minutesToMerge = {};
  //create an index variable and set it to zero
  var handleFiles = 0;

  // Loop through the FileList
  for (var i = 0, f; f = files[i]; i++) {
    //create a FileReader
    var reader = new FileReader();

    // Get the content of the file and parse it
    reader.onload = (function(theFile) {
      return function(e) {
        //convert dataURL to file object                                        https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript  answer of Matthew
        var byteString = atob(e.target.result.split(',')[1]);							      //atob() method decodes a base-64 encoded string
        //parse byteString to JSON object                                       https://stackoverflow.com/questions/1086404/string-to-object-in-js  answer of code ninja
        byteStringArray = JSON.parse(byteString);
        //add the content of all geoJSON files to the array
        for (i = 0; i < byteStringArray.length; i++){
          //merge isochrones                          		                      https://www.w3schools.com/jsref/jsref_push.asp

          features = byteStringArray[i]["isochrones"]["features"];
          for(k = 0; k < features.length; k++) {
            min = features[k]["properties"]["contour"];                         //min = time interval of the isochrone

            var LineString;
            if (features[k]["geometry"]["type"] == "Polygon"){
              console.log("coordinates: " + features[k]["geometry"]["coordinates"]);
              LineString = turf.polygonToLineString(features[k]["geometry"]);   //convert polygons to LineStrings     https://www.npmjs.com/package/@turf/polygon-to-linestring
              console.log("polyToLineString: " + JSON.stringify(LineString));
              features[k]= LineString;
            }

            if (minutesToMerge[min] == undefined) {
              minutesToMerge[min] = new Array();
            }
            minutesToMerge[min].push(features[k]["geometry"]["coordinates"]);
          }

          //merge markers
          var startmarker = L.marker([byteStringArray[i].startpoint["lat"], byteStringArray[i].startpoint["lng"]]);
          markers.push(startmarker);
        }

        //count handleFiles one up each time the loop is traversed
        handleFiles++;

        //Create an export of the merged GeoJSON file if all GeoJSON files are added
        //check if all files are added to the merge
        if (handleFiles == files.length) {
          var completeMerged = {"features":[]};
          $.each(minutesToMerge, function(key_min, value_array) {               //http://api.jquery.com/jquery.each/
            var union = undefined;                                              //create a variable for the unified isochrones
            for (fileNr = 0; fileNr < value_array.length; fileNr++) {           //loop through all selected files that should be merged
              tmp = turf.polygon([value_array[fileNr]]);
              if (union == undefined) {                                         //if the union variable is undefined, set it to value of the first input file
                union = tmp;
                continue;
              }
              unionTmp = turf.union(union, tmp);                                //merge isochrones  ["geometry"]["coordinates"]
              union = unionTmp;
            }

            if(union != undefined) {                                            //check if union is not undefined
              var line = turf.polygonToLineString(union);                       //convert polygons to LineStrings     https://www.npmjs.com/package/@turf/polygon-to-linestring
              line.properties = {
                "color":"rgb(255,0,0)",
                "contour":key_min,
                "opacity":0.33,
              };
              completeMerged["features"].push(line);
            }
          });
          completeMerged["features"].reverse();                                 //https://www.w3schools.com/jsref/jsref_reverse.asp

          for(i=1; i < completeMerged["features"].length; i++) {
            var color = HSVtoRGB((96/255)*(completeMerged["features"].length-completeMerged["features"][i].properties.contour)/(completeMerged["features"].length), 1, 1);	                //first color is red [((96/255)*(1-1)/(minutes-1), 1, 1) = 0], last color is green [((96/255)*(30-1)/(30-1), 1, 1) = 0.37]
            //information: 96 = green value in HSV-system 255 = maximum value in HSV-system, see https://github.com/FastLED/FastLED/wiki/FastLED-HSV-Colors
            completeMerged.features[i].properties.color = "#" + toPaddedHexString(color.r, 2)+toPaddedHexString(color.g, 2)+toPaddedHexString(color.b, 2);	//{"time":20,"color":"#abcdef"}		contour i-1 = i, because computer starts counting by 0, but minutes starts couning by 1
          }

          addGeoJson(completeMerged);

          for(i=0;i<markers.length;i++) {
            map.addLayer(markers[i]);
          }

          //stringify the merged GeoJSON to be able to save it into a GeoJSON file
          exportFile = [{"isochrones":completeMerged}];
          for(i=0;i<markers.length;i++) {
            exportFile.push({"startpoint":markers[i].getLatLng(),"isochrones":{"features":[]}});
          }
          var mergeCompleted = JSON.stringify(exportFile);                      //[completeMerged]    mergeArray

          //Create export
          //create a new <a>                                          				  https://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri answer of bfred.it
          var link = document.createElement('a');
          //define the filename of the export file (accessability_analysis_merged.geojson)
          link.download = 'accessability_analysis_merged.geojson';
          //define the uri
          link.href = 'data: text/json;charset=utf-8,' + encodeURIComponent(mergeCompleted);
          //Firefox requires the link to be in the body
          document.body.appendChild(link);
          //simulate click
          link.click();
          //remove the link when done
          document.body.removeChild(link);
        }
      };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
}
