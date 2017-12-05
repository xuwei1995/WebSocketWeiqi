$(document).ready(function () {

});
var webSocket=null; //
var loading=null;  //阻塞等待框
var isDeviceSuccess=false;//是否成功连接设备

var player=null;
var historyNum=0;//历史棋局总数
var GameStatus=5; //棋盘模式 0 1 2 3 4
var exceptionTip=null;//异常错误提示
var firstConn=true;
var clickEndGame=false;
var getFinishGame=0;
var FinishGameMap=new Object()//所有已结束棋盘的信息
var getFinishGameArray= []//一盘棋的所有坐标

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
 * 断开websocket
 *@Author xw
 *@Date 2017/12/1 11:47
 */
function closeWebSocket() {
    if(webSocket!=null)
    {
        webSocket.close();
        webSocket=null;
        $("#clientStatusIcon").attr('src',"../img/offline.png")
       // $("#connectDevice").attr("disabled",false)
    }else {
        layer.alert("您已经断开了WebSocket连接,无需断开")
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
        msg=JSON.stringify(msg)
        console.log("发送"+msg);
        var date=getNowFormatDate()
        $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;color: #" + "333333" + "; font-size: " + 12 + ";'>" + "发送"+date+":"+"</br>"+ msg + "</div>");
        $('#logDiv').scrollTop( $('#logDiv')[0].scrollHeight );
        webSocket.send(msg);
    }

}
/**
 * 查询所有已结束的棋局
 *@Author xw
 *@Date 2017/12/1 13:50
 */
function getAllGamesFinish() {
    loading  = layer.load(1, {shade: [0.1,'#fff']});
    sendMsgToServer({command:"HISTORY_LIST"});
}
/**
 * 统一发送指令共通
 *@Author xw
 *@Date 2017/11/24 16:14
 */
