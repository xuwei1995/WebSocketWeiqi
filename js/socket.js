var webSocket=null;
var loading=null;
$(document).ready(function(){
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
	$('#sendMsg').on('keyDown',function () {
        sendEmit()
    })
})

function listen(){
	 //打开连接时触发
    webSocket.onopen = function(event) {
        layer.close(loading)
    	console.log("open")
    	layer.msg("连接WebSocket成功")
     };
    //收到消息时触发
    webSocket.onmessage = function(event) {
      //  var data = JSON.parse(event.data);
        console.log(event.data)
        $("#content").append(event.data);
    };
    //关闭连接时触发
    webSocket.onclose = function(event) {
        if(loading!=null){
            layer.close(loading)
        }
        layer.alert("您已经和服务器断开连接")
        webSocket=null;
        // $("#content").append("<kbd>" + "Close!" + "</kbd></br>");
    }
    //连接错误时触发
    webSocket.onerror = function(event) {
        layer.close(loading)
    	layer.alert("连接服务器错误，请检查输入地址")
        webSocket=null;
     //   $("#content").append("<kbd>" + "ERROR!" + "</kbd></br>");
    }
}
function sendEmit() {
    if(webSocket==null)
    {
        layer.alert("请先连接WebSocket")
        return;
    }
    var sendMsg= $("#sendMsg").val()
    if(sendMsg==null||sendMsg=="")
    {
        layer.alert("发送内容不能为空");
            return;
    }
    //encodeScript方法用来转义<>标签，防止脚本输入
    var text = encodeScript(sendMsg);
    var msg = {
        "message" : text,
      /*  "color" : "#CECECE",
        "bubbleColor" : "#2E2E2E",
        "fontSize" : "12",
        "fontType" : "黑体"*/
    };
    msg = JSON.stringify(msg);
    //向服务端发送消息
    webSocket.send(msg);
    //将自己发送的消息内容静态加载到html上，服务端实现自己发送的消息不会推送给自己
    $("#content").append("<kbd style='color: #" + "CECECE" + ";float: right; font-size: " + 12 + ";'>" + text +  "</kbd><br/>");
    //将消息文本框清空
    $("#msg").val("");
}
function encodeScript(data) {
    if(null == data || "" == data) {
        return "";
    }
    return data.replace("<", "&lt;").replace(">", "&gt;");
}