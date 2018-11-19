var reloadActivity = function(){
    msgCA = max.literals('ca')['new_comment_text'];
    msgES = max.literals('es')['new_comment_text'];
    msgEN = max.literals('en')['new_comment_text'];
    msgCommentBox = [msgCA, msgES, msgEN]
    setInterval(function(){
      var notWrite = true;
      $(".maxui-newcommentbox textarea").each(function(){
        if($(this).val() != "" && !msgCommentBox.includes($(this).val())){
          notWrite = false;
        }
      });
      if(notWrite){
        $("#maxui-news-activities .maxui-button").trigger("click");
      }
    }, 180000);
};

$('#menusup > nav > div:first-of-type').click(reloadActivity);

$(document).ready(function(){
    setTimeout(function(){
        if($('#menusup > nav > div:first-of-type').hasClass('active')){
            reloadActivity();
        }
    }, 500);
});
