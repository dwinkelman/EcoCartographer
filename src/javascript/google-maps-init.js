var map;
var geocoder;
function initialize(div){
  geocoder = new google.maps.Geocoder();
  var mapOptions = {center:{lat:38, lng:-100}, zoom:4};
  map = new google.maps.Map(document.getElementById(div), mapOptions);
  console.log(map);
}