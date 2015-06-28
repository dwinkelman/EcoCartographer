var over; //{} for storing data by road name
var speeds; //see definition in function for info
var requests; //iterated through to check for completion of all requests; contains XMLHttpRequests
//these variables need to be global to be accessed by developer or other functions

function overpass(){

var ALLOWEDKEYS = ['name','highway','bicycle','foot','oneway','sidewalk','lanes','maxspeed','tiger:county'];
speeds = {}; /*holds speed info, used to calculate averages.
data structure: {'tiger:county':{highway:{maxspeed_1:<num of occurances>, maxspeed_2:....}....}....}
*/

//extract data from an XML group
function parse(d){
  for(var j=0; j<d.length; j++){
    var tags = d[j].getElementsByTagName("tag");

    //Check for specific attributes
    var name; var maxspeed; var county; var highway;
    for(var k=0; k<tags.length; k++){
      var key = tags[k].attributes.k.value;
      if(key==="name"){
        name = tags[k].attributes.v.value;
        if(name==="Lewisville Clemmons Road"){
          console.log(d[j]);
        }
      }else if(key==="maxspeed"){
        maxspeed = tags[k].attributes.v.value;
      }else if(key==="tiger:county"){
        county = tags[k].attributes.v.value;
      }else if(key==="highway"){
        highway = tags[k].attributes.v.value;
      }
    }

    //add name to over
    if(!(name in over)){
      over[name] = {speed:null};
    }

    //add attributes to over
    for(var k=0; k<tags.length; k++){
      var key = tags[k].attributes.k.value;
      if(ALLOWEDKEYS.indexOf(key)!==-1){
        var value = tags[k].attributes.v.value;
        over[name][key] = value;
      }
    }

    //add info to speeds to later calculate averages
    if(county && maxspeed && highway){
      if(!(county in speeds)){
        speeds[county] = {};
      }
      if(!(highway in speeds[county])){
        speeds[county][highway] = {data:[], average:null};
      }
      speeds[county][highway].data.push({speed:maxspeed,name:name});
    }
  }
} 

over = {};
requests = [];
var bounds = {north:36.12, south:36.03, west:-80.4, east:-80.28} //rough bounds of Winston-Salem. Real bounds derived from Google Maps route

//Get Road Data
for(var i=bounds.south; i<bounds.north; i+=0.04){
  for(var j=bounds.west; j<bounds.east; j+=0.04){
    //not yet optimized for non-XMLHttpRequest browsers
    var info = new XMLHttpRequest();
    info.open("GET","http://overpass-api.de/api/interpreter?data="+escape('way["highway"]('+i+','+j+','+(i+0.04)+','+(j+0.04)+');out;'),true);
    info.send();
    requests.push([[i,j].toString(),info,false]); //array of requests
  }
}

//Get Traffic Signal Data
var signal_request = new XMLHttpRequest();
signal_request.open("GET","http://overpass-api.de/api/interpreter?data="+escape('node["highway"="traffic_signals"]('+bounds.south+','+bounds.west+','+bounds.north+','+bounds.east+');out;'),true);
signal_request.send();
requests.push(["signals",signal_request,false]);
console.log(requests);
var loop = setInterval(function(){ //iterates through requests, checks for responses
  var num = 0; //if 0 after for loop, exits setInterval
  for(var i=0; i<requests.length; i++){
    if(requests[i][2]===false){
      if(requests[i][1].responseXML!==null){
        if(requests[i][0]!=="signals"){
          parse(requests[i][1].responseXML.children[0].getElementsByTagName("way"));
        }else{
          signals = requests[i][1].responseXML.children[0].getElementsByTagName("node");
        }
        requests[i][2] = true; //marks as 'processed'
      }else{
        num++;
      }
    }
  }
  if(num===0){ //when complete
    clearInterval(loop);
    console.log(over);
  }
},100);
}
