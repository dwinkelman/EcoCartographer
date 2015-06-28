var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var geocoder;
var map;
var ca_local;
var Roads;
var RoadCount;
var Int;
var pt_count;
var intersections;

function Initialize(){
  directionsDisplay = new google.maps.DirectionsRenderer({map:map});
  geocoder = new google.maps.Geocoder();
  var mapOptions = {zoom:10, center:new google.maps.LatLng(36,-80)};
  map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
  directionsDisplay.setMap(map);
}

function GetRoute(start,end){
  //new google.maps.LatLng(36.0941915,-80.286940);
  //new google.maps.LatLng(36.062835,-80.393943);
  var request = {
    origin:start,
    destination:end,
    waypoints:[], 
    travelMode:google.maps.DirectionsTravelMode.DRIVING};
  console.log(request);
  directionsService.route(request, function(response, status){
    directionsDisplay.setDirections(response);
    console.log(response);
    for(var i=0; i<response.routes.length; i++){
      var sl = response.routes[i].legs[0].steps;
      for(var j=0; j<sl.length; j++){
        var Marker = new google.maps.Marker({position:sl[j].path[0],map:map});
      }
    }
  });
}

function Grid(sp,ep){

  var dlat = sp.lat()-ep.lat(); //difference lat/lng
  var dlng = sp.lng()-ep.lng();
  var center = new google.maps.LatLng(sp.lat()-dlat/2, sp.lng()-dlng/2); // center between dest and orig
  var cm = new google.maps.Marker({position:center, map:map}); //center marker
  var hdist = Math.sqrt(dlat*dlat + dlng*dlng); //half dist from orig to dest
  //basic measures

  //function checks if a point is in the circle with center at <center> and radius of <hdist>
  function InCircle(lat,lng){
    if(Math.pow(lat-center.lat(),2)+Math.pow(lng-center.lng(),2) < Math.pow(hdist,2)){
      return true;
    }else{
      return false;
    }
  }

  var lpts = [];
  var Roads = [];
  for(var i=0; i<Math.PI*2; i+=Math.PI/36){
    lpts.push(new google.maps.LatLng(center.lat()+hdist*Math.sin(i), center.lng()+hdist*Math.cos(i)));
  }
  var Poly = new google.maps.Polygon({path:lpts});
  Poly.setMap(map);
  //draws circle

  for(var i=center.lat()-hdist; i<center.lat()+hdist; i+=0.004){
    for(var j=center.lng()-hdist; j<center.lng()+hdist; j+=0.004){
      //iterates through grid with 0.004 deg intervals
      if(InCircle(i,j)){ // checks if coord is in circle
        var latlng = new google.maps.LatLng(i,j);
        var Marker = new google.maps.Marker({position:latlng, map:map});

        //finds address
        geocoder.geocode({'latLng':latlng}, function(results, status){
          console.log(status);
          if(status==google.maps.GeocoderStatus.OK){
            var street = results[0].address_components[1].long_name;
            console.log(street);
            if(Roads.indexOf(street) === -1){
              //adds road name to <Roads> if it is not there already
              Roads.push(street);
              console.log(results);
            }
          }
        });
      }
    }
  }
  console.log(Roads);
  //Output <Roads> list
}

