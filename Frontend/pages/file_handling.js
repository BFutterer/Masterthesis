/* file handling
 * This file contains all functions which deal with file-handling:
 *  - checkOfFileAPI()      Check if File APIs (File, FileReader, FileList and Blob) that are needed for file handling are supported by the browser
 *  - exportFunction(e)     Export of the drawn isochrones together with the starting position to a GeoJSON-file
 *  - handleFileSelect(evt) Import of one or several GeoJSON-file(s) and draw the content of them into the map
 *  - mergeSelected(evt)    Merge of several GeoJSON-files into a single one
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

//Export of isochrones and startpoint to a geojson file
function exportFunction(e) {
  //check of File APIs
  checkOfFileAPI();

  //Combine GeoJSON from startpoint and isochrones into a single GeoJSON
  var combineExports = [{																										      //https://www.experts-exchange.com/questions/28285333/How-to-combine-JSON-and-GeoJSON-files-for-Leaflet.html comment by Albert Van Halen
                                                                                //startpoint,isochrones and cityborder are the names of the objects in the geoJSON file
    startpoint: copyPosition,																								    //startpoint
    isochrones: copyIsochrones,																							    //isochrones
    //cityborder: boundarystring					//needed?															//cityborder		//copyData[selectedCity].geojson			boundaryLayer				copyData[selectedCity].geojson
  }]																																				    //[]->save content inside the brackets into an Array

  //stringify the combined GeoJSON to be able to save it into a GeoJSON file
  var completeAnalysis = JSON.stringify(combineExports);
  //console.log(completeAnalysis);																						  //write something into the console

  // Create export																														  //$("#export").attr(attribute, value) represents document.getElementById('export').setAttribute(attribute, value) in jQuery
  $("#export").attr("href", 'data: text/json;charset=utf-8,' + encodeURIComponent(completeAnalysis));     //overrides the placeholder #  for the link in the export button (see Mapview_webpage.html line 155)
  $("#export").attr('download','accessability_analysis_' + $("#giveId").val() + '.geojson');              //name of the file which will be exported: accessability_analysis_CITYNAME.geojson  CITYNAME can be freely choosen by the user, input of textfield giveId
}

//Import content of a geojson file
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
            //convert dataURL to file object                                    https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript  answer of Matthew
		        var byteString = atob(e.target.result.split(',')[1]);					      //atob() method decodes a base-64 encoded string
            //parse byteString to JSON object                                   https://stackoverflow.com/questions/1086404/string-to-object-in-js  answer of code ninja
            byteStringArray = JSON.parse(byteString);

            for (i = 0; i < byteStringArray.length; i++){
		            var importGeojson = byteStringArray[i]["isochrones"];
		            var pos = byteStringArray[i]["startpoint"];

                //zoom to the startpoint of the accessabilityanalysis
                map.setView([pos["lat"], pos["lng"]], 13);
                //call of function addGeoJson in map.js to draw the isochrones
		            addGeoJson(importGeojson);

	              //set marker for the startpoint at the map
                //set a marker to the startpoint
		            var startmarker = L.marker([pos["lat"], pos["lng"]]);
                //add the marker to the map
		            map.addLayer(startmarker);
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

  //create the array for the unifyed geoJson
	var mergeArray = new Array();
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
          //add new entrys to the array byteStringArray		                      https://www.w3schools.com/jsref/jsref_push.asp
          mergeArray.push(byteStringArray[i]);
        }

        //count handleFiles one up each time the for loop is traversed
        handleFiles++;

        //Create an export of the merged GeoJSON file if all GeoJSON files are added
        //check if all files are added to the merge
        if (handleFiles == files.length) {
          //stringify the merged GeoJSON to be able to save it into a GeoJSON file
          var mergeCompleted = JSON.stringify(mergeArray);

          //Create export
          //create a new <a>                                          				  https://stackoverflow.com/questions/283956/is-there-any-way-to-specify-a-suggested-filename-when-using-data-uri answer of bfred.it
          var link = document.createElement('a');
          //define the filename of export file (accessability_analysis_merged.geojson)
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
