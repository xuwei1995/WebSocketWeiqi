var webSocket=null;
var loading=null;
var errorCode=null;
$(document).ready(function(){

    window.onresize=function(){
        $("#main").width($(window).width()-35)
        $("#main").height($(window).height()-50)
    }
    $("#main").height($(window).height()-50)
    /*$(".wgo-board").*/
    /**
     * 连接WebSocket操作
     *@Author xw
     *@Date 2017/11/20 16:54
     */
	$("#clientWebSocketBtn").on('click',function(){
		var serverAddress=$("#serverAddress").val();

		if(serverAddress==null||serverAddress=="")
		{
			layer.alert('请输入服务器地址')
		}
		else{

            loading  = layer.load(1, {shade: [0.1,'#fff']});  //0.1透明度的白色背景
            try {
                webSocket = new WebSocket("ws://"+serverAddress);
            } catch(error) {
               layer.alert("连接服务器错误，请检查输入地址")
            } finally {

            }

            listen();

        }
	});
	/**
     * 断开WebSocket连接
	 *@Author xw
	 *@Date 2017/11/20 16:59
	 */
	$('#closeWebSocketBtn').on('click',function () {
        if(webSocket!=null)
        {
            webSocket.close();
            webSocket=null;
        }else {
            layer.alert("您已经断开了WebSocket连接,无需断开")
        }
    });
	/**
     * 输入框的回车事件
	 *@Author xw
	 *@Date 2017/11/20 17:27
	 */
	$('#sendMsg').keydown(function (e) {
	    if(e.keyCode==13)
        {

            sendEmit()
        }
    });
    /**
     * 监听输入框的值改变
     *@Author xw
     *@Date 2017/11/21 11:49
     */
    $('#sendMsg').bind('input propertychange', function() {
        if($("#sendMsg").val()!=null&&$("#sendMsg").val()!="")
        {
            $("#sendBtn").css("background-color","#289cff")

        }else
        {
            $("#sendBtn").css("background-color","#dddddd")
        }
    });

});
/**
 * 连接棋盘
 *@Author xw
 *@Date 2017/11/21 16:28
 */
function connectDevice() {
 var msg={device:"a5f1090cb0a04756cb21807151544d4db40d0a",command:"CONNECT_DEVICE"}
 if($("#deviceNo")!=null)
 {
     var msg={device:$("#deviceNo").val(),command:"CONNECT_DEVICE"}
 }
    sendMsgToServer(msg)
}
/**
 * 对局开始
 *@Author xw
 *@Date 2017/11/21 16:07
 */
function startGame() {
    var msg={command:"START_GAME"};
    sendMsgToServer(msg);
}
/**
 * 对局结束
 *@Author xw
 *@Date 2017/11/21 16:17
 */
function  endGame() {
    var msg={command:"END_GAME"};
    sendMsgToServer(msg);
}
/**
 *@Author xw
 *@Date 2017/11/21 16:24
 */
function downChress(){
    var x=$("#x").val();
    var y=$("#y").val();
    var c=$("#c").val();
    if(x.length!=2||y.length!=2||c.length!=2)
    {
        layer.alert("请输入正确的落子点")
    }
    setChessBoard(x,y,c)
}
/**
 * 棋盘落子
 *@Author xw
 *@Date 2017/11/21 16:13
 *@param x x坐标, y y坐标， c 黑白子
 */
function setChessBoard(x,y,c) {
    var msg={command:"CHESS_BOARD",x:x,y:y,c:c}
    sendMsgToServer(msg);

}
function sendMsgToServer(msg) {
    msg=JSON.stringify(msg);
    console.log("发送到服务器文本:\t"+msg);
    //向服务端发送消息
    webSocket.send(msg);
}
function listen(){
	 //打开连接时触发
    webSocket.onopen = function(event) {
        layer.close(loading)
    	console.log("open")
    	layer.msg("连接WebSocket成功")
     };
    //收到消息时触发
    webSocket.onmessage = function(event) {

        console.log("服务器接受的文本:\t"+event.data)
        var data=JSON.parse(event.data);
        if(data.hasOwnProperty("code"))
        {
            if(data.code==200)
            {
                layer.msg(data.codeMessage)
            }else {
                layer.msg(data.codeMessage+"请重试")
            }
        }else if(data.hasOwnProperty("info")){
            layer.msg(data.info.codeMessage)
        }
        $("#content").append(event.data);
    };
    //关闭连接时触发
    webSocket.onclose = function(event) {
        console.log("服务器已关闭")
        webSocket=null;
        if(loading!=null){
            layer.close(loading)
        }
        if(errorCode==1)
        {
            return
        }
        layer.alert("您已经和服务器断开连接")
    }
    //连接错误时触发
    webSocket.onerror = function(event) {
        layer.close(loading)
        console.log("服务器连接错误")
    	layer.alert("连接服务器错误，请检查输入地址")
        errorCode=1//1代表输入错误的URL
        webSocket=null;
     //   $("#content").append("<kbd>" + "ERROR!" + "</kbd></br>");
    }
}
function sendEmit() {

    var sendMsg= $("#sendMsg").val()
    if(sendMsg==null||sendMsg=="")
    {
        layer.alert("发送内容不能为空");

            return;
    }
    if(webSocket==null)
    {
        layer.alert("请先连接WebSocket")
        return;
    }
    //encodeScript方法用来转义<>标签，防止脚本输入
    var text = encodeScript(sendMsg);
    var msg = {
        "device" : text,
        "command" : "CONNECT_DEVICE",
       /* "bubbleColor" : "#2E2E2E",
        "fontSize" : "12",
        "fontType" : "黑体"*/
    };
    console.log("发送文本:\t"+msg)
    msg = JSON.stringify(msg);
    //向服务端发送消息
    webSocket.send(msg);
    //将自己发送的消息内容静态加载到html上，服务端实现自己发送的消息不会推送给自己
    $("#content").append("<kbd style='color: #" + "CECECE" + ";float: right; font-size: " + 12 + ";'>" + text +  "</kbd><br/>");


}
function encodeScript(data) {
    if(null == data || "" == data) {
        return "";
    }
    return data.replace("<", "&lt;").replace(">", "&gt;");
}
/*
function click(e) {
    if (document.all) {
        if (event.button==2||event.button==3) { alert("欢迎光临寒舍，有什么需要帮忙的话，请与站长联系！谢谢您的合作！！！");
            oncontextmenu='return false';
        }
    }
    if (document.layers) {
        if (e.which == 3) {
            oncontextmenu='return false';
        }
    }
}
if (document.layers) {
    document.captureEvents(Event.MOUSEDOWN);
}
document.onmousedown=click;
document.oncontextmenu = new Function("return false;")
document.onkeydown =document.onkeyup = document.onkeypress=function(){
    if(window.event.keyCode == 123) {
        window.event.returnValue=false;
        return(false);
    }
}*/
