        if(optimal.path[i].stop === "light"){
          icon = "__stoplight__.png";
          console.log(i,"stoplight");
        }else if(optimal.path[i].stop === "sign"){
          if(optimal.path[i-1].road_data.speed < optimal.path[i+1].road_data.speed){ //moving onto faster road
            icon = "__stopsign__.png";
            console.log(i,"stopsign");
          }else if(optimal.path[i-1].road_data.speed <= 45*METERPS && optimal.path[i+1].road_data.speed <= 45*METERPS){
            icon = "__stopsign__.png";
            console.log(i,"stopsign");
          }else{
            icon = "http://maps.google.com/mapfiles/ms/icons/blue.png";
            console.log(i,"none");
          }
        }else{
          icon = "http://maps.google.com/mapfiles/ms/icons/blue.png";
          console.log(i,"none");
        }
        optimal.instructions.markers.push(new google.maps.Marker({position:pt2, map:map, icon:icon, title:text}));
      }
    }