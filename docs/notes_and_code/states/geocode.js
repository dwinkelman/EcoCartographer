function getRoute(start, end, waypoints){
  var request = {origin: start, destination: end, waypoints: [], travelMode: google.maps.DirectionsTravelMode.DRIVING};
  var directionsService = new google.maps.DirectionsService();
  directionsService.route(request, function(response, status){
    if(status==google.maps.DirectionsStatus.OK){
      directionsDisplay.setDirections(response);
    }else{
      alert("Unsuccessful (Directions). "+status);
    }
  });
}

function gc(results, status){
  if(status == google.maps.GeocoderStatus.OK){
    map.setCenter(results[0].geometry.location);
    var marker = new google.maps.Marker({map:map, position:results[0].geometry.location});
  }else{
    alert("Unsuccessful (Geocode). "+status);
  }
  current_route += results[0];
}