function Network(sp,ep){

  var dlat = sp.lat()-ep.lat(); //difference lat/lng
  var dlng = sp.lng()-ep.lng();
  var center = new google.maps.LatLng(sp.lat()-dlat/2, sp.lng()-dlng/2); // center between dest and orig
  var cm = new google.maps.Marker({position:center, map:map}); //center marker
  var hdist = Math.sqrt(dlat*dlat + dlng*dlng)/4; //half dist from orig to dest
  //basic measures
  
  Roads = [];
  var tbgc= [];
  var dirs = [];
  var pts = [];
  var not_names = ["left","right","north","south","east","west","U-turn","northeast","southeast","northwest","southwest"];
  var wpts = [{location:new google.maps.LatLng(center.lat()+dlng/4,center.lng()-dlat/4), stopover:true},
{location:ep, stopover:true},
{location:center, stopover:true},
{location:sp, stopover:true},
{location:new google.maps.LatLng(center.lat()-dlng/4,center.lng()+dlat/4), stopover:true}];
  console.log(wpts);
  request1 = {origin:sp, destination:ep, avoidHighways:true, waypoints:wpts, travelMode:google.maps.DirectionsTravelMode.DRIVING};
  directionsService.route(request1, function(response, status){
    var VA = [];
    directionsDisplay.setDirections(response);
    console.log(response);
    for(var i=0; i<response.routes[0].legs.length; i++){
      var L = response.routes[0].legs[i];
      if(L.start_location!==ep || L.start_location!==sp){
        VA.push(L.start_address);
      }else if(L.end_location!==ep || L.end_location!==sp){
        VA.push(L.end_address);
      }
      for(var j=0; j<response.routes[0].legs[i].steps.length; j++){
        var pc = response.routes[0].legs[i].steps[j];
        tbgc.push(pc.path[0]);
        dirs.push([pc.instructions,pc.path[0]]);
        for(var k=0; k<pc.path.length; k++){
          pts.push(pc.path[k]);
        }
      }
    }
    console.log(dirs);
    console.log(tbgc);
    /*for(var i=0; i<tbgc.length; i++){
      GC(i);
      var M = new google.maps.Marker({position:tbgc[i], map:map});
    }*/
    for(var i=0; i<dirs.length; i++){
      var y = dirs[i][0].split("<b>");
      var z = [];
      for(var j=0; j<y.length; j++){
        if(y[j].indexOf("</b>")!==-1){
          var a = y[j].split("</b>")[0];
          if(not_names.indexOf(a)===-1){Roads.push(a)}
        }
      }
    }

    var RoadKeys = {};
    RoadCount = [];
    for(var i=0; i<Roads.length; i++){
      RoadKeys[Roads[i]] = 0;
    }
    for(var i=0; i<Roads.length; i++){
      RoadKeys[Roads[i]] += 1;
    }
    for(var i in RoadKeys){
      RoadCount.push([i,RoadKeys[i]]);
    }
    RoadCount.sort(function(a,b){return a[1]-b[1]});
    console.log(VA);
    console.log(dirs);

    var pt_keys = {};
    pt_count = [];
    pt_consec = [];
    for(var i=0; i<pts.length; i++){
      pt_keys[pts[i]] = [0,[]];
      if(i<pts.length-1){
        if(pts[i]===pts[i+1]){
          pt_consec.push(pts[i]);
        }
      }
    }
    for(var i=0; i<pts.length; i++){
      pt_keys[pts[i]][0]++;
      pt_keys[pts[i]][1].push(i);
    }
    for(var i in pt_keys){
      pt_count.push([i,pt_keys[i][0],pt_keys[i][1]]);
    }
    pt_count.sort(function(a,b){return a[1]-b[1]});

    var x = pt_count.map(function(a){return a[1]});
    var pcc={};

    for(var i=0; i<x.length; i++){
      var num = x[i]; 
      pcc[num] = pcc[num] ? pcc[num]+1 : 1;
    }
    console.log(pts);
    console.log(pt_count);
    console.log(pcc);

    //Relevant to v.1.5. (new stuff)
    intersections = {list:[], info:[]};

    function new_intersection(pt){
      var p = pt[0].slice(1,pt[0].length-1);
      p = p.split(",");
      var LL = new google.maps.LatLng(p[0].toString(), p[1].toString());
      var ind = pt[2];
      ind.length = pt[1];
      var I = {coords:LL, connections:[], indexes:ind};
      intersections.info.push(I);
      intersections.list.push(LL);
      var m = new google.maps.Marker({position:LL, map:map, icon:'marker.png'});
    }
    
    //Generates list of intersections
    for(var i=0; i<pt_count.length; i++){
      if(pt_count[i][1]>2){
        new_intersection(pt_count[i]);
      }
    }

    var series = []; //Terminators for paths
    for(var i=0; i<intersections.info.length; i++){
      var I = intersections.info[i];
      for(var j=0; j<I.indexes.length; j++){
        series.push([I.indexes[j], I.coords]);
      }
    }
    series.sort(function(a,b){return a[0]-b[0]});
    var IL = intersections.list;
    var II = intersections.info;
    for(var i=0; i<series.length-1; i++){
      II[IL.indexOf(series[i][1])].connections.push({point:series[i+1][1], path:pts.slice(series[i][0],series[i+1][0]+1)});
      II[IL.indexOf(series[i+1][1])].connections.push({point:series[i][1], path:pts.slice(series[i][0],series[i+1][0]+1).reverse()});
    }

    /*for(var i=0; i<intersections.list.length; i++){ //iterates through coordinates
      var locations = [];
      var coord = intersections.list[i];
      while(pts.indexOf(coord)!==-1){
        locations.push(pts.indexOf(coord));
        pts[pts.indexOf(coord)] = 0;
      }
      while(pts.indexOf(0)!==-1){
        pts[pts.indexOf(0)] = coord;
      }
      intersections.info[i].indexes = locations;
    } //Original-type attempt which failed*/
    //End Relevant to v.1.5.
  });

  function GC(i){
    setTimeout(function(){
      geocoder.geocode({location:tbgc[i]},function(results,status){
          if(status!==google.maps.GeocoderStatus.OK){console.log(status)
          }else{
            console.log(results);
            var R = results[0].address_components[1].long_name;
            if(Roads.indexOf(R)===-1){
              Roads.push(R);
            }
          }
        })},1000*i);
  }
}

function CodeAddress(address){
  geocoder.geocode({'address':address}, function(results, status){
    var coords = results[0].geometry.location;
    var marker = new google.maps.Marker({position:coords, map:map, title:address});
    console.log(coords);
    ca_local = coords;
  });
}

function GetRouteFromInput(){
  var start = new google.maps.LatLng(36.0941915,-80.286940);
  var end = new google.maps.LatLng(36.062835,-80.393943);
  //var start = document.getElementById('start_input').value;
  //var end = document.getElementById('end_input').value;
  Network(start,end);
}

google.maps.event.addDomListener(window,'load',Initialize);