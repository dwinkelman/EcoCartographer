var directionsDisplay;
try{
  var directionsService = new google.maps.DirectionsService();
}
catch(err){
  alert("Could not load Google Maps. Error: "+err+". Please refresh screen until loading is successful.");
}
var geocoder;
var elevationService = new google.maps.ElevationService();
var map;

var DIAMETER = 40075000/360; //earth's diameter in meters per degree
var METERPS = 0.44704; //meters/second per mile/hour
var AIRDENSITY = 1.2754; //kg/m^3
var GRAVITY = 9.80665; //m/s^2
var RAD = 180/Math.PI; //multiple by to convert radians to degree; divide for degress to radians
var METERMILE = 1609.34; //meters per mile
var FOOTMETER = 3.28084; //feet per meter

var ELEVSIZE = 300; //size of elevation queries
var ELEVRATE = 2000; //delay between elevation queries

var ACCELRATE = 2.5; //rate of acceleration/deceleration, m/s^2

//variables to go inside Network()
  var intersections; //network of LatLng points that is an object with nodes assigned to numbers (ex: {1:{}, 2:{}, 5:{}, ...})
  var intersections_length; //number of intersections (since Object does not have length like an array)
  var branch_int_max; //maximum number of intersections for a branch
  var pts; //array of all LatLng points
  var signals = []; //array holds locations of all traffic signals
  var branches = []; //original list of possible ways to go through intersections
  var candidates = []; //most promising members of branches
  var optimal = {}; //best route, has a bunch of other information attached to it like instructions
  
function NEW(a){
  return a;
}

function MAX(a){ //maximum of array a
  var highest = -Infinity;
  var index = -1;
  for(var Mi=0; Mi<a.length; Mi++){
    if(a[Mi]>highest){
      highest = a[Mi];
      index = Mi;
    }
  }
  return highest;
}

function MIN(a){ //minimum of array a
  var lowest = Infinity;
  var index = -1;
  for(var Mi=0; Mi<a.length; Mi++){
    if(a[Mi]<lowest){
      lowest = a[Mi];
      index = Mi;
    }
  }
  return lowest;
}

function HYPOT(a,b){ //hypotnuse of distances a and b
  return Math.sqrt(a*a + b*b)
}

function ANGLE(pt1,pt2,pt3){ //angle between three google.maps.LatLngs
  var lat1 = pt1.lat()-pt2.lat();
  var lng1 = pt1.lng()-pt2.lng();
  var lat2 = pt3.lat()-pt2.lat();
  var lng2 = pt3.lng()-pt2.lng();
  var dns1 = lat1 * DIAMETER;
  var dns2 = lat2 * DIAMETER;
  var dew1 = lng1 * Math.abs(Math.cos((pt1.lng()+pt2.lng())/2*RAD)*DIAMETER);
  var dew2 = lng2 * Math.abs(Math.cos((pt2.lng()+pt3.lng())/2*RAD)*DIAMETER);
  var angle1 = RAD * Math.atan(dns1/dew1);
  var angle2 = RAD * Math.atan(dns2/dew2);
  if(dns1<0){
    if(dew1<0){angle1+=180}else{angle1+=360}
  }else{
    if(dew1<0){angle1+=180}
  }
  if(dns2<0){
    if(dew2<0){angle2+=180}else{angle2+=360}
  }else{
    if(dew2<0){angle2+=180}
  }
  var change = angle1-angle2;
  return change;
}

function LatLngDist(a,b){ //distance between two google.maps.LatLngs
  
return HYPOT((a.lat()-b.lat())*DIAMETER, (a.lng()-b.lng()) * Math.cos((a.lat()+b.lat())/2*RAD)*DIAMETER);

}

function Initialize(){ //initialize Google Map to #map-canvas
  directionsDisplay = new google.maps.DirectionsRenderer({map:map});
  geocoder = new google.maps.Geocoder();
  var mapOptions = {zoom:10, center:new google.maps.LatLng(36,-80)};
  map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
  directionsDisplay.setMap(map);
}

