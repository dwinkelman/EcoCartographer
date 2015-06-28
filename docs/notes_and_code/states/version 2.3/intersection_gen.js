  function intersection_gen_new(){
    intersections = {info:[], list:[]};
    var ptcount = {};
    for(var i=0; i<pts.length; i++){
      var coord = pts[i].string;
      if(!(coord in ptcount)){
        ptcount[coord] = {frequency:0, indexes:[], coords:pts[i].pt, connections:[]};
      }
      ptcount[coord].frequency++;
      ptcount[coord].indexes.push(i);
    }
    for(var i in ptcount){
      for(var j=0; j<ptcount[i].indexes.length; j++){
        pts[ptcount[i].indexes[j]].frequency = ptcount[i].frequency;
        pts[ptcount[i].indexes[j]].other_indexes = ptcount[i].indexes;
      }
    }
    var intersection_coords = [];
    var counter = 0;
    for(var i=0; i<pts.length; i++){
      try{
        if(pts[i].frequency>pts[i-1].frequency || pts[i].frequency>pts[i+1].frequency){
          if(intersection_coords.indexOf(pts[i].string)===-1){
            intersection_coords.push(pts[i].string);
            var marker = new google.maps.Marker({position:pts[i].pt, map:map, icon:'marker.png', title:counter});
            counter++;
          }
        }
      }catch(err){};
    }
    intersections.info = intersection_coords.map(function(a){return ptcount[a]});
    intersections.list = intersection_coords.map(function(a){return ptcount[a].coords});
  }