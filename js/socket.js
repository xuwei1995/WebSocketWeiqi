var webSocket=null; //
var loading=null;  //阻塞等待框
var isDeviceSuccess=false;//是否成功连接设备
var errorCode=null; //webSocket返回码
var editable=null;  //WGo.Player.Editable
var player=null;
var lastDownNum=0; //html棋盘的最后落子步数
var historyNum=0;//历史棋局总数
var GameStatus=5; //棋盘模式 0开机过程  1对弈离线 2 对弈有线 3 复盘离线 4复盘有线
var exceptionTip=null;
var firstConn=true;
var clickEndGame=false;

var gameIndex=0;
$(document).ready(function(){

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
            $("#clientStatusIcon").attr('src',"img/offline.png")
            $("#connectDevice").attr("disabled",false)
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
 * 连接WebSocket操作
 *@Author xw
 *@Date 2017/11/20 16:54
 */
function  connentServer() {
    var serverAddress=$("#serverAddress").val();
    if (!navigator.onLine)
    {
        layer.alert("您断网了")
        return
    }

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
        listen(); //实现webstock回调控制
    }
}
/**
 * 连接棋盘
 *@Author xw
 *@Date 2017/11/21 16:28
 */
function connectDevice() {
    if (webSocket == null) {
        layer.alert("请先连接webSocket")

    }else {
        loading  = layer.load(1, {shade: [0.1,'#fff']});
        var msg = {device: "b0a04756cb21807151544d4d", command: "CONNECT_DEVICE"};
        console.log("发送"+JSON.stringify(msg))
        webSocket.send(JSON.stringify(msg))

    }

}
/**
 * 对局开始
 *@Author xw
 *@Date 2017/11/21 16:07
 */
function startGame() {

      if(status())
    {
        sendMsgToServer({command:"START_GAME"});
        /* sendMsgToServer({command:"HISTORY_LIST"});
         getModal();*/
        loading  = layer.load(1, {shade: [0.1,'#fff']});
    }
}
/**
 * 对局结束
 *@Author xw
 *@Date 2017/11/21 16:17
 */
function  endGame() {
    if(GameStatus==1||GameStatus==2)
    {
        if(status())
        {
            $("#deleteBranch").click()
            var msg={command:"END_GAME"};
            sendMsgToServer(msg);
            loading  = layer.load(1, {shade: [0.1,'#fff']});  //0.1透明度的白色背景
        }
    }else {
        layer.alert("当前模式没有对局,无法结束")
    }
}
/**
 * 落子亮灯
 *@Author xw
 *@Date 2017/11/21 16:24
 */
function downChress(){
    if(status())
    {
        var x=$("#x").val();
        var y=$("#y").val();
        var c=$("#c").val();
        if(x.length!=2||y.length!=2||c.length!=2)
        {
            layer.alert("请输入正确的落子点")
            return
        }
        setChessBoard(x,y,c)
    }
}
/**
 * html落子通知服务器让物理棋盘亮灯
 *@Author xw
 *@Date 2017/11/21 16:13
 *@param x x坐标, y y坐标， c 黑白子
 */
function setChessBoard(x,y,c) {
    if(status())
    {
        var msg={command:"CHESS_BOARD",x:x,y:y,c:c}
        sendMsgToServer(msg);
    }
}
/**
 * 查看历史棋局
 *@function queryHistoryGame
 *@Author xw
 *@Date 2017/11/24 14:32
 */
function queryHistoryGame()
{
  /*  if(GameStatus!=0)
    {
        layer.alert("当前模式不能查看历史")
    }else{


    }*/
    if(status())
    {
        var text={command:"HISTORY_LIST"};
        //向服务端发送消息
        sendMsgToServer(text);
    }
    ReproduceGame();
}
/**
 * 复盘
 *@Author xw
 *@Date 2017/11/28 16:10
 */
function RepetitionGame() {
  /*  if(GameStatus==1||GameStatus==2)
    {
        layer.alert("当前为对弈模式不能复盘")
        return
    }else{
      sendMsgToServer({})
    }*/
  //
}
/**
 * 接受物理棋盘给棋盘落子（服务器发送）
 *@Author xw
 *@Date 2017/11/22 15:56
 *@Param x x坐标,y y坐标,c 黑白子
 */
function  receiveChessBoard(x,y,c) {
    editable.play(x,y,c);//棋盘落子
}
/**
 * 重现指定棋局
 *@Author xw
 *@Date 2017/11/24 16:15
 */
function ReproduceGame() {
    if(!status())
    {
        return
    }
  /*  if(GameStatus==1)
    {
        layer.alert("当前为对弈模式不能复盘或查看历史")
        return
    }*/

    if(historyNum==0)
    {
        layer.alert("没有找到历史棋局")
    }else if(historyNum>0)
    {
        layer.open({
            title:"请选择棋局",
            type: 1,
            area: ['180px', '150px'],
            shadeClose: false,
            content:
            "<div style='width:100px; margin: 0 auto;'>" +
            "<div style='width:100px;margin-top: 15px' class='form-group has-feedback'>" +
            "<select id='index' class='form-control' type='text' name=''></select></div>" +
            "<button style='margin-top:100px; margin: 0 auto;' type='button' class='btn btn-block btn-success' onclick='ReproduceGameOne()'>" +
            "提交</button>" +
            "</div>"
        });
        var select=$("#index");
        for(var i=1;i<=historyNum;i++){
            select.append("<option value='"+i+"'>"+i+"</option>")
        }
    }
}
/**
 * 复盘指定棋局
 *@Author xw
 *@Date 2017/11/27 10:31
 */
function ReproduceGameOne() {
    layer.closeAll()
    loading  = layer.load(1, {shade: [0.1,'#fff']});  //0.1透明度的白色背景

    $("#deleteBranch").click();
     gameIndex= $("#index").val();
    if(gameIndex!=null&&gameIndex!="")
    {
        var msg={command:"GET_HISTORY_GAME",index:gameIndex};
        sendMsgToServer(msg)
    }else {
        layer.alert("请输入指定局")
        }

    }
    /**
     * 删除最后一盘棋局
     *@Author xw
     *@Date 2017/11/27 14:38
     */
function deleteLastGame() {
        //询问框
        layer.confirm('您确定要删除最后一盘棋局?', {
            btn: ['是','否'] //按钮
        }, function(){
            var  DELETE_LAST_GAME={command:"DELETE_LAST_GAME"};
            sendMsgToServer(DELETE_LAST_GAME)
        }, function(){

        });

    }
/**
 * 删除历史棋局
 *@Author xw
 *@Date 2017/11/27 14:41
 */
function clearHistory() {
    //询问框
    layer.confirm('您确定要清空历史棋盘?', {
        btn: ['是','否'] //按钮
    }, function(){
        var CLEAR_HISTORY={command:"CLEAR_HISTORY"};
        sendMsgToServer(CLEAR_HISTORY);
    }, function(){

    });

}
/**
 * 获取当前模式
 *@Author xw
 *@Date 2017/11/27 14:42
 */
function getModal() {
    var getModal={command:"GET_MODAL"};
    sendMsgToServer(getModal);
}
/**
 * 更改模式
 *@Author xw
 *@Date 2017/11/27 14:43
 */
function modalChange(mode) {
    var modalChange={command:"MODAL_CHANGE",modal:mode};
    sendMsgToServer(modalChange);
}
/**
 * 统一发送指令共通
 *@Author xw
 *@Date 2017/11/24 16:14
 */
function sendMsgToServer(msg) {
    if(status())
    {
        msg=JSON.stringify(msg);
        console.log("发送到服务器文本:\t"+msg);
        //向服务端发送消息
        webSocket.send(msg);
    }
}
//输入文本推送到服务端
function sendEmit() {
       var sendMsg= $("#sendMsg").val()
       if(sendMsg==null||sendMsg=="")
       {
        layer.alert("发送内容不能为空");
           return;
       }
      if(status())
      {
          //encodeScript方法用来转义<>标签，防止脚本输入
          var text = encodeScript(sendMsg);
          //向服务端发送消息
          sendMsgToServer(text);
      }
    }
////encodeScript方法用来转义<>标签，防止脚本输入
function encodeScript(data) {
    if(null == data || "" == data) {
        return "";
    }
    return data.replace("<", "&lt;").replace(">", "&gt;");
    }
/**
* 检查websocket是否在线且棋盘是否连接
*@Author xw
*@Date 2017/11/24 16:17
*/
function status() {
        if (webSocket == null) {
            layer.alert("请先连接webSocket");
            return false;
        }
        if(!isDeviceSuccess)
        {
            layer.alert("请先连接设备");
            return false;
        }
        return true;
    }
//webstock控制
function listen(){
//打开连接时触发
    webSocket.onopen = function(event) {
        layer.close(loading)
        console.log("open")
        layer.msg("连接WebSocket成功")
        $("#clientStatusIcon").attr('src',"img/online.png")
    };
    //收到消息时触发
    webSocket.onmessage = function(event) {
        var data=JSON.parse(event.data);
        console.log("服务器推送:\t"+event.data);
        $("#content").append("<kbd>" + "ERROR!" + "</kbd></br>")
        if(data.hasOwnProperty("code"))
        {

            var tipMsg=data.codeMessage;
            switch (data.code) {
                case 3000:
                    isDeviceSuccess = true;//设备连接成功查看一下历史棋局总数
                    $("#deviceStatus").text("已连接");
                    $("#connectDevice").attr("disabled",true);
                    layer.msg("成功连接棋盘");
                    setTimeout('sendMsgToServer({command:"HISTORY_LIST"})',1000);//历史棋局数 code3007
                    break;
                case 3001:  //对局开始
                    $("#deleteBranch").click();//清空html棋盘
                      setTimeout('getModal()',1500);//查看棋盘模式 对局开始成功和结束成功会有棋盘模式改变  code3009
                    break;
                case 3003://接收落子
                    if(data.hasOwnProperty("jsonObject")&&data.jsonObject!=null)
                    {
                        if(data.jsonObject.hasOwnProperty("x")&&data.jsonObject.hasOwnProperty("y")&&data.jsonObject.hasOwnProperty("c"))
                        {
                            var c=data.jsonObject.c==2?-1:1;
                            receiveChessBoard(data.jsonObject.x-1,data.jsonObject.y-1,c);
                        //    callBackClickChressBoard(data.jsonObject.x-1,data.jsonObject.y-1)
                            layer.msg("棋盘落子回传成功")
                        }
                    }
                    break;
                case 3004:  //对局结束
                     layer.msg("对局结束成功")
                    setTimeout('sendMsgToServer({command:"HISTORY_LIST"})',1500);   //向服务端发送消息
                    clickEndGame=true

                    break;
                case 3006://落子数据由服务端分批次发送 循环落子
                    $.each(data.jsonObject, function (i, info)
                    {
                         var c=info.color==2?-1:1;
                        receiveChessBoard(info.x-1,info.y-1,c);
                    });
                    break;
                case 3007:
                    historyNum=data.codeMessage; //历史棋局局数
                    var select=$("#index");
                    select.empty()
                    for(var i=1;i<=historyNum;i++){
                        select.append("<option value='"+i+"'>"+i+"</option>")
                    }
                    if(firstConn) //首次连接接盘查看当前模式
                    {
                        setTimeout('getModal()',1000);
                        firstConn=false;
                    }
                    if(clickEndGame)
                    {
                        clickEndGame=false;
                        setTimeout('getModal()',1000);   //查看当前状态
                    }

                    break;
                case 3009:
                    layer.closeAll()//结束所有layer
                    GameStatus=data.codeMessage;
                    var tip="";
                    switch (GameStatus)
                    {
                        case "0":
                            tip="开机过程";
                            break
                        case "1":
                            tip="对弈离线";
                            break
                        case "2":
                            tip="对弈有线";
                            break
                        case "3":
                            tip="复盘离线";
                            break
                        case "4":
                            tip="复盘有线"
                            break
                    }
                    layer.msg("当前模式为:  "+tip);
                    $("#ModalName").text(tip)

                    break;
                case 3011:
                    layer.closeAll();
                    layer.msg("历史棋局复现完成");
                    setTimeout(sendMsgToServer({command:"RECURRENT",index:gameIndex}),1000);
                    break;
                case 3012://棋盘已重新连接
                    layer.msg("棋盘已重连")
                    break;
                case 3014:
                    if(data.codeMessage==1)
                    {
                        //物理对局开始推送
                        $("#deleteBranch").click();//清空html棋盘
                        setTimeout('getModal()',1500);//查看棋盘模式 对局开始成功和结束成功会有棋盘模式改变  code3009

                    }else if(data.codeMessage==2)
                    {
                        //物理对局结束推送
                        layer.msg("对局结束成功")
                        setTimeout('sendMsgToServer({command:"HISTORY_LIST"})',1500);   //向服务端发送消息
                        clickEndGame=true;
                    }
                    break;
                case 3015:
                    layer.msg("棋盘已接收复盘逐个亮灯")
                    break
                case 2000:  //web socket 请求参数异常
                    exceptionTip=tipMsg;
                    break;
                case 2001:  //棋盘不在线或者设备序列号不正确
                    layer.alert(tipMsg);
                    layer.close(loading)
                    isDeviceSuccess=false;
                    $("#connectDevice").attr("disabled",false)
                    break;
                case 2002:  //棋盘互连状态异常
                    layer.alert(tipMsg);
                    isDeviceSuccess=false;
                    $("#connectDevice").attr("disabled",false)
                    break;
                case 2003:   //设备请先与棋盘建立连接
                    layer.alert(tipMsg);
                    isDeviceSuccess=false;
                    $("#connectDevice").attr("disabled",false)
                    break;
                case 2004:
                    exceptionTip=data.codeMessage;
                    $("#connectDevice").attr("disabled",false)
                    break;
                case 2005:
                    $("#deviceStatus").text("未连接");
                    layer.alert(data.codeMessage);
                    $("#connectDevice").attr("disabled",false)
                    $("#ModalName").val("")
                    break
                default:
                    layer.msg("default\r\n"+tipMsg);
                    break;
            }
        }else {
            layer.alert(data)
        }
    };
    //关闭连接时触发
    webSocket.onclose = function(event) {
        //当连接关闭时 一些变量重置
        firstConn=true    //再次断开 重置变量
        GameStatus=5;
        clickEndGame=false//可能存在点击endgame没有回调成功或者websocket断开（断网，棋盘未响应等情况）
        $("#deviceStatus").text("未连接");
        isDeviceSuccess=false;//设备断开
        $("#connectDevice").attr("disabled",false)
        webSocket=null;//websocket重置
        if(loading!=null){
            layer.close(loading)
        }
        if(errorCode==1)//输入错误的url引起的websocket.onclose
        {
            errorCode=0;
            return
        }
        if(exceptionTip==null)
        {
            layer.alert("您已经和服务器断开连接")
        }
        else
        {
            layer.alert(exceptionTip)
            exceptionTip=null
        }
        $("#clientStatusIcon").attr('src',"img/offline.png")
        layer.closeAll()
    }
    //连接错误时触发
    webSocket.onerror = function(event) {
        isDeviceSuccess=false;
        $("#connectDevice").attr("disable",false);
        layer.closeAll()
        console.log("服务器连接错误")
        layer.alert("连接服务器错误，请确定服务器开启或检查输入地址")
        errorCode=1//1代表输入错误的URL
        webSocket=null;
    }
}
/**
 * 点击网页棋盘发送亮灯指令
 *@Author xw
 *@Date 2017/11/23 16:48
 */
function callBackClickChressBoard(x,y) {
    var tem=player.kifuReader.path.m;
    if(tem!=lastDownNum)
    {
        var blackOrWhite=tem%2==0?2:1 //根据最后落子点数判断亮灯色 2是白1是黑
        lastDownNum=tem;

        if(!isDeviceSuccess)
        {
            layer.msg("目前没有连接棋盘设备");
        }/*else if(GameStatus==0||GameStatus==3||GameStatus==4){
            layer.msg("当前不是对弈模式");
        }*/else {
            console.log(tem)
            setChessBoard(x+1,y+1,blackOrWhite);//网页和物理棋盘坐标（0-18）（0-19）
        }
    }
}
