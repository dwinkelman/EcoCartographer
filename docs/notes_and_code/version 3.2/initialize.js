var map;
var directionsDisplay;
function initialize(div){
  geocoder = new google.maps.Geocoder();
  var mapOptions = {center:{lat:-34.397, lng:150.644}, zoom:8};
  map = new google.maps.Map(document.getElementById('div'), mapOptions);
  console.log(map);
}
google.maps.event.addDomListener(window,'load',initialize);