function Network(sp,ep){

  var dlat = sp.lat()-ep.lat(); //difference lat/lng
  var dlng = sp.lng()-ep.lng();
  var center = new google.maps.LatLng(sp.lat()-dlat/2, sp.lng()-dlng/2); // center between dest and orig
  var radius = HYPOT(dlat, dlng)/2;
  var angle = Math.atan(dlat/dlng);
  var wpts_options = [];
  for(var i=angle; i<angle+360; i+=45){
    //i is the angle in the circle
    var new_lat = center.lat() + Math.sin(i/RAD)*radius;
    var new_lng = center.lng() + Math.cos(i/RAD)*radius;
    wpts_options.push(new google.maps.LatLng(new_lat,new_lng));
  }

  //set map view
  var map_bounds = new google.maps.LatLngBounds();
  map_bounds.extend(sp);
  map_bounds.extend(ep);
  map.fitBounds(map_bounds);

  //physics variable
  var phys = {
CD:document.getElementById("drag_coefficient").value,
area:document.getElementById("area").value,
air:AIRDENSITY,
mass:document.getElementById("mass").value,
g:GRAVITY,
rolling:0.03
  };

  
  pts = []; //used for list of all points in paths on map
  var eind = []; //end indexes
  var eind_counter = 0; //end index counter

  //list of intersections used for directions service
  var wpts1 = [	{location:wpts_options[2], stopover:true},
		{location:wpts_options[3], stopover:true},
		{location:wpts_options[1], stopover:true},
		{location:wpts_options[4], stopover:true},
		{location:wpts_options[0], stopover:true},
		{location:wpts_options[5], stopover:true},
		{location:wpts_options[7], stopover:true},
		{location:wpts_options[6], stopover:true}];

  var wpts2 = [	{location:wpts_options[1], stopover:true},
		{location:wpts_options[7], stopover:true},
		{location:wpts_options[2], stopover:true},
		{location:wpts_options[6], stopover:true},
		{location:wpts_options[3], stopover:true},
		{location:wpts_options[5], stopover:true},
		{location:wpts_options[4], stopover:true},
		{location:center, stopover:true}];

  var wpts3 = [	{location:center, stopover:true}];

  var dir_requests = [
    {origin:sp, destination:ep, avoidHighways:true, waypoints:wpts1, travelMode:google.maps.DirectionsTravelMode.DRIVING},
    {origin:ep, destination:sp, avoidHighways:true, waypoints:wpts1.reverse(), travelMode:google.maps.DirectionsTravelMode.DRIVING},
    {origin:sp, destination:ep, avoidHighways:true, waypoints:wpts2.reverse(), travelMode:google.maps.DirectionsTravelMode.DRIVING},
    {origin:ep, destination:sp, avoidHighways:true, waypoints:wpts2, travelMode:google.maps.DirectionsTravelMode.DRIVING},
    {origin:sp, destination:ep, avoidHighways:false, waypoints:wpts3, travelMode:google.maps.DirectionsTravelMode.DRIVING}
  ];

  var start_pt; var end_pt;

  var bounds;
  var start_index; var end_index; //used for intersection that is start/end

  var references;

  var dir_count = 0; //used in SendDirRequest
  function SendDirRequest(request,index){ //Controls order of queries made for Directions
    var dir_controller = setInterval(function(){
      if(dir_count === index){
        getDirs(request,1000);
        clearInterval(dir_controller);
      }
    },20);
  }

  function getDirs(req,delay){ //Gets lists of points from Google Maps Directions Service, build up into single variable
    setTimeout(
      directionsService.route(req, function(response, status){
        console.log(response);
        for(var i=0; i<response.routes[0].legs.length; i++){
          var L = response.routes[0].legs[i]; //current "leg" (organization level of directions path results)
          for(var j=0; j<L.steps.length; j++){
            var pc = L.steps[j]; //current "step" (org. level)

            eind.push(eind_counter);
            eind_counter += pc.path.length;

            for(var k=0; k<pc.path.length; k++){
              pts.push({
                pt: pc.path[k], 
                elevation: null, 
                stop: null,
                index: null,
                next: {dist: null, slope: null, index: null}, 
                last: {dist: null, slope: null, index: null},
                string: pc.path[k].toString(),
                isIntersection:false,
                speed: Math.ceil(pc.distance.value/pc.duration.value/(METERPS*5))*(METERPS*5) //bumps up to nearest 5mph
              }); //adds each point to pts var
            }
          }
        }
        dir_count++;
        //executes other funtions if finished
        if(dir_count===dir_requests.length){
          references = PointReferences();
          bounds = getBounds(pts);
          console.log(eind);
          overpass_signals();
          elevation();
        }
      }
    ),delay);
  }

  function PointReferences(){ //Build up lists of points with the same coordinates
    var points = {};
    for(var i=0; i<pts.length; i++){
      if(!(pts[i].string in points)){
        points[pts[i].string] = [];
      }
      points[pts[i].string].push(i);
    }
    for(var i=0; i<pts.length; i++){
      pts[i].isElevationQuery = (points[pts[i].string][0] === i)?true:false;
      pts[i].references = points[pts[i].string];
    }
    output = [];
    for(var i in points){
      output.push({indexes:points[i], pt:pts[points[i][0]].pt});
    }
    return output;
  }

  function getBounds(d){ //Get bounding box of all points
    
    if(d.length===0){return NaN}
    var lat = d.map(function(a){return a.pt.lat()});
    var lng = d.map(function(a){return a.pt.lng()});
    var out = {north:MAX(lat), south:MIN(lat), east:MAX(lng), west:MIN(lng)};
    out.overpass_string = "("+out.south+","+out.west+","+out.north+","+out.east+")";
    console.log(out);
    return out;
  }

  function overpass_signals(){ //Use Ajax to get traffic signals data from the OpenStreetMap database

    function Callback(data){
      var xml = data.children[0].getElementsByTagName("node");
      for(var Ci=0; Ci<xml.length; Ci++){
        signals.push(new google.maps.LatLng(parseFloat(xml[Ci].attributes.lat.value), parseFloat(xml[Ci].attributes.lon.value)));
      }
    }

    var query = escape('node["highway"="traffic_signals"]'+bounds.overpass_string+';out;');
    $.ajax({
url:"http://overpass-api.de/api/interpreter?data="+query,
method:"GET",
dataType:'xml',
success:Callback
    });
  }

  function elevation(){ //Get elevation data from Google Maps Elevation Service and assign that (and other data) to pts

    //setup console
    var c = document.getElementById("console").lastChild;
    var elev = document.createElement("tr");
    var elev_label = document.createElement("td");
    elev_label.appendChild(document.createTextNode("Elevation:"));
    var elev_value = document.createElement("td");
    elev_value.id = "elev_status";
    elev_value.appendChild(document.createTextNode("0%"));
    elev.appendChild(elev_label);
    elev.appendChild(elev_value);
    c.appendChild(elev);

    function MakeRequestAPI(points,delay,range){
      expected_requests++;
      setTimeout(function(){
        var query = "";
        for(var i=range.min; i<range.max; i++){
          query += parseInt(pts[i].pt.lat()*100000)/100000 + "," + parseInt(pts[i].pt.lng()*100000)/100000;
          query += ((i<range.max-1)?"|":"");
        }
        console.log(query);
        var info = new XMLHttpRequest();
        info.open("GET","https://maps.googleapis.com/maps/api/elevation/json?locations="+query,true);
        info.send();
        var elevation_completion = setInterval(function(){
          if(info.responseText!==""){
            var data = JSON.parse(info.responseText);
            if(data.status==="OK"){
              for(var j=0; j<range.max-range.min; j++){
                pts[j+range.min].elevation = data.results[j].elevation;
              }
              clearInterval(elevation_completion);
              completion_counter++;
              elev_value.innerText = parseInt(Math.round(completion_counter/expected_requests*100))+"%";
            }else{
              console.log("Problem with Elevation. Range: "+range.min+". Error: "+data.status);
            }
          }
        },100);
      },delay);
    }

    function MakeRequest(points,delay,indexes){
      expected_requests++;
      setTimeout(function(){
        elevationService.getElevationForLocations({locations:points},function(results,status){
          if(status===google.maps.ElevationStatus.OK){
            for(var i=0; i<results.length; i++){
              for(var j=0; j<indexes[i].length; j++){
                pts[indexes[i][j]].elevation = results[i].elevation;
              }
            }
            completion_counter++;
            elev_value.innerText = parseInt(Math.round(completion_counter/expected_requests*100))+"%";
          }else{
            failed_counter++;
            failed_requests.push({points:points,indexes:indexes});
            console.log(status);
          }
        });
      },delay);
    }

    //Elevation
    var failed_requests = [];
    var completion_counter = 0;
    var failed_counter = 0;
    var expected_requests = 0;
    
    for(var i=0; i<references.length; i+=ELEVSIZE){
      var length = Math.min(ELEVSIZE,pts.length-i);
      var request_slice = references.slice(i,i+length);
      var request_pts = request_slice.map(function(a){return a.pt});
      var request_indexes = request_slice.map(function(a){return a.indexes});
      MakeRequest(request_pts,i*ELEVRATE/ELEVSIZE,request_indexes);
    }
    var completion_check = setInterval(function(){
      if(completion_counter + failed_counter === expected_requests){
        if(completion_counter === expected_requests){
          clearInterval(completion_check);
          SetData();
        }else{
          failed_counter = 0;
          for(var i=0; i<failed_requests.length; i++){
            MakeRequest(failed_requests[i].points,i*ELEVRATE/ELEVSIZE,failed_requests[i].indexes);
          }
          console.log("Failed Request");
          failed_requests = [];
        }
      }
    },100);

    function SetData(){

      for(var i=0; i<pts.length-1; i++){
        //set index variable in pts.next
        pts[i].index = i;
        pts[i].next.index = i+1;

        //set distance data
        pts[i].next.dist = LatLngDist(pts[i].pt,pts[i+1].pt);

        //set slope data
        var delev = pts[i+1].elevation - pts[i].elevation;
        var slope = delev/pts[i].next.dist;
        pts[i].next.slope = slope;
        pts[i].next.angle = Math.atan(slope);
        pts[i].next.angle_deg = Math.atan(slope)*RAD;
      }
      for(var i=1; i<pts.length; i++){
        //set index variable in pts.last
        pts[i].last.index = i-1;

        //set distance data
        pts[i].last.dist = LatLngDist(pts[i].pt,pts[i-1].pt);

        //set slope data
        var delev = pts[i-1].elevation - pts[i].elevation;
        var slope = delev/pts[i].last.dist;
        pts[i].last.slope = slope;
        pts[i].last.angle = Math.atan(slope);
        pts[i].last.angle_deg = Math.atan(slope)*RAD;
      }
      for(var i=1; i<pts.length-1; i++){
        pts[i].turn = ANGLE(pts[i-1].pt,pts[i].pt,pts[i+1].pt);
      }
      pts[pts.length-1].index = pts.length-1;

      compute();
    }
  }

  function add_signals(){ //Integrate OpenStreetMap Data into pts

    //iterate through pts, add signals
    var int_indexes = [];
    for(var i=0; i<pts.length; i++){
      if(pts[i].isIntersection){
        pts[i].stop = "sign";
        int_indexes.push(i);
      }
    }
    for(var i=0; i<signals.length; i++){
      var matched = false;
      for(var j=0; j<int_indexes.length; j++){
        if(Math.abs(signals[i].lat()-pts[int_indexes[j]].pt.lat())<0.001 && Math.abs(signals[i].lng()-pts[int_indexes[j]].pt.lng())<0.001){
          pts[int_indexes[j]].stop = "light";
          matched = true;
        }
      }
      if(!matched){
        for(var j=0; j<pts.length; j++){
          if(Math.abs(signals[i].lat()-pts[j].pt.lat())<0.0002 && Math.abs(signals[i].lng()-pts[j].pt.lng())<0.0002){
            pts[j].stop = "light";
            for(var k in pts[j].references){
              pts[k].stop = "light";
            }
            break;
          }
        }
      }
    }
  }

  function Force(data,speed){ //Returns force given speed and a pts.next/pts.last object
    //calculate force to maintain velocity at a point
    var Fpar = phys.g * phys.mass * Math.sin(data.angle);
    var Ffriction = phys.g * phys.mass * Math.cos(data.angle) * phys.rolling;
    var Fdrag = 0.5 * phys.CD * phys.air * phys.area * Math.pow(speed,2);
    return Fpar + Ffriction + Fdrag; //total force to maintain velocity in Newtons
  }

  function intersection_gen(){ //Make list of intersections from frequencies of points that stand out in the list
    intersections = {};
    var ptcount = {};

    var start = pts[0];
    var end = pts[pts.length-1];

    ptcount[start.string] = {frequency:start.references.length, indexes:start.references, coords:start.pt, connections:[]};
    ptcount[end.string] = {frequency:end.references.length, indexes:end.references, coords:end.pt, connections:[]};

    var freq = pts.map(function(a){return a.references.length});
    for(var i=0; i<freq.length-1; i++){
      try{
        if(freq[i]>freq[i+1] || freq[i]>freq[i-1]){
          if(!(pts[i].string in ptcount)){
            ptcount[pts[i].string] = {frequency:0, indexes:[], coords:pts[i].pt, connections:[]};
          }
          ptcount[pts[i].string].frequency++;
          ptcount[pts[i].string].indexes.push(i);
          for(var j=0; j<pts[i].references.length; j++){
            pts[pts[i].references[j]].isIntersection = true;
          }
        }
      }catch(err){}
    }
    var iter = 0;
    for(var i in ptcount){
      intersections[iter] = ptcount[i];
      var n = new google.maps.Marker({position:ptcount[i].coords, map:map, title:iter.toString()});
      iter++;
    }
  }
  
  function series_build(){ //makes a serialized list correlating intersection index to point index
    var output = []; //Terminators for paths
    for(var i in intersections){
      for(var j in intersections[i].indexes){
        output.push({pt_index:intersections[i].indexes[j], int_index:i});
      }
    }
    output.sort(function(a,b){return a.pt_index-b.pt_index});
    console.log(output);
    return output;
  }
  function intersections_strip(maximum){ //Strips intersections with connections.length <= maximum
    //remove extra intersections
    var series;
    var output = true;
    
    //reset the connections array for each intersection
    for(var i in intersections){
      intersections[i].connections = [];
    }
    
    //get series for original intersections
    series = series_build();
    
    //compile preliminary list of connections for each intersection. 
    //Array is easier to search through than object.
    for(var i=0; i<series.length-1; i++){
      //does connects to itself nor duplicate existing connections
      if(series[i].int_index!==series[i+1].int_index){
        if(intersections[series[i].int_index].connections.indexOf(series[i+1].int_index)===-1){
          intersections[series[i].int_index].connections.push(series[i+1].int_index);
          intersections[series[i+1].int_index].connections.push(series[i].int_index);
        }
      }
    }
    
    for(var i in intersections){
      //is dead-end (1 connection) or part of a larger path (2 connections)
      //is not start or end
      if(intersections[i].connections.length <= maximum && i!=="0" && i!=="1"){
        delete intersections[i];
        output = false;
      }
    }
    return output;
  }
  function ReturnNewPt(a){
    var b = JSON.parse(JSON.stringify(a));
    b.pt = a.pt;
    return b;
  };
  function Sums(path){
    var energy = 0;
    var speed = 0;
    var dist = 0;
    for(var S=0; S<path.length; S++){
      energy += ((path[S].next.dist===0)?0:Math.max(path[S].next.force, 0)*path[S].next.dist);
      dist += path[S].next.dist;
      speed += path[S].speed * path[S].next.dist;
    }
    return {energy_to:energy, speed:speed/dist, distance_to:dist, time_to:dist/(speed/dist)};
  }
  function intersection_build(){ //Get data for intersections
    
    intersections_strip(2);
    console.log(intersections);
    
    //rebuild series without deleted intersections
    var series = series_build();
    
    //assign data to final intersections
    for(var i in intersections){
      intersections[i].connections = {};
    }
    for(var i=0; i<series.length-1; i++){
      if(series[i].int_index!==series[i+1].int_index){
        intersections[series[i].int_index].connections[series[i+1].int_index] = {
          index:series[i+1].int_index,
          start:series[i].pt_index,
          end:series[i+1].pt_index+1,
          point:intersections[series[i].int_index].coords,
          path:[]
        };
      }
    }

    //add point data to intersections
    //need to use JSON to make copy in order to safely reverse next/last
    
    for(var i in intersections){
      for(var j in intersections[i].connections){
        intersections[i].connections[j].path = pts.slice(intersections[i].connections[j].start,intersections[i].connections[j].end).map(ReturnNewPt);
      }
    }

    var closest_end = 1;
    var closest_start = 0;

    for(var i in intersections){
      var c = intersections[i].connections;
      for(var j in c){
        var new_slice = c[j].path.slice(0,c[j].path.length-1);
        var data = Sums(new_slice);
        c[j].energy_to = data.energy_to;
        c[j].speed = data.speed;
        c[j].distance_to = data.distance_to;
        c[j].time_to = data.time_to;
      }
    }
  }

  function Branch(current, history, target, distance, max_dist){ //Find possible paths through the network of intersections
    //start args: 0,       [],      1,      0,        linear distance * 2
    var Int = intersections[current];
    for(var i in Int.connections){
      if(parseInt(i) === target){ //branch off has reached destination
        var indexes = history.concat(current, i);
        var cost = GetQuickCost(indexes);
        branches.push({quick_cost:cost, indexes:indexes});
      }else if(history.indexOf(i)===-1){ //has not been traveled to yet
        var total_dist = distance + Int.connections[i].distance_to;
        var remaining_dist = LatLngDist(ep, intersections[i].coords);
        //total distance and remaining distance are at reasonable levels
        //Conditions:
        //Distance already traveled plus the linear distance remaining is less than two times the linear distance from start to end
        //Intersection limit calibrated to number of intersections (removed); <sqrt(length)*2.5>
        if(total_dist + remaining_dist < max_dist){
          Branch(i, history.concat(current), target, distance, max_dist);
        }
      } //terminates if there are no available points, is at end, or is over distance limit
    }
  }

  function GetQuickCost(path){ //Calculates sum energy of intersections list using .connections.energy_to
    var total = 0;
    //iterate through path (list of intersections) and sum energy cost for each connection to intersections[i+1]
    for(var Pi=0; Pi<path.length-1; Pi++){
      if(intersections[path[Pi]].connections[path[Pi+1]]!==undefined){
        total += intersections[path[Pi]].connections[path[Pi+1]].energy_to;
      }
    }
    return total;
  }

  function GetPath(indexes){ //Makes list of points from a list of intersections
    output = [];
    //assemble list of points (like GetQuickCost in form)
    for(var i=0; i<indexes.length-1; i++){
      if(intersections[indexes[i]].connections[indexes[i+1]]!==undefined){
        output = output.concat(intersections[indexes[i]].connections[indexes[i+1]].path);
      }
    }

    //check for duplicate consecutive points, remove the first occurrence. Sets duplicates to null and splices them out
    for(var i=0; i<output.length-1; i++){
      if(output[i].pt.lat()===output[i+1].pt.lat() && output[i].pt.lng()===output[i+1].pt.lng()){ 
        output[i] = null;
      }
    }
    while(output.indexOf(null)!==-1){
      output.splice(output.indexOf(null),1);
    }

    return output;
  }

  function GetDetailedCost(path){ //Calculates more accurate amount of energy needed for a possible path

    function VelocityAtDistanceAccel(dist,start_vel){
      var start_dist = Math.pow(start_vel,2)/(ACCELRATE*2);
      return Math.sqrt(2 * ACCELRATE * (dist+start_dist));
    }

    function VelocityAtDistanceDecel(dist,start_vel){
      var dist_to_decel = Math.pow(start_vel,2)/(2*ACCELRATE);
      var accel_dist = dist_to_decel - dist;
      return VelocityAtDistanceAccel(accel_dist,0);
    }

    var energy = 0; //output

    //assign new speeds based on turns and speed changes
    for(var i=1; i<path.length-1; i++){
      if(path[i].stop === "light"){
        path[i].new_speed = 0;
      }else if(path[i].stop === "sign"){ //at an intersection
        var change = path[i].speed - path[i-1].speed;
        var direction = ANGLE(path[i-1].pt,path[i].pt,path[i+1].pt);
        if((direction>=225 && direction<360) || (direction>=-135 && direction<0)){ //is right turn
          if(change<=0){
            path[i].new_speed = 15*METERPS;
          }else{
            path[i].new_speed = 0;
          }
        }else if((direction>135 && direction<225) || (direction<-135 && direction>-225)){
          path[i].new_speed = path[i].speed;
        }else{
          if(change===0){
            path[i].new_speed = 15*METERPS;
          }else{
            path[i].new_speed = 0;
          }
        }
      }else{
        path[i].new_speed = path[i].speed;
      }
    }
    path[0].new_speed = 0;
    path[path.length-1].new_speed = 0;

    //recalculate force to next
    for(var i=0; i<path.length-1; i++){
      energy += ((path[i].next.dist===0 || path[i].next.force<0)?0:path[i].next.force * path[i].next.dist);
      if(path[i].new_speed !== path[i+1].new_speed){
        var speed_change = path[i+1].new_speed - path[i].new_speed;
        var dist_to_accel = Math.pow(path[i+1].speed,2)/(2*ACCELRATE) - Math.pow(path[i].speed,2)/(2*ACCELRATE);

        energy += dist_to_accel * phys.mass * ACCELRATE; //energy to accelerate vehicle (m^2*kg/s^2)

        energy -= 0.5 * phys.CD * phys.air * phys.area * Math.pow(path[i].speed,2) * dist_to_accel; //take away old drag
        if(dist_to_accel>0){ //there is acceleration
          for(var j=0; j<dist_to_accel; j++){
            energy += 0.5 * phys.CD * phys.air * phys.area * Math.pow(VelocityAtDistanceAccel(j,path[i].new_speed),2); //force per meter = energy
          }
        }else{
          for(var j=0; j<dist_to_accel; j++){
            energy += 0.5 * phys.CD * phys.air * phys.area * Math.pow(VelocityAtDistanceDecel(j,path[i].new_speed),2);
          }
        }
      }
    }
    return energy;
  }

  function compute(){ //controls intersection_gen() through geocode()
    var start_index = 0;
    var end_index = 1;

    //calculate force for points to go to next/last
    for(var i=0; i<pts.length-1; i++){
      pts[i].next.force = Force(pts[i].next,pts[i].speed);
    }
    for(var i=1; i<pts.length; i++){
      pts[i].last.force = Force(pts[i].last,pts[i].speed);
    }
    
    var t0 = new Date().getTime();
    intersection_gen();
    var t1 = new Date().getTime();
    add_signals();
    var t2 = new Date().getTime();
    intersection_build();
    var t3 = new Date().getTime();
    console.log("intersection_gen()",t1-t0);
    console.log("add_signals()",t2-t1);
    console.log("intersection_build()",t3-t2);
    
    //get tree of possible routes. Stored in branches variable
    var t4 = new Date().getTime();
    intersections_length = 0;
    for(var i in intersections){
      intersections_length++;
    }
    expected_distance = LatLngDist(intersections[start_index].coords, intersections[end_index].coords);
    Branch(start_index, [], end_index, 0, expected_distance * 1.4);
    var t5 = new Date().getTime();
    console.log("Branch()", t5-t4);
    
    //find most promising routes
    var quick_costs = branches.map(function(a){return a.quick_cost});
    optimal_quick_cost = branches[quick_costs.indexOf(MIN(quick_costs))].quick_cost;
    candidates = branches.map(function(a){return ((a.quick_cost<=optimal_quick_cost*1.3)?a:null);});
    while(candidates.indexOf(null)!==-1){
      candidates.splice(candidates.indexOf(null),1);
    }
    
    //get detailed cost of all candidates, choose the best as the optimal route
    for(var i=0; i<candidates.length; i++){
      candidates[i].path = GetPath(candidates[i].indexes);
      candidates[i].cost = GetDetailedCost(candidates[i].path);
    }
    var candidates_costs = candidates.map(function(a){return a.cost});
    optimal = candidates[candidates_costs.indexOf(MIN(candidates_costs))];

    geocode();
  }

  function geocode(){ //Gets road names using Google Geocoding

    function get(coords,slice,delay){
      var waiter = setTimeout(function(){
        var info;
        $.ajax({
method:"GET",
url:"https://maps.googleapis.com/maps/api/geocode/json?latlng="+parseInt(coords.lat()*100000)/100000+","+parseInt(coords.lng()*100000)/100000+"&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE",
dataType:'json',
success:function(a){geocodeCallback(a,slice)}
        });
      },delay);
    }

    function geocodeCallback(data,slice){
      if(data.status==="OK"){
        names = data.results[0].address_components;
        for(var Gi=0; Gi<names.length; Gi++){
          if(names[Gi].types.indexOf("route")!==-1){
            var name = names[Gi].long_name;
            break;
          }
        }
        for(var i=slice.start; i<slice.end; i++){
          optimal.path[i].road_name = name;
        }
        completed_queries++;
        geo_value.innerText = parseInt(Math.round(completed_queries/expected_queries*100))+"%";
      }else{
        console.log(data.status);
        failed_geocode_queries.push({coords:coords,slice:slice});
        failed_queries++;
      }
    }

    //setup console
    var c = document.getElementById("console").lastChild;
    var geo = document.createElement("tr");
    var geo_label = document.createElement("td");
    geo_label.appendChild(document.createTextNode("Geocoding:"));
    var geo_value = document.createElement("td");
    geo_value.id = "geo_status";
    geo_value.appendChild(document.createTextNode("0%"));
    geo.appendChild(geo_label);
    geo.appendChild(geo_value);
    c.appendChild(geo);
            
    var geocode_queries = [optimal.path[1].pt];
    var failed_geocode_queries = [];
    var slices = [];
    var slice_start = 0;
    for(var i=0; i<optimal.path.length-1; i++){
      if(optimal.path[i].isIntersection){
        slices.push({start:slice_start, end:i+1});
        slice_start = i+1;
        try{geocode_queries.push(optimal.path[i+2].pt)}catch(err){geocode_queries.push(optimal.path[i+1].pt)};
      }
    }
    slices.push({start:slice_start, end:optimal.path.length});
    var expected_queries = geocode_queries.length;
    var completed_queries = 0;
    var failed_queries = 0;
    for(var i=0; i<geocode_queries.length; i++){
      get(geocode_queries[i], slices[i], i*200);
    }
    var geocode_completion_check = setInterval(function(){
      if(failed_queries + completed_queries === expected_queries){
        if(completed_queries === expected_queries){
          optimal_instructions();
          clearInterval(geocode_completion_check);
        }else{
          failed_queries = 0;
          for(var i=0; i<failed_geocode_queries.length; i++){
            get(failed_geocode_queries[i].coords,failed_geocode_queries[i].slice,i*200+100);
          }
          failed_geocode_queries = [];
        }
      }
    },100);
  }
    
  function optimal_instructions(){ //Makes list of insructions for the optimal route

    function DistToNext(path,start){
      var total = 0;
      var output_text = "";
      for(var j=start+1; j<path.length-1; j++){
          if(path[j].road_name!==path[j+1].road_name || path[j].stop==="light" || j===path.length-2){
            var dist_miles = total / METERMILE;
            if(dist_miles>0.2){
              output_text += Math.ceil(dist_miles * 10) / 10 + " miles";
            }else{
              output_text += Math.ceil(total * FOOTMETER / 50) * 50 + " feet";
            }
            output_text += ((j===path.length-1)?" until reaching destination.":".");
            break;
          }else{
            total += path[j-1].next.dist;
          }
      }
      return {dist:total, text:output_text};
    }

    optimal.instructions = [];
    optimal.passing = [];
    var total_distance = 0;

    var first = "Go to "+optimal.path[0].road_name+" and head ";
    var pt1 = optimal.path[0].pt;
    var pt2 = optimal.path[1].pt;
    var lat = pt2.lat() - pt1.lat();
    var lng = pt2.lng() - pt1.lng();
    var direction;
    if(lat>0){
      if(lat>Math.abs(lng)){
        direction = "north";
      }else{
        if(lng>0){
          direction = "east";
        }else{
          direction = "west";
        }
      }
    }else{
      if(Math.abs(lat)>Math.abs(lng)){
        direction = "south";
      }else{
        if(lng>0){
          direction = "east";
        }else{
          direction = "west";
        }
      }
    }
    first += direction;
    first += " for ";
    var dist_data = DistToNext(optimal.path,0);
    first += dist_data.text;
    total_distance += dist_data.dist;

    optimal.instructions.push({
marker:null,
text:first,
turn_rounded:null,
turn_angle:null,
icon:"icons/start.png",
pt_data:optimal.path[0],
pt:optimal.path[0].pt,
dist_to_next:dist_data.dist
    });
    optimal.passing.push({
text:first,
dist_to_next:dist_data.dist,
turn_rounded:null,
turn_angle:null,
icon:"icons/start.png",
pt:{lat:optimal.path[0].pt.lat(), lng:optimal.path[0].pt.lng()}
    });

    for(var i=1; i<optimal.path.length-1; i++){
      if(optimal.path[i].road_name !== optimal.path[i+1].road_name || optimal.path[i].stop==="light"){
        console.log(optimal.path.slice(i-1,i+2));
        var text = "";
        var pt1 = optimal.path[i-1].pt;
        var pt2 = optimal.path[i].pt;
        var pt3 = optimal.path[i+1].pt;
        var change = ANGLE(pt1,pt2,pt3);
        var turn = Math.round(change/10)*10;
        turn += ((turn<0)?360:0);
        var turn_text;
        if(Math.abs(change)<225 && Math.abs(change)>135){
          turn_text = "straight";
        }else if((change>0 && change<135) || (change>-360 && change<-225)){
          turn_text = "left";
        }else{
          turn_text = "right";
        }
        text += ((turn_text==="straight")?"Continue ":"Turn ")+turn_text+" ";
        text += ((optimal.path[i].stop==="light")?"on ":"onto ");
        text += optimal.path[i+1].road_name;
        text += " and continue for ";
        var segment_distance_data = DistToNext(optimal.path,i);
        text += segment_distance_data.text;
        total_distance += segment_distance_data.dist;
        
        var icon;
        console.log(optimal.path[i].stop);
        if(optimal.path[i].stop === "light"){
          icon = "icons/stoplight.png";
        }else if(optimal.path[i].stop === "sign" && optimal.path[i].new_speed===0){
          icon = "icons/stopsign.png";
        }else{
          icon = "icons/arrow_"+turn_text+".png";
        }
        optimal.instructions.push({
marker:new google.maps.Marker({position:pt2, map:map, icon:icon, title:text}),
dist_to_next:segment_distance_data.dist,
text:text,
turn_rounded:turn,
turn_angle:change,
icon:icon,
pt_data:optimal.path[i],
pt:pt2
        });
        optimal.passing.push({
text:text,
dist_to_next:segment_distance_data.dist,
turn_rounded:turn,
turn_angle:change,
turn_icon:"icons/arrow_"+turn_text+".png",
dist_to_next:segment_distance_data.dist,
icon:icon,
pt:{lat:pt2.lat(), lng:pt2.lng()}
        });
      }
    }

    optimal.route_line = new google.maps.Polyline({
path:optimal.path.map(function(a){return a.pt}), 
geodesic:true, 
strokeColor:"#00ff00", 
strokeOpacity:1.0, 
strokeWeight:5});
    optimal.route_line.setMap(map);

    optimal.summary = {
path_polyline:(optimal.path.map(function(a){return a.pt.lat().toFixed(5) + "," + a.pt.lng().toFixed(5)})).join("|"),
map:{
  zoom:map.getZoom(),
  center:{lat:map.getCenter().lat().toFixed(5), lng:map.getCenter().lng().toFixed(5)}
},
dist:total_distance,
dist_text:((total_distance/METERMILE>0.2)?(total_distance/METERMILE).toFixed(1)+" miles":Math.ceil(total_distance*FOOTMETER/50)*50+" feet")
    };


    console.log(optimal);
    window.open("EcoCartographerInstructions.html#summary="+escape(JSON.stringify(optimal.summary))+"&instructions="+escape(JSON.stringify(optimal.passing)), "Instructions", "menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes");
  }

  //main start point in this function
  //initiates chain of functions
  for(var i=0; i<dir_requests.length; i++){
    SendDirRequest(dir_requests[i],i);
  }
}

