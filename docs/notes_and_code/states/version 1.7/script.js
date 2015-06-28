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
var ca_local;
var pt_count;
var intersections;
var over = [];
var requests;
var geo;
var pts;
var signals;
var siglist;
var speeds;
var branches = [];

var DIAMETER = 40075000/360; //earth diameter in meters per degree
var METERPS = 0.44704; //meters/second per mile/second
var AIRDENSITY = 1.2754; //kg/m^3
var GRAVITY = 9.80665; //m/s^2
var RAD = 180/Math.PI;

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


function Network(sp,ep){

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
  var elevation_data; //stores output from elevation request
  var bounds;
  var data_complete = 0;

  //length of Google query
  var route_dist = 0;
  var pts_dist = 0;

  function htmldiv(){
    var frame = document.createElement("div");
    var status = document.createElement("div");
    var status_text = document.createTextNode("Working....");
    status.appendChild(status_text);
  }

  function getDirs(req){
    setTimeout(
      directionsService.route(dir_requests[req], function(response, status){
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
intpt: {lat: parseInt(pc.path[k].lat()*100000), lng: parseInt(pc.path[k].lng()*100000)},
elevation: null, 
road_name: {real:null, reversed:null, plain:null}, //different combos to match with overpass for roads with names like North Peace Haven Road
road_data: null,
stop: null,
index: null,
next: {dist: null, slope: null, index: null}, 
last: {dist: null, slope: null, index: null}}); //adds each point to pts var
            }
          }
        }
        if(req===dir_requests.length-1){
          bounds = getBounds(pts);
          console.log(eind);
          elevation();
          overpass();
          geocode();
        }
      }
    ),1000*req);
  }

  function getBounds(d){
    
    if(d.length===0){return NaN}
    var lat = d.map(function(a){return a.pt.lat()});
    var lng = d.map(function(a){return a.pt.lng()});
    var out = {north:MAX(lat), south:MIN(lat), east:MAX(lng), west:MIN(lng)};
    return out;
  }

  function geocode(){

    function combo(n){
      var ILLEGALS = ['Northwest','Northeast','Southwest','Southeast','North','South','East','West'];
      var output = {real:n, reversed:null, plain:null};
      var name = n;
      while(name.indexOf(".")!==-1){name=name.replace(".","")}; //Take out periods i.e. U.S. 421 --> US 421 for formatting
      name = name.replace("Interstate","I");
      if(name.indexOf("Business")!==-1){
        name = name.replace("Business ","");
        name = "I "+name+" Business";
      }
      for(var i=0; i<ILLEGALS.length; i++){
        if(name.indexOf(ILLEGALS[i])===0){
          name = name.replace(ILLEGALS[i]+' ','');
          output.plain = name;
          name += ' '+ILLEGALS[i];
          output.reversed = name;
          break;
        }else if(name.indexOf(ILLEGALS[i])!==-1){
          name = name.replace(' '+ILLEGALS[i],'');
          output.plain = name;
          name = ILLEGALS[i]+' '+name;
          output.reversed = name;
          break;
        }else{
          output.plain = name;
          output.reversed = name;
        }
      }
      return output;
    }

    /*function getName(d){ //takes array of result XML tags
      var address_nodes;
      var component_node;
      for(var i=0; i<d.length; i++){
        if(d[i].getElementsByTagName("type")[0].value==="street_address"){
          address_nodes = d[i].getElementsByTagName("address_component");
          break;
        }
      }
      for(var i=0; address_nodes.length; i++){
        if(address_nodes[i].getElementsByTagName("type")[0].value==="route"){
          var component_node = address_nodes[i];
          break;
        }
      }
      return component_node.getElementsByTagName("long_name")[0].value;
    }*/

    function getName(d){ //takes array of result XML tags
      var a;
      var s;
      for(var i=0; i<d.length; i++){
        var t = d[i].getElementsByTagName("type");
        for(var j=0; j<t.length; j++){
          if(t[j].innerHTML === "street_address" || t[j].innerHTML === "route"){
            a = d[i].getElementsByTagName("address_component");
            break;
          }
        }
      }
      if(a!==undefined){
        for(var i=0; i<a.length; i++){
          if(a[i].getElementsByTagName("type")[0].innerHTML === "route"){
            s = a[i].getElementsByTagName("long_name")[0].innerHTML;
            break;
          }
        }
      }else{
        s = "undefined"; //needs to be string for later operations
      }
      return s;
    }

    geo = [];
    var iter = 0; //counter for the timeout
    for(var i=0; i<eind.length-1; i++){
      setTimeout(function(){
        var info = new XMLHttpRequest();
        info.open("GET","https://maps.googleapis.com/maps/api/geocode/xml?latlng="+(((pts[eind[iter]+1].pt.toString()).replace(" ","")).replace("(","")).replace(")","")+"&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE",true);
        info.send();
        geo.push({xml:info, done:false, range:{start:eind[iter], end:eind[iter+1]}});
        console.log("GEOCODE");
        if(iter===eind.length-2){
          check();
        }
        iter++;
      },200*i);
    }
    
    function check(){
      console.log("reached check()");
      var loop = setInterval(function(){
        for(var i=0; i<geo.length; i++){
          var num = 0;
          if(geo[i].done===false){
            if(geo[i].xml.responseXML!==null){
              var name = getName(geo[i].xml.responseXML.children[0].getElementsByTagName("result"));
              geo[i].done = true;
              var list = combo(name);
              for(var j=geo[i].range.start; j<geo[i].range.end; j++){
                pts[j].road_name = list;
              }
            }else{
              num++;
            }
          }
        }
        if(num===0){
          clearInterval(loop);
          data_complete++;
          wait();
        }
      });
    }
  }
    
  function geocodeOLD(){
    console.log(pts);
    function G(start,end,islast){
      setTimeout(function(){
        geocoder.geocode({'latLng':pts[parseInt((start+end)/2)].pt},function(results_geo,status){
          console.log(status);
          var name = results_geo[0].address_components[1].long_name;
          for(var j=start; j<end+1; j++){
            pts[j].road_name = name;
          }
        });
      },100*i);
      if(islast){
        data_complete++;
        wait();
      }
    }
    for(var i=0; i<ends.length-1; i++){
      G(eind[i],eind[i+1],((i===eind.length-2)?true:false));
    }
  }


  function elevation(){
    //Elevation
    var elev_request = {locations:[]} //Elevation Request
    var num_elev_pts = Math.min(350,pts.length);
    for(var i=0; i<pts.length; i+=pts.length/num_elev_pts){
      elev_request.locations.push(pts[Math.floor(i)].pt);
    }
    console.log(elev_request);
    elevationService.getElevationForLocations(elev_request, function(results, status){
      if(status===google.maps.ElevationStatus.OK){
        elevation_data = results;
        pt_to_elev_ratio = (pts.length-1)/num_elev_pts

        //fill in skeleton elevation data (returned in results)
        for(var i=0; i<results.length; i++){
          pts[Math.floor(i*pt_to_elev_ratio)].elevation = results[i].elevation
        }

        //set index variable in pts.next and pts.last
        for(var i=1; i<pts.length-1; i++){
          pts[i].index = i;
          if(i!=0 && i!=pts.length-1){
            pts[i].last.index = i-1;
            pts[i].next.index = i+1;
          }
        }
        pts[0].last.index = 0;
        pts[0].next.index = 1;
        pts[pts.length-1].last.index = pts.length-2;
        pts[pts.length-1].next.index = pts.length-1;

	//set distances between pts
        rad = 180/Math.PI;
        for(var i=1; i<pts.length-1; i++){
          //coords (current, last, next for convenience with equations)
          var cc = pts[i].pt;
          var lc = pts[i-1].pt;
          var nc = pts[i+1].pt;
          pts[i].last.dist = Math.hypot( (cc.lat()-lc.lat())*DIAMETER,  (cc.lng()-lc.lng())*Math.cos((cc.lat()+lc.lat())/2*rad)*DIAMETER);
          pts[i].next.dist = Math.hypot( (cc.lat()-nc.lat())*DIAMETER,  (cc.lng()-nc.lng())*Math.cos((cc.lat()+nc.lat())/2*rad)*DIAMETER);
          pts_dist += pts[i].last.dist;
        }
        var cc = pts[0].pt;
        var nc = pts[1].pt;
        pts[0].next.dist = Math.hypot( (cc.lat()-nc.lat())*DIAMETER,  (cc.lng()-nc.lng())*Math.cos((cc.lat()+nc.lat())/2*rad)*DIAMETER);
        cc = pts[pts.length-1].pt;
        var lc = pts[pts.length-2].pt;
        pts[pts.length-1].last.dist = Math.hypot( (cc.lat()-lc.lat())*DIAMETER,  (cc.lng()-lc.lng())*Math.cos((cc.lat()+lc.lat())/2*rad)*DIAMETER);
        pts_dist += pts[pts.length-1].last.dist;

        //set elevations between other points based on linear slope
        var elev_pts = [];
        var elev_slice_pieces = [];
        for(var i=0; i<pts.length; i++){
          if(pts[i].elevation!==null){
            elev_pts.push(i);
          }
        }
        for(var i=0; i<elev_pts.length-1; i++){
          elev_slice_pieces.push([elev_pts[i],elev_pts[i+1]]);
        }
        console.log(elev_slice_pieces);
        for(var i=0; i<elev_slice_pieces.length; i++){
          var start = pts[elev_slice_pieces[i][0]];
          var end = pts[elev_slice_pieces[i][1]];
          var slice = elev_slice_pieces[i];
          var d_elev = start.elevation-end.elevation; // going from start to end, /=pos & \=neg
          var dist = 0;
          for(var j=slice[0]+1; j<slice[1]; j++){
            dist += pts[j].last.dist;
          }
          dist += end.last.dist;
          var slope = d_elev / dist; //rise over run
          var angle = Math.asin(slope);
          var angle_deg = angle*180/Math.PI;
          var gone = 0; //counter for next loop
          for(var j=slice[0]; j<slice[1]; j++){
            gone += pts[j].last.dist;
            pts[j].last.slope = -1*slope;
            pts[j].last.angle = -1*angle;
            pts[j].last.angle_deg = -1*angle_deg;
            pts[j].next.slope = slope;
            pts[j].next.angle = angle;
            pts[j].next.angle_deg = angle_deg;
            pts[j].elevation = start.elevation + slope * gone;
          }
        }
        data_complete++;
        
      }else{
        console.log(status);
      };
    });
  }

  function overpass(){

    var ALLOWEDKEYS = ['name','highway','bicycle','foot','oneway','sidewalk','lanes','maxspeed','tiger:county'];
    speeds = {}; /*holds speed info, used to calculate averages.
    data structure: {'tiger:county':{highway:{maxspeed_1:<num of occurances>, maxspeed_2:....}....}....}
    */

    //extract data from an XML group
    function parse(d){
      var output = {};
      for(var j=0; j<d.length; j++){
        var tags = d[j].getElementsByTagName("tag");

        //Check for specific attributes
        var name; var maxspeed; var county; var highway; var ref;
        for(var k=0; k<tags.length; k++){
          var key = tags[k].attributes.k.value;
          if(key==="name"){
            name = tags[k].attributes.v.value;
          }else if(key==="maxspeed"){
            maxspeed = tags[k].attributes.v.value;
          }else if(key==="tiger:county"){
            county = tags[k].attributes.v.value;
          }else if(key==="highway"){
            highway = tags[k].attributes.v.value;
          }else if(key==="ref"){
            ref = tags[k].attributes.v.value;
          }
        }

        var roads = [undefined];
        if(name!==undefined){
          roads = name.split(";");
        }else if(ref!==undefined){
          roads = ref.split(";");
        }
          
        /*//add attributes to output
        for(var k=0; k<tags.length; k++){
          var key = tags[k].attributes.k.value;
          if(ALLOWEDKEYS.indexOf(key)!==-1){
            var value = tags[k].attributes.v.value;
            for(var road=0; road<roads.length; road++){
              output[roads[road]][key] = value;
            }
          }
        }*/

        var new_data = {};
        for(var t=0; t<tags.length; t++){
          var key = tags[t].attributes.k.value;
          new_data[key] = tags[t].attributes.v.value;
        }
        var nodes = d[j].getElementsByTagName("nd").length;
        new_data.nodes = nodes;

        //add name to output
        for(var r=0; r<roads.length; r++){
          if(!(roads[r] in output)){
            output[roads[r]] = {data:[]};
          }
          output[roads[r]].data.push(new_data);
        }

        //add info to speeds to later calculate averages
        if(county && maxspeed && highway){
          if(!(county in speeds)){
            speeds[county] = {};
          }
          if(!(highway in speeds[county])){
            speeds[county][highway] = {data:[], average:null};
          }
          for(var r=0; r<roads.length; r++){
            speeds[county][highway].data.push({speed:parseInt(maxspeed)*METERPS, nodes:nodes, name:roads[r], multiple_names:roads, raw:new_data});
          }
        }

        //reset variables
        name = undefined; ref = undefined; maxspeed = undefined; highway = undefined; county = undefined;
      }
      return output;
    }

    over = [];
    over.default = {data:[], speed:35*METERPS}
    requests = [];
    console.log(bounds);
    //Get Road Data
    for(var i=bounds.south; i<bounds.north; i+=0.04){
      for(var j=bounds.west; j<bounds.east; j+=0.04){
        var info = new XMLHttpRequest();
        info.open("GET","http://overpass-api.de/api/interpreter?data="+escape('way["highway"]('+i+','+j+','+(i+0.04)+','+(j+0.04)+');out;'),true);
        try{info.send();}catch(err){alert("There was a problem with the Overpass API query. "+err+". Please try again")}
        requests.push({bounds:{south:i, north:i+0.04, west:j, east:j+0.04}, xml:info, done:false});
      }
    }

    //Get Traffic Signal Data
    var signal_request = new XMLHttpRequest();
    signal_request.open("GET","http://overpass-api.de/api/interpreter?data="+escape('node["highway"="traffic_signals"]('+bounds.south+','+bounds.west+','+bounds.north+','+bounds.east+');out;'),true);
    signal_request.send();
    requests.push({bounds:"signals", xml:signal_request, done:false});
    console.log(requests);
    var loop = setInterval(function(){ //iterates through requests, checks for response
      var num = 0; //if 0 after for loop, exits setInterval
      for(var i=0; i<requests.length; i++){
        if(requests[i].done===false){
          if(requests[i].xml.responseXML!==null){
            if(requests[i].bounds!=="signals"){
              var streets = parse(requests[i].xml.responseXML.children[0].getElementsByTagName("way"));
              over.push({bounds:requests[i].bounds, data:streets});
            }else{
              signals = requests[i].xml.responseXML.children[0].getElementsByTagName("node");
            }
            requests[i].done = true; //marks as 'processed'
          }else{
            num++;
          }
        }
      }
      if(num===0){
        clearInterval(loop);
        console.log(over);
        data_complete++;
      }
    },100);
  }

  function wait(){
    if(data_complete===3){
      compute();
    }else{
      setTimeout(wait,100);
    }
  }

  function compute(){

  function add_signals(){//Integrate OpenStreetMap Data into pts

    //signals list
    siglist = [];
    for(var i=0; i<signals.length; i++){
      siglist.push({lat:parseInt(signals[i].attributes.lat.value*100000), lng:parseInt(signals[i].attributes.lon.value*100000)});
    }

    //iterate through pts, add signals
    for(var i=0; i<pts.length; i++){
      //assign stop lights to pts
      for(var j=0; j<siglist.length; j++){
        if(Math.abs(siglist[j].lat-pts[i].intpt.lat)<20 && Math.abs(siglist[j].lng-pts[i].intpt.lng)<20){
          pts[i].stop = "light";
          var m = new google.maps.Marker({position:pts[i].pt, icon:"http://maps.google.com/mapfiles/ms/icons/yellow.png", map:map});
        }else if(eind.indexOf(i)!==-1){
          pts[i].stop = "sign";
        }
      }
    }
    }

    function add_speeds(){
    //calculate speed averages
    function average(d){ //returns median speed limit
      var list = [];
      d.map(function(a){for(var i=0; i<a.nodes; i++){list.push(a.speed)}}); //make speed average based on number of nodes in road
      list.sort();
      return list[parseInt(list.length/2)]; //median of data
    }

    function average_road(d){
      var s = 0;
      var c = 0;
      d.map(function(a){
        if(a.maxspeed){
          var speed = METERPS*parseInt(a.maxspeed);
          s += speed * a.nodes;
          c += a.nodes
        }
      });
      if(c>0){
        return s/c;
      }else if(d.length>0){
        try{if(d[0].highway in speeds[d[0]["tiger:county"]]){
          return speeds[d[0]["tiger:county"]][d[0].highway].average;
        }else{
          return 35*METERPS;
        }}catch(err){} //in case of no listed county
      }else{
        return 35*METERPS;
      }
    }

    for(var i in speeds){
      for(var j in speeds[i]){
        speeds[i][j].average = average(speeds[i][j].data);
      }
      speeds[i].default = (speeds[i].residential!==undefined)?speeds[i].residential.average:35*METERPS;
    }

    for(var i=0; i<over.length; i++){
      var b = over[i].bounds;

      //assign speed to road
      for(var j in over[i].data){
        over[i].data[j].speed = average_road(over[i].data[j].data);
      }

      //assign data to pts
      for(var j=0; j<pts.length; j++){
        var lat = pts[j].pt.lat();
        var lng = pts[j].pt.lng();
        if(b.north>=lat && b.south<=lat && b.west<=lng && b.east>=lng){
          var rn = pts[j].road_name;
          if(rn.real in over[i].data){
            pts[j].road_data = over[i].data[rn.real];
          }else if(rn.reversed in over[i].data){
            pts[j].road_data = over[i].data[rn.reversed];
          }else if(rn.plain in over[i].data){
            pts[j].road_data = over[i].data[rn.plain];
          }else{
            pts[j].road_data = over.default
          }
        }
      }
    }
    
    console.log(pts);

    /*//add speed limit
    for(var i=0; i<pts.length; i++){
      if(pts[i].road_data.data.length>0){
        if(pts[i].road_data.data[0].highway in speeds[pts[i].road_data.data[0]["tiger:county"]]){ //has data from other roads of it's type
          pts[i].road_data.speed = speeds[pts[i].road_data.data[0]["tiger:county"]][pts[i].road_data.data[0].highway].average;
        }else{ //NOTHING
          pts[i].road_data.speed = speeds[pts[i].road_data.data[0]["tiger:county"]].default;
        }
      }
    }*/

    //calculate force to maintain velocity at a point
    for(var i=0; i<pts.length-1; i++){
      var Fpar = phys.g * phys.mass * Math.sin(pts[i].next.angle);
      var Ffriction = phys.g * phys.mass * Math.cos(pts[i].next.angle) * phys.rolling;
      var Fdrag;
      try{Fdrag = 0.5 * phys.CD * phys.air * phys.area * Math.pow((pts[i].road_data.speed+pts[i+1].road_data.speed)/2,2);}catch(err){console.log(i)};
      pts[i].next.force = Fpar + Ffriction + Fdrag; //total force to maintain velocity in Newtons
      pts[i+1].last.force = -1*Fpar + Ffriction + Fdrag;
    }
    }

    function intersection_gen(){
    var pt_keys = {};
    pt_count = [];
    pt_consec = [];
    for(var i=0; i<pts.length; i++){
      pt_keys[pts[i].pt] = [0,[]];
      if(i<pts.length-1){
        if(pts[i].pt===pts[i+1].pt){
          pt_consec.push(pts[i].pt);
        }
      }
    }
    for(var i=0; i<pts.length; i++){
      pt_keys[pts[i].pt][0]++;
      pt_keys[pts[i].pt][1].push(i);
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

    //Relevant to v.1.5.
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
    }
    
    //Generates list of intersections
    for(var i=0; i<pt_count.length; i++){
      if(ends.indexOf(pt_count[i][0])!==-1){
        new_intersection(pt_count[i]);
      }
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
      iinfo[ilist.indexOf(series[i][1])].connections.push({reversed:false, point:series[i+1][1], index:ilist.indexOf(series[i+1][1]), path:pts.slice(series[i][0],series[i+1][0]+1)});
      iinfo[ilist.indexOf(series[i+1][1])].connections.push({reversed:true, point:series[i][1], index:ilist.indexOf(series[i][1]), path:pts.slice(series[i][0],series[i+1][0]+1).reverse()});
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
          var energy_to = 0;
          var speed = 0;
          var dist = 0;
          var speed_dist = 0;

          if(paths[j].reversed===false){

            paths[j].path.slice(0,paths[j].path.length-2).map(function(a){
energy_to += a.next.force * a.next.dist; 
dist += a.next.dist; 
try{
  speed += a.road_data.speed * a.next.dist; speed_dist += a.next.dist
}catch(err){
  speed += 35*METERPS * a.next.dist; speed_dist += a.next.dist
}/*in case road_data is undefined*/});

          }else{

            paths[j].path.slice(1,paths[j].path.length-1).map(function(a){
energy_to += a.last.force * a.last.dist;
dist += a.last.dist;
try{
  speed += a.road_data.speed * a.last.dist; speed_dist += a.last.dist
}catch(err){
  speed += 35*METERPS * a.last.dist; speed_dist += a.last.dist
}});
//energy to move along section of road in Joules (n*m)
          }

          intersections.info[i].connections[j].energy_to = energy_to;
          intersections.info[i].connections[j].speed = speed/dist;
          intersections.info[i].connections[j].distance_to = dist;
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
            branches.push({indexes:lastIndexes.concat(index,target), cost:GetCost(lastIndexes.concat(index,target))});
          }
          break;
        }else if(lastIndexes.indexOf(possible[B])===-1){ //is not in current path
          Branch(possible[B],lastIndexes.concat(possible[B]),start,target);
        }
      }
    }

    function GetCost(path){
      var total = 0;
      for(var Pi=0; Pi<path.length-1; Pi++){
        var conind = intersections.info[path[Pi]].connections.map(function(a){return a.index});
        if(conind.indexOf(path[Pi+1])!==-1){
          total += intersections.info[path[Pi]].connections[conind.indexOf(path[Pi+1])].energy_to;
        }
      }
      return total;
    }

    branches.GetCost = function(){
      for(var i=0; i<this.length; i++){
        var total = 0;
        for(var Pi=0; Pi<this[i].indexes.length-1; Pi++){
          var conind = intersections.info[this[i].indexes[Pi]].connections.map(function(a){return a.index});
          if(conind.indexOf(this[i].indexes[Pi+1])!==-1){
            total += intersections.info[this[i].indexes[Pi]].connections[conind.indexOf(this[i].indexes[Pi+1])].energy_to;
          }
        }
        this[i].cost = total;
      }
    }

    branches.Filter = function(start){
      for(var Pi=0; Pi<this.length; Pi++){
        if(this[i].indexes[0] !== start){
          this[i] = null;
        }
      }
      while(this.indexOf(null)!==-1){
        this.splice(this.indexOf(null),1);
      }
    }

    var end_index; var start_index;
    add_signals();
    add_speeds();
    intersection_gen();
    intersection_build();
    console.log(start_index,end_index);
    Branch(start_index,[start_index],start_index,end_index);
    var costs = branches.map(function(a){return a.cost});
    optimal = branches[costs.indexOf(MIN(costs))], costs.indexOf(MIN(costs));
    optimal.path = [];
    for(var i=0; i<optimal.indexes.length-1; i++){
      conind = intersections.info[optimal.indexes[i]].connections.map(function(a){return a.index});
      if(conind.indexOf(optimal.indexes[i+1])!==-1){
        var path = intersections.info[optimal.indexes[i]].connections[conind.indexOf(optimal.indexes[i+1])].path;
        optimal.path = optimal.path.concat(path);
      }
    }

    for(var i=0; i<optimal.path.length-1; i++){
      if(optimal.path[i].pt.lat()===optimal.path[i+1].pt.lat() && optimal.path[i].pt.lng()===optimal.path[i+1].pt.lng()){ //check for duplicate consecutive points, remove the first occurance
        optimal.path[i] = null;
      }
    }
    while(optimal.path.indexOf(null)!==-1){
      optimal.path.splice(optimal.path.indexOf(null),1);
    }

    optimal.instructions = [];
    optimal.instructions.markers = [];
    var first = "Go to "+optimal.path[0].road_name.real+" and head ";
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
    first += "."
    optimal.instructions.push(first);
    for(var i=1; i<optimal.path.length-1; i++){
      if(optimal.path[i-1].road_name.real!==optimal.path[i].road_name.real){
        var text = "";
        var pt1 = optimal.path[i-1].pt;
        var pt2 = optimal.path[i].pt;
        var pt3 = optimal.path[i+1].pt;
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
        console.log(angle1,angle2,change);
        if(Math.abs(change)<225 && Math.abs(change)>135){
          text += "Continue straight ";
        }else if((change>0 && change<135) || (change>-360 && change<-225)){
          text += "Turn left ";
        }else{
          text += "Turn right ";
        }
        text += "onto ";
        text += optimal.path[i].road_name.real;
        text += ".";
        optimal.instructions.push(text);
        optimal.instructions.markers.push(new google.maps.Marker({position:pt2, map:map, icon:"http://maps.google.com/mapfiles/ms/icons/blue.png", title:text}));
      }
    }

    optimal.route_line = new google.maps.Polyline({
path:optimal.path.map(function(a){return a.pt}), 
geodesic:true, 
strokeColor:"#00ff00", 
strokeOpacity:1.0, 
strokeWeight:5});
    optimal.route_line.setMap(map);
    console.log(optimal);
  }

  for(var i=0; i<dir_requests.length; i++){
    getDirs(i);
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
  var start = document.getElementById('start_input').value;
  var end = document.getElementById('end_input').value;

  geocoder.geocode({address:start},function(results_start,status_start){
    if(status_start===google.maps.GeocoderStatus.OK){
      var start_coords = results_start[0].geometry.location;
      geocoder.geocode({address:end},function(results_end,status_end){
        if(status_end===google.maps.GeocoderStatus.OK){
          var end_coords = results_end[0].geometry.location;
          console.log(start_coords,end_coords);
          var start_marker = new google.maps.Marker({position:start_coords, map:map, icon:'http://maps.google.com/mapfiles/ms/icons/red.png', title:start});
          var end_marker = new google.maps.Marker({position:end_coords, map:map, icon:'http://maps.google.com/mapfiles/ms/icons/green.png', title:end});
          Network(start_coords,end_coords);
        }
      });
    }
  });
}

google.maps.event.addDomListener(window,'load',Initialize);