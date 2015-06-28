function elevation(){

    function MakeRequest(url,delay,range){
      var query_timeout = setTimeout(function(){
        var request = new XMLHttpRequest();
        request.onload = function(){
          var data = this.responseXML.children[0].getElementsByTagName("result");
          for(var i=0; i<data.length; i++){
            pts[i+range.min].elevation = parseFloat(data[i].getElementsByTagName("elevation")[0].value);
          }
          completion_counter++;
        }
        request.open("GET",url,true);
        request.send();
        elev_requests.push(request);
      },delay);
    }

    //Elevation
    var elev_requests = [];
    var completion_counter = 0;
    var expected_requests = 0;
    for(var i=0; i<Math.ceil(pts.length/100)*100; i+=100){
      var length = Math.min(100,pts.length-i);
      var url = "https://maps.googleapis.com/maps/api/elevation/xml?locations=";
      for(var j=0; j<length; j++){
        url += parseInt(pts[i+j].pt.lat()*100000)/100000 + "," + parseInt(pts[i+j].pt.lng()*100000)/100000 + ((j!==length-1)?"|":"");
      }
      url += "&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE";
      expected_requests++;
      MakeRequest(url,i*2,{min:i, max:i+length});
      console.log(url);
    }
    var completion_check = setInterval(function(){
      if(completion_counter === expected_requests){
        clearInterval(completion_check);
        SetData();
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

      data_complete++;
    }
  }