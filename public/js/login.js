if(userName){
//alert(userName);
    $(".page-header").html("<h1>"+userName+"'s 网络硬盘</h1>");
   	$("#login").hide();
    $("#logout").show();
}
else{
	$(".page-header").html("<h1>网络硬盘</h1>");
    $("#login").show();
	$("#logout").hide();
	easyDialog.open({
      container:'login-content',
      fixed:true,
      lock:true
    });
    if(err)$("#flash-block").append("登录失败");
}

