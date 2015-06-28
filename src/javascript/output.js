$(function(){
  //set check event listeners to checkboxes
  $('input:checkbox').change(function(){
    if($(this).is(':checked')){
      $("#"+this.value+" #steps").show();
    }else{
      $("#"+this.value+" #steps").hide();
    }
  });
});