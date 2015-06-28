function toggle(element, button){
  $(element).toggle(500);
  var t = $(button).text();
  if(t==='[hide]'){
    $(button).text('[show]');
    $(button).css('background-color','#0000b0');
  }else{
    $(button).text('[hide]');
    $(button).css('background-color','#b00000');
  }
}

/*function massConvert(to){
  var mass = document.getElementById('mass-input');
  if(to==='kg'){
    mass.value = parseInt(mass.value / 2.20462);
  }else{
    mass.value = parseInt(mass.value * 2.20462);
  }
}

function areaConvert(to){
  var area = document.getElementById('area-input');
  if(to==='m^2'){
    area.value = (area.value / 10.7639).toFixed(2);
  }else{
    area.value = (area.value * 10.7639).toFixed(2);
  }
}

function dispConvert(to){
  var disp = document.getElementById('disp-input');
  if(to==='cm^3'){
    disp.value = parseInt(disp.value * 16.387064);
  }else{
    disp.value = parseInt(disp.value / 16.387064);
  }
}*/

function changeUnit(type, coef, rounding){
  $('#'+type+'-input').val(($('#'+type+'-input').data('actual')*coef).toFixed(rounding));
  $('#'+type+'-input').data('coef',coef);
}

function updateUnit(type){
  $('#'+type+'-input').data('actual',$('#'+type+'-input').val()/$('#'+type+'-input').data('coef'));
}

function makeMetric(){
  $('input[value="cm^3"]').prop('checked', true);
  $('input[value="m^2"]').prop('checked', true);
  $('input[value="kg"]').prop('checked', true);
  changeUnit('mass', 1, 0);
  changeUnit('area', 1, 2);
  changeUnit('disp', 1, 0);
}

function updateSpecs(element){
  makeMetric();
  
  var selected = $(element).children(':selected');
  if($(selected).attr('mass')){
    document.getElementById('mass-input').value = $(selected).attr('mass');
    $("#mass-input").css('background-color','rgb(250, 255, 189)');
    updateUnit('mass');
  }else{
    $("#mass-input").css('background-color','rgb(255, 255, 255)');
  }
  if($(selected).attr('disp')){
    document.getElementById('disp-input').value = $(selected).attr('disp');
    $("#disp-input").css('background-color','rgb(250, 255, 189)');
    updateUnit('disp');
  }else{
    $("#disp-input").css('background-color','rgb(255, 255, 255)');
  }
  document.getElementById('drag-input').value = $(selected).attr('cd');
  document.getElementById('area-input').value = $(selected).attr('area');
  $("#drag-input").css('background-color','rgb(250, 255, 189)');
  $("#area-input").css('background-color','rgb(250, 255, 189)');
  updateUnit('area');
}

$(document).ready(function(){
  $('#area-input').data('actual',parseFloat($('#area-input').val())).data('coef',1).on('change',function(){updateUnit('area')});
  $('#mass-input').data('actual',parseFloat($('#mass-input').val())).data('coef',1).on('change',function(){updateUnit('mass')});
  $('#disp-input').data('actual',parseFloat($('#disp-input').val())).data('coef',1).on('change',function(){updateUnit('disp')});
  $('#main-input').submit(function(){
    updateMap();
    makeMetric();
    alert("Please do not close the popup until the search is complete. \n(You will see red lettering on the top when it is done.)")
  });
});