function sendMsgToServer(msg) {
    msg = JSON.stringify(msg);
    console.log("发送到服务器文本:\t" + msg);
    var date=getNowFormatDate();
    $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;color: #" + "333333" + "; font-size: " + 12 + ";'>" + "发送"+date+":"+"</br>"+ msg + "</div>");
    $('#logDiv').scrollTop( $('#logDiv')[0].scrollHeight );

    if (status()) {
        //向服务端发送消息
        webSocket.send(msg);
    }
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
/**
 * 获取当前模式
 *@Author xw
 *@Date 2017/11/27 14:42
 */
function getModal() {
    var getModal={command:"GET_MODAL"};
    sendMsgToServer(getModal);
}

function listen(){
//打开连接时触发
    webSocket.onopen = function(event) {
        layer.close(loading)
        console.log("open")
        layer.msg("连接WebSocket成功")
        var date=getNowFormatDate();
        $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;color: #" + "4876FF" + ";font-size: " + 12 + ";'>"+"服务器"+date+":"+"</br>"+ "连接WebSocket成功"+ "</div>");
        $('#logDiv').scrollTop( $('#logDiv')[0].scrollHeight );
        $("#clientStatusIcon").attr('src',"../img/online.png")
    };
    //收到消息时触发
    webSocket.onmessage = function(event) {
        var data=JSON.parse(event.data);
        console.log("服务器推送:\t"+event.data);
        var date=getNowFormatDate();
        $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;color:#4876FF; font-size:"+12+";'>" + "服务器"+date+":"+"</br>"+event.data +"</div>")
        $('#logDiv').scrollTop( $('#logDiv')[0].scrollHeight );
        if(data.hasOwnProperty("code"))
        {
            var tipMsg=data.codeMessage;
            switch (data.code) {
                case 3000:
                    isDeviceSuccess = true;//设备连接成功查看一下历史棋局总数
                    $("#deviceStatus").text("已连接");
                    $("#connectDevice").attr("disabled",true);
                    layer.msg("成功连接棋盘");
                    setTimeout('getModal()',1000);   //首次连接接盘查看当前模式
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
                        info.color=info.color==2?-1:1;
                        info.x=info.x-1
                        info.y=info.y-1
                        getFinishGameArray.push(info)
                    });
                    break;
                case 3007:
                    historyNum=data.codeMessage; //历史棋局局数
                    if(historyNum>0)
                    {
                        var title='是否获取所有已结束的'+historyNum+'盘棋局?'
                        //询问框
                        layer.confirm(title, {
                            btn: ['是','否'] //按钮
                        }, function(){
                            FinishGameMap=new Object;
                            getFinishGameArray=[];
                            sendMsgToServer({command:"GET_HISTORY_GAME",index:1})
                            layer.closeAll()
                            loading=layer.load(1, {shade: [0.1,'#fff']});
                        }, function(){
                            layer.closeAll()
                        });
                    }else {
                        layer.closeAll()
                        layer.alert("没有已经结束的历史对局")

                    }

                    break;
                case 3009:
                    layer.closeAll()//结束所有layer
                    GameStatus=data.codeMessage;
                    var tip="";
                    switch (GameStatus)
                    {
                        case "0":
                            tip="modal=0";
                            layer.msg("当前模式为:  "+tip);
                            break
                        case "1":
                            tip="modal=1";
                            layer.alert("提示:此模式不适用于场景一");
                            break
                        case "2":
                            tip="modal=2";
                            layer.alert("提示:此模式不适用于场景一");
                            break
                        case "3":
                            tip="modal=3";
                            layer.alert("提示:此模式不适用于场景一");
                            break
                        case "4":
                            tip="modal=4"
                            layer.alert("提示:此模式不适用于场景一");
                            break
                    }
               //     layer.msg("当前模式为:  "+tip);
                    $("#ModalName").text(tip)
                    break;
                case 3011:
                    getFinishGame++;
                    if(getFinishGame==historyNum)//最后一局已经结束的棋盘保存成功
                    {
                        FinishGameMap["totalGames"]=historyNum//记录获得棋局的总数
                        FinishGameMap["GameHistory"+getFinishGame]=getFinishGameArray;//最后一盘棋局保存
                        FinishGameMap=objKeySort(FinishGameMap)
                        //对象排序 让totalGames置于末尾
                        var historyMap= JSON.stringify(FinishGameMap)//对象转为json字符串
                        console.log(historyMap);
                        FinishGameMap=new Object();
                        layer.closeAll()//完成所有对局获取阻塞去掉
                        layer.alert("所有已结束对局已获取")
                        $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;color: #" + "4876FF" + ";font-size: " + 12 + ";'>"+"提示"+date+":"+"</br>"+ "所有历史棋局如下"+ historyMap+"</div>");
                        historyNum=0
                        getFinishGame=0;
                        ;
                       //保存到数据库 删除设备上的记录
                       /* var CLEAR_HISTORY={command:"CLEAR_HISTORY"};
                        sendMsgToServer(CLEAR_HISTORY);*/
                        break
                      //所有已经结束的历史棋局复制完成
                    }else if(getFinishGame<historyNum) {

                        FinishGameMap["GameHistory"+getFinishGame]=getFinishGameArray;
                        sendMsgToServer({command:"GET_HISTORY_GAME",index:getFinishGame+1})//还有没有获取的棋局
                    }
                    getFinishGameArray=[]//已经写入map的棋局格式化

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
                    layer.closeAll()
                    layer.alert(exceptionTip)
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

      var date=getNowFormatDate();
        $("#logDiv").append("<div style='display: flex;align-items: center;flex-flow: wrap;background-color: #333333;color: #" + "4876FF" + "; font-size: " + 12 + ";'>"+date+":"+"</br>"+"websocket断开" +"</div>")
        $('#logDiv').scrollTop( $('#logDiv')[0].scrollHeight );
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

        if(exceptionTip==null)
        {
            layer.alert("您已经和服务器断开连接")
        }
        else
        {
            layer.alert(exceptionTip)
            exceptionTip=null
        }
        $("#clientStatusIcon").attr('src',"../img/offline.png")

    }
    //连接错误时触发
    webSocket.onerror = function(event) {
        isDeviceSuccess=false;
        $("#connectDevice").attr("disable",false);
        layer.closeAll()
        console.log("服务器连接错误")
        exceptionTip="连接服务器错误，请确定服务器开启或检查输入地址"
        webSocket=null;
    }
}