function GetRouteFromInput(){ //initializes program by being triggered by the button
  //start/end variables
  var start = document.getElementById('start_input').value;
  var end = document.getElementById('end_input').value;
  
  //geocode points
  geocoder.geocode({address:start},function(results_start,status_start){
    if(status_start===google.maps.GeocoderStatus.OK){
      var start_coords = results_start[0].geometry.location;
      geocoder.geocode({address:end},function(results_end,status_end){
        if(status_end===google.maps.GeocoderStatus.OK){
          var end_coords = results_end[0].geometry.location;
          
          //place markers
          var start_marker = new google.maps.Marker({position:start_coords, map:map, icon:'icons/start.png', title:start});
          var end_marker = new google.maps.Marker({position:end_coords, map:map, icon:'icons/end.png', title:end});
          
          //execute Network function
          Network(start_coords,end_coords);

          //set up console using DOM
          var c = document.getElementById("console");
          var query = document.createElement("table");

          var destination = document.createElement("tr");
          var dest_label = document.createElement("td");
          dest_label.appendChild(document.createTextNode("Destination:"));
          var dest_value = document.createElement("td");
          dest_value.appendChild(document.createTextNode(end));
          destination.appendChild(dest_label);
          destination.appendChild(dest_value);
          query.appendChild(destination);

          var origin = document.createElement("tr");
          var origin_label = document.createElement("td");
          origin_label.appendChild(document.createTextNode("Origin:"));
          var origin_value = document.createElement("td");
          origin_value.appendChild(document.createTextNode(start));
          origin.appendChild(origin_label);
          origin.appendChild(origin_value);
          query.appendChild(origin);

          c.appendChild(query);
        }
      });
    }
  });
}

google.maps.event.addDomListener(window,'load',Initialize);