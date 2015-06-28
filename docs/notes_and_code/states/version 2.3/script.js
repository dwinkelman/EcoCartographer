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

function MAX(a){
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
function MIN(a){
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

function ANGLE(pt1,pt2,pt3){
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

function Initialize(){
  directionsDisplay = new google.maps.DirectionsRenderer({map:map});
  geocoder = new google.maps.Geocoder();
  var mapOptions = {zoom:10, center:new google.maps.LatLng(36,-80)};
  map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
  directionsDisplay.setMap(map);
}

function Network(sp,ep){

  var ca_local;
  var pt_count;
  var intersections;
  var over = [];
  var requests;
  var geo;
  var pts;
  var signals = [];
  var siglist;
  var speeds;
  var branches = [];
  var candidates = [];

  var optimal = {};

  var dlat = sp.lat()-ep.lat(); //difference lat/lng
  var dlng = sp.lng()-ep.lng();
  var center = new google.maps.LatLng(sp.lat()-dlat/2, sp.lng()-dlng/2); // center between dest and orig
  var hdist = Math.sqrt(dlat*dlat + dlng*dlng)/4; //half dist from orig to dest

  //set map view
  var map_bounds = new google.maps.LatLngBounds();
  map_bounds.extend(sp);
  map_bounds.extend(ep);
  map.fitBounds(map_bounds);

  //physics
  var phys = {
CD:document.getElementById("drag_coefficient").value,
area:document.getElementById("area").value,
air:AIRDENSITY,
mass:document.getElementById("mass").value,
g:GRAVITY,
rolling:0.03
  };

  
  pts = []; //used for list of all points in paths on map
  var ends = []; //used for listing all endpoints of segments on map
  var eind = []; //end indexes
  var end_ind_counter = 0; //end index counter
  var wpts1 = [	{location:new google.maps.LatLng(center.lat()+dlng/4,center.lng()-dlat/4), stopover:true},
		{location:ep, stopover:true},
		{location:new google.maps.LatLng(center.lat()+dlng/8,center.lng()-dlat/8), stopover:true},
		{location:sp, stopover:true},
		{location:new google.maps.LatLng(center.lat()-dlng/8,center.lng()+dlat/8), stopover:true},
		{location:sp, stopover:true},
		{location:new google.maps.LatLng(center.lat()-dlng/4,center.lng()+dlat/4), stopover:true}];
  var dir_requests = [	{origin:sp, destination:ep, avoidHighways:true, waypoints:wpts1, travelMode:google.maps.DirectionsTravelMode.DRIVING},
		{origin:sp, destination:ep, avoidHighways:false, waypoints:wpts1, travelMode:google.maps.DirectionsTravelMode.DRIVING}];
  var bounds;
  var start_index; var end_index; //used for intersection that is start/end

  var references;

  //length of Google query
  var route_dist = 0;
  var pts_dist = 0;

  function getDirs(req){
    setTimeout(
      directionsService.route(dir_requests[req], function(response, status){
        console.log(response);
        for(var i=0; i<response.routes[0].legs.length; i++){
          var L = response.routes[0].legs[i]; //current "leg" (organization level of directions path results)
          route_dist += L.distance.value;
          for(var j=0; j<L.steps.length; j++){
            var pc = L.steps[j]; //current "step" (org. level)
            eind.push(end_ind_counter);
            end_ind_counter += pc.path.length;
            ends.push(pc.path[0].toString()); //adds end of step to ends, for intersections
            for(var k=0; k<pc.path.length; k++){
              pts.push({
pt: pc.path[k], 
elevation: null, 
stop: null,
index: null,
next: {dist: null, slope: null, index: null}, 
last: {dist: null, slope: null, index: null},
string: pc.path[k].toString(),
isIntersection:((k===0 || k===pc.path.length-1)?true:false),
speed: Math.ceil(pc.distance.value/pc.duration.value/(METERPS*5))*(METERPS*5) //bumps up to nearest 5mph
              }); 
//adds each point to pts var
            }
          }
        }
        if(req===dir_requests.length-1){
          references = PointReferences();
          bounds = getBounds(pts);
          console.log(eind);
          overpass_signals();
          elevation();
        }
      }
    ),1000*req);
  }

  function PointReferences(){
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

  function getBounds(d){
    
    if(d.length===0){return NaN}
    var lat = d.map(function(a){return a.pt.lat()});
    var lng = d.map(function(a){return a.pt.lng()});
    var out = {north:MAX(lat), south:MIN(lat), east:MAX(lng), west:MIN(lng)};
    out.overpass_string = "("+out.south+","+out.west+","+out.north+","+out.east+")";
    console.log(out);
    return out;
  }

  function overpass_signals(){

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

  function elevation(){

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
        var cc = pts[i].pt; //current
        var nc = pts[i+1].pt; //next
        pts[i].next.dist = Math.hypot( (cc.lat()-nc.lat())*DIAMETER,  (cc.lng()-nc.lng())*Math.cos((cc.lat()+nc.lat())/2*RAD)*DIAMETER);

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
        var cc = pts[i].pt; //current
        var lc = pts[i-1].pt; //last
        pts[i].last.dist = Math.hypot( (cc.lat()-lc.lat())*DIAMETER,  (cc.lng()-lc.lng())*Math.cos((cc.lat()+lc.lat())/2*RAD)*DIAMETER);

        //set slope data
        var delev = pts[i-1].elevation - pts[i].elevation;
        var slope = delev/pts[i].last.dist;
        pts[i].last.slope = slope;
        pts[i].last.angle = Math.atan(slope);
        pts[i].last.angle_deg = Math.atan(slope)*RAD;
      }
      pts[pts.length-1].index = pts.length-1;

      compute();
    }
  }

  function add_signals(){//Integrate OpenStreetMap Data into pts

    //iterate through pts, add signals
    for(var i=0; i<eind.length; i++){
      pts[eind[i]].stop = "sign"; //will change to smarter detection
      try{pts[eind[i]-1].stop = "sign"}catch(err){};
    }
    for(var i=0; i<signals.length; i++){
      var matched = false;
      for(var j=0; j<eind.length; j++){
        if(Math.abs(signals[i].lat()-pts[eind[j]].pt.lat())<0.001 && Math.abs(signals[i].lng()-pts[eind[j]].pt.lng())<0.001){
          pts[eind[j]].stop = "light";
          try{
            pts[eind[j]-1].stop = "light";
          }catch(err){};
          matched = true;
        }
      }
      if(!matched){
        var last = -Infinity;
        for(var j=0; j<pts.length; j++){
          if(Math.abs(signals[i].lat()-pts[j].pt.lat())<0.0002 && Math.abs(signals[i].lng()-pts[j].pt.lng())<0.0002){
            if(j-1!==last){
              pts[j].stop = "light";
            }
            last = j;
          }
        }
      }
    }
  }

  function Force(data,speed){
    //calculate force to maintain velocity at a point
    var Fpar = phys.g * phys.mass * Math.sin(data.angle);
    var Ffriction = phys.g * phys.mass * Math.cos(data.angle) * phys.rolling;
    var Fdrag = 0.5 * phys.CD * phys.air * phys.area * Math.pow(speed,2);
    return Fpar + Ffriction + Fdrag; //total force to maintain velocity in Newtons
  }

  function intersection_gen(){
    intersections = {info:[], list:[]};
    var ptcount = {};
    for(var i=0; i<pts.length; i++){
      if(pts[i].isIntersection){
        var coord = pts[i].string;
        if(!(coord in ptcount)){
          ptcount[coord] = {frequency:0, indexes:[], coords:pts[i].pt, connections:[]};
        }
        ptcount[coord].frequency++;
        ptcount[coord].indexes.push(i);
      }
    }
    for(var i=0; i<pts.length; i++){
      if(pts[i].string in ptcount){
        ptcount[pts[i].string].frequency++;
        ptcount[pts[i].string].indexes.push(i);
      }
    }
    for(var i in ptcount){
      intersections.info.push(ptcount[i]);
      intersections.list.push(ptcount[i].coords);
    }
  }

  
  function intersection_build(){

    var series = []; //Terminators for paths
    for(var i=0; i<intersections.info.length; i++){
      var I = intersections.info[i];
      for(var j=0; j<I.indexes.length; j++){
        series.push([I.indexes[j], I.coords]);
      }
    }
    series.sort(function(a,b){return a[0]-b[0]});
    var ilist = intersections.list;
    var iinfo = intersections.info;
    for(var i=0; i<series.length-1; i++){
      iinfo[ilist.indexOf(series[i][1])].connections.push({
reversed:false, 
point:series[i+1][1], 
index:ilist.indexOf(series[i+1][1]), 
slice:{start:series[i][0], end:series[i+1][0]+1}
      });
      iinfo[ilist.indexOf(series[i+1][1])].connections.push({
reversed:true, 
point:series[i][1], 
index:ilist.indexOf(series[i][1]), 
slice:{start:series[i][0], end:series[i+1][0]+1}
      });
    }

    for(var i=0; i<iinfo.length; i++){
      var Int = iinfo[i];
      for(var j=0; j<Int.connections.length; j++){
        var Con = Int.connections[j];
        Con.path = [];
        for(var k=Con.slice.start; k<Con.slice.end; k++){
          Con.path.push(JSON.parse(JSON.stringify(pts[k])));
        }
        for(var k=0; k<Con.path.length; k++){
          Con.path[k].pt = pts[k+Con.slice.start].pt;
        }
        if(Con.reversed){
          Con.path.reverse();
        }
      }
    }
    console.log(iinfo);

    var closest_end = {dist:Infinity, index:-1};
    var closest_start = {dist:Infinity, index:-1};

    for(var i=0; i<iinfo.length; i++){
      if(Math.hypot(intersections.info[i].coords.lat()-ep.lat(),intersections.info[i].coords.lng()-ep.lng())<closest_end.dist){ //is closest to end_point
        closest_end = {dist:Math.hypot(intersections.info[i].coords.lat()-ep.lat(),intersections.info[i].coords.lng()-ep.lng()), index:i};
        console.log("end   ",i);
        end_index = i;
      }
      if(Math.hypot(intersections.info[i].coords.lat()-sp.lat(),intersections.info[i].coords.lng()-sp.lng())<closest_start.dist){ //is closest to end_point
        closest_start = {dist:Math.hypot(intersections.info[i].coords.lat()-sp.lat(),intersections.info[i].coords.lng()-sp.lng()), index:i};
        console.log("start ",i);
        start_index = i;
      }
    }

    for(var i=0; i<iinfo.length; i++){
      var paths = iinfo[i].connections;
      var indexes = paths.map(function(a){return a.index});
      for(var j=0; j<paths.length; j++){
        if(indexes.indexOf(paths[j].index)===j && paths[j].index!==i && paths[j].path.length>2){
          var energy_to = 0; //energy to move along section of road in Joules (n*m)
          var speed = 0;
          var dist = 0;
          var speed_dist = 0;

          //if reversed, flip-flop last/next
          if(paths[j].reversed===true){
            for(var k=0; k<paths[j].path.length; k++){
              var old_next = paths[j].path[k].next;
              var old_last = paths[j].path[k].last;
              intersections.info[i].connections[j].path[k].next = old_last;
              intersections.info[i].connections[j].path[k].last = old_next;
            }
          }

          paths[j].path.slice(0,paths[j].path.length-2).map(function(a){
energy_to += ((a.next.force===NaN)?0:Math.max(a.next.force * a.next.dist, 0));
dist += a.next.dist; 
speed += a.speed * a.next.dist; speed_dist += a.next.dist
          });

          intersections.info[i].connections[j].energy_to = energy_to;
          intersections.info[i].connections[j].speed = speed/dist;
          intersections.info[i].connections[j].distance_to = dist;
          intersections.info[i].connections[j].time_to = dist/(speed/dist);
        }else{
          intersections.info[i].connections[j] = null;
        }
      }
      while(intersections.info[i].connections.indexOf(null)!==-1){ //strip removed connections
        intersections.info[i].connections.splice(intersections.info[i].connections.indexOf(null),1);
      }
    }
  }

  function Branch(index,lastIndexes,start,target){
    var possible = intersections.info[index].connections.map(function(a){return a.index});
    for(var B=0; B<possible.length; B++){
      if(possible[B]===target){ //is at end
        if(lastIndexes[0] === start){
          branches.push({indexes:lastIndexes.concat(target), quick_cost:GetQuickCost(lastIndexes.concat(target))});
        }
        break;
      }else if(lastIndexes.indexOf(possible[B])===-1){ //is not in current path
        Branch(possible[B],lastIndexes.concat(possible[B]),start,target);
      }
    }
  }

  function GetQuickCost(path){
    var total = 0;
    for(var Pi=0; Pi<path.length-1; Pi++){
      var conind = intersections.info[path[Pi]].connections.map(function(a){return a.index});
      if(conind.indexOf(path[Pi+1])!==-1){
        total += intersections.info[path[Pi]].connections[conind.indexOf(path[Pi+1])].energy_to;
      }
    }
    return total;
  }

  function GetPath(indexes){
    output = [];
    for(var i=0; i<indexes.length-1; i++){
      var conind = intersections.info[indexes[i]].connections.map(function(a){return a.index});
      if(conind.indexOf(indexes[i+1])!==-1){
        var path = intersections.info[indexes[i]].connections[conind.indexOf(indexes[i+1])].path;
        output = output.concat(path);
      }
    }

    //check for duplicate consecutive points, remove the first occurance
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

  function GetDetailedCost(path){

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
      energy += ((path[i].next.force===NaN || path[i].next.force<0)?0:path[i].next.force * path[i].next.dist);
      if(path[i].new_speed !== path[i+1].new_speed){
        var speed_change = path[i+1].new_speed - path[i].new_speed;
        var dist_to_accel = Math.pow(path[i+1].speed,2)/(2*ACCELRATE) - Math.pow(path[i].speed,2)/(2*ACCELRATE);

        energy += dist_to_accel * phys.mass * ACCELRATE; //energy to accelerate vehicle (m^2*kg/s^2)

        energy -= 0.5 * phys.CD * phys.air * phys.area * Math.pow(path[i].speed,2) * dist_to_accel; //take away old drag
        if(dist_to_accel>0){ //there is acceleration
          for(var j=0; j<dist_to_accel; j++){
            energy += 0.5 * phys.CD * phys.air * phys.area * Math.pow(VelocityAtDistanceAccel(j,path[j].new_speed),2); //force per meter = energy
          }
        }else{
          for(var j=0; j<dist_to_accel; j++){
            energy += 0.5 * phys.CD * phys.air * phys.area * Math.pow(VelocityAtDistanceDecel(j,path[j].new_speed),2);
          }
        }
      }
    }
    return energy;
  }

  function compute(){

    //calculate force for points to go to next/last
    for(var i=0; i<pts.length-1; i++){
      pts[i].next.force = Force(pts[i].next,pts[i].speed);
    }
    for(var i=1; i<pts.length; i++){
      pts[i].last.force = Force(pts[i].last,pts[i].speed);
    }
    add_signals();
    intersection_gen();
    intersection_build();

    console.log(start_index,end_index);
    Branch(start_index,[start_index],start_index,end_index);
    var quick_costs = branches.map(function(a){return a.quick_cost});
    optimal_quick_cost = branches[quick_costs.indexOf(MIN(quick_costs))].quick_cost;
    candidates = branches.map(function(a){return ((a.quick_cost<=optimal_quick_cost*1.3)?a:null);});
    while(candidates.indexOf(null)!==-1){
      candidates.splice(candidates.indexOf(null),1);
    }
    for(var i=0; i<candidates.length; i++){
      candidates[i].path = GetPath(candidates[i].indexes);
      candidates[i].cost = GetDetailedCost(candidates[i].path);
    }
    var candidates_costs = candidates.map(function(a){return a.cost});
    optimal = candidates[candidates_costs.indexOf(MIN(candidates_costs))];

    geocode();
  }

  function geocode(){

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
      }else{
        console.log(data.status);
        failed_geocode_queries.push({coords:coords,slice:slice});
        failed_queries++;
      }
    }
            
    var geocode_queries = [optimal.path[1].pt];
    var failed_geocode_queries = [];
    var slices = [];
    var slice_start = 0;
    for(var i=0; i<optimal.path.length-1; i++){
      if(optimal.path[i].speed!==optimal.path[i+1].speed){
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
    
  function optimal_instructions(){

    function DistToNext(path,start){
      var total = 0;
      var output_text = "";
      for(var j=start+1; j<path.length; j++){
          if(path[j-1].speed!==path[j].speed || path[j].stop==="light" || j===path.length-1){
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
icon:"__start_marker__.png",
pt_data:optimal.path[0],
pt:optimal.path[0].pt,
dist_to_next:dist_data.dist
    });
    optimal.passing.push({
text:first,
dist_to_next:dist_data.dist,
turn_rounded:null,
turn_angle:null,
icon:"__start_marker__.png",
pt:{lat:optimal.path[0].pt.lat(), lng:optimal.path[0].pt.lng()}
    });

    for(var i=1; i<optimal.path.length-1; i++){
      if(optimal.path[i-1].speed!==optimal.path[i].speed || optimal.path[i].stop==="light"){
        console.log(optimal.path.slice(i-1,i+2));
        var text = "";
        var pt1 = optimal.path[i-1].pt;
        var pt2 = optimal.path[i].pt;
        var pt3 = optimal.path[i+1].pt;
        var change = ANGLE(pt1,pt2,pt3);
        var turn = Math.round(change/10)*10;
        turn += ((turn<0)?360:0);
        if(Math.abs(change)<225 && Math.abs(change)>135){
          text += "Continue straight ";
        }else if((change>0 && change<135) || (change>-360 && change<-225)){
          text += "Turn left ";
        }else{
          text += "Turn right ";
        }
        text += ((optimal.path[i].stop==="light")?"on ":"onto ");
        text += optimal.path[i].road_name;
        text += " and continue for ";
        var segment_distance_data = DistToNext(optimal.path,i);
        text += segment_distance_data.text;
        total_distance += segment_distance_data.dist;
        
        var icon;
        console.log(optimal.path[i].stop);
        if(optimal.path[i].stop === "light"){
          icon = "__stoplight__.png";
        }else if(optimal.path[i].stop === "sign" && optimal.path[i].speed!==optimal.path[i].new_speed){
          icon = "__stopsign__.png";
        }else{
          icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
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

  for(var i=0; i<dir_requests.length; i++){
    getDirs(i);
  }
}

function GetRouteFromInput(){
  var start = document.getElementById('start_input').value;
  var end = document.getElementById('end_input').value;

  geocoder.geocode({address:start},function(results_start,status_start){
    if(status_start===google.maps.GeocoderStatus.OK){
      var start_coords = results_start[0].geometry.location;
      geocoder.geocode({address:end},function(results_end,status_end){
        if(status_end===google.maps.GeocoderStatus.OK){
          var end_coords = results_end[0].geometry.location;
          console.log(start_coords,end_coords);
          var start_marker = new google.maps.Marker({position:start_coords, map:map, icon:'__start_marker__.png', title:start});
          var end_marker = new google.maps.Marker({position:end_coords, map:map, icon:'__end_marker__.png', title:end});
          Network(start_coords,end_coords);

          //set up console
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