var TEXTINPUTUPDATETIME = 1500; //time to re-query after an input has changed.
var last_edit_time = {
  start: 0,
  end: 0
};
var timeouts = {
  start:setTimeout(function(){},0),
  end:setTimeout(function(){},0)
}

function updateTime(name, obj){
  var new_time = new Date();
  clearTimeout(timeouts[name]);
  timeouts[name] = setTimeout(function(){
    updateMap(name, obj)
  }, TEXTINPUTUPDATETIME);
  last_edit_time[name] = new_time.getTime();
}

function updateAddress(object, name, value){
  if(checkAddress(object, value)){
    updateMap(name, object);
  }
}

function checkAddress(object, text){
  if(text.length>3){
    if(text.length < 10){
      if(!confirm("One or more addresses are short. It may not be what you are looking for, or return ambiguous results. Continue with query?")){
        object.value = '';
        return false;
      }else{
        return true;
      }
    }else if(!isNaN(text)){
      alert("One or more addresses contain only numbers. Please change them.");
      object.value = '';
      return false;
    }else{
      return true;
    }
  }
}

var start = new google.maps.Marker({map:map, icon:'images/start.png'});
var end = new google.maps.Marker({map:map, icon:'images/end.png'});

function updateMap(name, obj){
  var marker = (name==='start')?start:end;
  if(obj.value.length > 3){
    geocoder.geocode({address:obj.value}, function(results, status){
      if(status === google.maps.GeocoderStatus.OK){
        marker.setPosition(results[0].geometry.location);
        marker.setTitle(obj.value);
        if(start.getPosition() && end.getPosition()){
          map.fitBounds(new google.maps.LatLngBounds(start.getPosition(), end.getPosition()));
          
          //outside 50 miles
          var dist = google.maps.geometry.spherical.computeDistanceBetween(start.getPosition(), end.getPosition())
          console.log(dist);
          if(dist > 160000){
            alert('This route is too long. Please choose a new one that is 100 mile maximum');
            $(obj).val('');
          }else if(dist > 80000){
            if(confirm('Proposed route is outside of 50 mile recommended distance. Do you want to choose a different route?')){
              $(obj).val('');
            }
          }
        }else{
          map.panTo(marker.getPosition());
          map.setZoom(15);
        }
        marker.setMap(map);
      }else if(status === google.maps.GeocoderStatus.ZERO_RESULTS){
        alert('There is an issue with address. Please refer to the "Help" link.');
        $(obj).val('');
      }else{
        setTimeout(function(){
          updateMap(marker, obj);
        }, 1000);
      }
    });
  }
}

/*function cont(){
  var id = $('#id-input').val();
  var loop = setInterval(function(){
    $.ajax({
      url:'routes/'+id+'/console.html',
      dataType:'text',
      success:consoleAjaxSuccess,
      error:__blank__,
    });
    $.ajax({
      url:'routes/'+id+'/output.json',
      dataType:'json',
      success:function(data){
        console.log(eval(data));
        resultsAjaxSuccess(data.routes);
        $.ajax({
          url:'routes/'+id+'/output.html',
          dataType:'text',
          success:function(output){
            $('#output').html(output);
          }
        });
        clearInterval(loop);
      },
      error:__blank__,
      timeout:300
    });
  },100);
}*/

function cont(){
  var id = $('#id-input').val();
  function get(){
    try{
      console.log('ajax request');
      $.ajax({
        url:'routes/'+id+'/console.html',
        dataType:'text',
        success:consoleAjaxSuccess,
        error:__blank__,
      });
      $.ajax({
        url:'routes/'+id+'/output.json',
        dataType:'json',
        success:function(data){
          console.log(data);
          resultsAjaxSuccess(data.routes, data.recom);
          setTimeout(function(){
            $.ajax({
              url:'routes/'+id+'/output.html',
              dataType:'text',
              success:function(output){
                $('#output').html(output);
              }
            });
          },10000);
        },
        error:get,
        timeout:10000
      });
    }catch(e){}
  }
  get();
}

function __blank__(){};

function consoleAjaxSuccess(data){
  $("#console").html(data);
}

