var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var geocoder;
var map;

function Initialize(){
  directionsDisplay = new google.maps.DirectionsRenderer({map:map});
  geocoder = new google.maps.Geocoder();
  var mapOptions = {zoom:10, center:new google.maps.LatLng(36,-80)};
  map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
  directionsDisplay.setMap(map);
}

function GetRoute(start,end){
  var start_coords = new google.maps.LatLng(36.0941915,-80.286940);
  var end_coords = new google.maps.LatLng(36.062835,-80.393943);
  var request = {
    origin:start_coords,
    destination:end_coords,
    waypoints:[], 
    travelMode:google.maps.DirectionsTravelMode.DRIVING};
  console.log(request);
  directionsService.route(request, function(response, status){
    directionsDisplay.setDirections(response);
    console.log(response);
  });
}

function CodeAddress(address){
  var coords;
  geocoder.geocode({'address':address}, function(results, status){
    coords = results[0].geometry.location;
    console.log(coords);
    return coords;
  });
}

function GetRouteFromInput(){
  var start = document.getElementById('start_input').value;
  var end = document.getElementById('end_input').value;
  GetRoute(start,end);
}

google.maps.event.addDomListener(window,'load',Initialize);