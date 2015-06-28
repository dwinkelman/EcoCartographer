function getName(d){ //takes array of result XML tags
  console.log(d);
  var a;
  var s;
  for(var i=0; i<d.length; i++){
    console.log(d[i].getElementsByTagName("type"));
    if(d[i].getElementsByTagName("type")[0].innerHTML === "street_address"){
      a = d[i].getElementsByTagName("address_component");
      console.log(a);
      break;
    }
  }
  for(var i=0; i<a.length; i++){
    if(a[i].getElementsByTagName("type")[0].innerHTML === "route"){
      s = a[i].getElementsByTagName("long_name")[0].innerHTML;
      console.log(s);
      break;
    }
  }
  return s;
}

var geo = new XMLHttpRequest();
geo.open("GET","https://maps.googleapis.com/maps/api/geocode/xml?latlng=36,-80&key=AIzaSyCnHT7IpJu0O7n-apLNW8iKkW_rTIuANuE",true);
geo.send();
geo.onload = function(){console.log(getName(geo.responseXML.children[0].getElementsByTagName("result")))};