/***Class for routes***/
var colors = ['#0f0','#0ff','#00f','#f0f','#f00','#ff0','#0f8','#08f','#80f','#880'];
var Route = function(data, index){
  var polyline = new google.maps.Polyline({
    path:google.maps.geometry.encoding.decodePath(data.polyline),
    geodesic:true,
    strokeColor:colors[index%10],
    strokeWeight:5
  });
  polyline.setMap(map);
  polyline.popup = new google.maps.InfoWindow({content:"<b>Summary:</b><br><i>Route Number: </i>"+(index+1)+"<br><i>Distance: </i>"+data.distance.miles+" miles<br><i>Gasoline: </i>"+data.energy.gasoline.gallons+" gallons<br><i>Time: </i>"+data.time.minutes+" minutes"});
  google.maps.event.addListener(polyline, 'click', function(e){this.popup.setPosition(e.latLng); this.popup.open(map)});
  var markers = [];
  for(var j=0; j<data.steps.length; j++){
    var step = data.steps[j];
    var icon;
    if(step.feature==="stoplight"){
      icon = "images/stoplight.png";
    }else if(step.feature==="stopsign"){
      icon = "images/stopsign.png";
    }else{
      try{
        icon = "images/"+step.command+".png";
      }catch(e){
      }
    }
    markers.push(new google.maps.Marker({
      position:new google.maps.LatLng(step.start.lat, step.start.lng),
      title:step.instruction,
      icon:icon,
      map:map
    }));
  }
  this.polyline = polyline;
  this.markers = markers;
}

Route.prototype.hide = function(){
  this.polyline.setMap(null);
  for(var i=0; i<this.markers.length; i++){
    this.markers[i].setMap(null);
  }
}

Route.prototype.show = function(){
  this.polyline.setMap(map);
  for(var i=0; i<this.markers.length; i++){
    this.markers[i].setMap(map);
  }
}
    
//everything will be contained within routes
//route will be set to routes returned by JSON
//google maps elements will be added on top
var routes;

var markers = {};
var polylines = {};

function resultsAjaxSuccess(data, recom){
  for(var i=0; i<data.length; i++){
    polylines[i] = new Route(data[i], i);
  }
  recom.steps = [];
  polylines[-1] = new Route(recom, 'Google Route');
}
/*
function resultsAjaxSuccess(data, recom){
  routes = data;
  
  for(var i=0; i<data.length; i++){
    //set to visible by default
    routes[i].visible = true;
    
    //build polyline
    var polyline = new google.maps.Polyline({
      path:google.maps.geometry.encoding.decodePath(data[i].polyline),
      geodesic:true,
      strokeColor:colors[i%10],
      strokeWeight:5
    });
    polyline.setMap(map);
    polyline.popup = new google.maps.InfoWindow({content:"<b>Summary:</b><br><i>Route Number: </i>"+(i+1)+"<br><i>Distance: </i>"+routes[i].distance.miles+" miles<br><i>Gasoline: </i>"+routes[i].energy.gasoline.gallons+" gallons<br><i>Time: </i>"+routes[i].time.minutes+" minutes"});
    google.maps.event.addListener(polyline, 'click', function(e){this.popup.setPosition(e.latLng); this.popup.open(map)});
    //google.maps.event.addListener(polyline, 'mouseout', function(e){this.popup.close()});
    
    //build markers
    var markers = [];
    for(var j=0; j<data[i].steps.length; j++){
      var step = data[i].steps[j];
      var icon;
      if(step.feature==="stoplight"){
        icon = "images/stoplight.png";
      }else if(step.feature==="stopsign"){
        icon = "images/stopsign.png";
      }else{
        try{
          icon = "images/"+step.command+".png";
        }catch(e){
        }
      }
      markers.push(new google.maps.Marker({
        position:new google.maps.LatLng(step.start.lat, step.start.lng),
        title:step.instruction,
        icon:icon,
        map:map
      }));
    }
    
    //assign data to route
    routes[i].mapPolyline = polyline;
    routes[i].mapMarkers = markers;
    
    //route show/hide functions
    routes[i].hide = function(){
      this.mapPolyline.setMap(null);
      for(var i=0; i<this.mapMarkers.length; i++){
        this.mapMarkers[i].setMap(null);
      }
    };
    
    routes[i].show = function(){
      this.mapPolyline.setMap(map);
      for(var i=0; i<this.mapMarkers.length; i++){
        this.mapMarkers[i].setMap(map);
      }
    };
  }
}
*/

//onload function
$(function(){
  //set random id
  $('#id-input').val(Math.random().toString(36).substring(10));
  
  //set check event listeners to checkboxes
  $(document).on('click', '#output input:checkbox', function(){
    try{
      if($(this).is(':checked')){
        $("#"+this.value+" #steps").show();
        polylines[parseInt(this.value)].show();
      }else{
        $("#"+this.value+" #steps").hide();
        polylines[parseInt(this.value)].hide();
      }
    }catch(e){}
  });
    
});