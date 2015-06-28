function overcheck(a,b){
  var over_keys = Object.keys(over);
  var s = {}; 
  for(var i=0; i<over_keys.length; i++){
    console.log("CHECK");
    var value_a_key = over[over_keys[i]][a];
    var value_b_key = over[over_keys[i]][b];
    if(!(value_a_key in s)){
      s[value_a_key] = {};
    }
    if(!(value_b_key in s[value_a_key])){
      s[value_a_key][value_b_key] = 0;
    }
    s[value_a_key][value_b_key]++;
  }
  return s;
}