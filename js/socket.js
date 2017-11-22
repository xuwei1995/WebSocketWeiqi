var webSocket=null; //
var loading=null;  //阻塞等待框
var errorCode=null; //webSocket返回码
var editable=null;  //WGo.Player.Editable
$(document).ready(function(){
    window.onresize=function(){
        $("#main").width($(window).width()-35);
        $("#main").height($(window).height()-50);
    }
    $("#main").height($(window).height()-50);
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
    //获取棋盘容器
    var element = document.getElementById('board');
    tempBranch = {
        path: 0,
        index: 0,
    };
    //定义一个棋谱
    var sgf = '(;CA[utf-8]SZ[19]AP[MultiGo:4.4.4]MULTIGOGM[1];W[aa];B[ab];W[ac];B[ad];W[ae]C[这是评论](;B[af];W[ag];B[ah];W[ai];B[aj](;W[ak](;B[al](;W[am](;B[an](;W[ao];B[ap];W[aq](;B[ar];W[as])(;B[bq];W[br](;B[bs])(;B[cr]))(;B[cq];W[cr];B[cs]))(;W[bn];B[bo];W[bp]))(;B[bm];W[bn];B[bo]))(;W[bl];B[bm];W[bn]))(;B[bk];W[bl];B[bm]))(;W[bj];B[bk];W[bl]))(;B[be];W[bf];B[bg](;W[bh];B[bi])(;W[cg];B[ch];W[ci])))';
    //实例化棋盘对象
    player = new WGo.BasicPlayer(element, {
        sgf: sgf,
        enableWheel: false,
        enableKeys: false,
        markLastMove: false,
        displayVariations: false,
        selectBranch: false,
        board: {
            background: WGo.DIR + "board.jpg",
        },
        update: function(e) {
            //非分支状态
            if(tempBranch.path == 0) {
                //清空分支列表
                $('#branchs').empty();
                //含有分支
                if(e.node.children.length > 1)
                    for(var i = 1; i < e.node.children.length; i++)
                        //输入分支
                        $('#branchs').append('<li data-index="' + i + '" >分支' + i + '</li>')
            }
        }
    });
    //定义标记默认样式
    defaultConfig = {
        markerStyle: 'LB',
        markerNum: 1, //标记棋子的数量
        start: 0,
        lastMoveColor: 'red',
        branchPath: -1
    }
    marker = new WGo.Player.Marker(player, player.board, defaultConfig);
    player.last();
    editable = new WGo.Player.Editable(player, player.board, playCb.bind(this));
    editable.set(true)
    $('#branchs').on('tap', 'li', function() {
        var branchId = this.getAttribute('data-index');
        if(tempBranch.path > 0) {
            player.goTo(tempBranch.path);
        }
        editable.setPlayType('try');
        player.kifuReader.node._last_selected = parseInt(branchId);
        tempBranch.path = player.kifuReader.path.m;
        tempBranch.index = parseInt(branchId);
        marker.config.branchPath = tempBranch.path;
        player.last();
    })

    function playCb(x, y, type) {
        switch(type) {
            case 'select':
                if(confirm('覆盖？')) {
                    _editable.setPlayType('cover');
                    _editable.play(x, y);
                } else {
                    _editable.setPlayType('insert');
                    _editable.play(x, y);
                }
                break;
            case 'cover':
                _editable.setPlayType('normal');
                break;
        }
    }
    //绑定棋盘功能按钮
    $('#btnList').on('click', 'button', function() {
        var type = this.getAttribute('data-type');
        //定义当前手数
        var curPath = player.kifuReader.path.m;
        switch(type) {
            case 'first':
                player.first(); //第一手
                break;
            case 'previous':
                player.previous(); //回退一手
                break;
            case 'next':
                player.next(); //前进一手
                break;
            case 'last':
                player.last(); //到最新手
            case 'tosgf':
                var sgf = player.kifuReader.kifu.toSgf(); //获取sgf
                break;
            case 'mark': //切换标记
                var markerConfig = defaultConfig;
                if(markerConfig.markerStyle == 'LB' && markerConfig.markerNum == 1) {
                    markerConfig.markerNum = 0;
                } else if(markerConfig.markerStyle == 'LB' && markerConfig.markerNum == 0) {
                    markerConfig.markerNum = 1;
                }
                marker.switchMaker(markerConfig)
                break;
            case 'trymove':
                tryMove = new WGo.TryMove(player, player.board, marker) //试下
                break;
            case 'endtry':
                tryMove.endTry();
                break;
            case 'delete':
                var curNode = player.kifuReader.node; //获取当前节点
                var parent = curNode.parent; //获取父节点（前一子）
                var children = curNode.children; //获取子节点（后一子）
                //此处判断当前节点是否为最后一手
                if(children.length > 0) {
                    children[curNode._last_selected].parent = parent;
                    children = [children[0]];
                }
                parent.children = children;
                var path = player.kifuReader.path.m;
                player.kifuReader.node = parent;
                player.goTo(path - 1);
                break;
            case 'deleteAll':
                player.kifuReader.node.parent.children = [];
                var path = player.kifuReader.path.m;
                player.goTo(path - 1);
                break;
            case 'deleteBranch':
                marker.config.branchPath = -1;
                player.goTo(tempBranch.path);
                player.kifuReader.node.children.splice(tempBranch.index, 1);
                player.kifuReader.node._last_selected = 0;
                tempBranch.path = 0;
                tempBranch.index = 0;
                editable.setPlayType('normal');
                break;
            case 'addBranch':
                editable.setPlayType('try');
                player.kifuReader.node._last_selected = player.kifuReader.node.children.length;
                tempBranch.path = player.kifuReader.path.m;
                marker.config.branchPath = tempBranch.path;
                break;
            case 'pass':
                editable.pass();
                break;
        }
    })
    marker.config.branchPath = -1;
    player.goTo(tempBranch.path);
    player.kifuReader.node.children.splice(tempBranch.index, 1);
    player.kifuReader.node._last_selected = 0;
    tempBranch.path = 0;
    tempBranch.index = 0;
    editable.setPlayType('normal');

});
/**
 * 连接WebSocket操作
 *@Author xw
 *@Date 2017/11/20 16:54
 */
function  connentServer() {
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
}
/**
 * 连接棋盘
 *@Author xw
 *@Date 2017/11/21 16:28
 */
function connectDevice() {
    if (webSocket == null) {
        pleaseClientWebSocket();
        return;
    }
    var msg = {device: "b0a04756cb21807151544d4d", command: "CONNECT_DEVICE"};
        msg ={device: $("#deviceNo").val()!=null?$("#deviceNo").val():msg, command: "CONNECT_DEVICE"};
        sendMsgToServer(msg);
}
/**
 * 对局开始
 *@Author xw
 *@Date 2017/11/21 16:07
 */
function startGame() {
    if(webSocket==null)
    {
        pleaseClientWebSocket();
        return;
    }
    var msg={command:"START_GAME"};
    sendMsgToServer(msg);
}
/**
 * 对局结束
 *@Author xw
 *@Date 2017/11/21 16:17
 */
function  endGame() {
    if(webSocket==null)
    {
        pleaseClientWebSocket();
        return;
    }
    var msg={command:"END_GAME"};
    sendMsgToServer(msg);
}
/**
 *@Author xw
 *@Date 2017/11/21 16:24
 */
function downChress(){
    if(webSocket==null)
    {
        pleaseClientWebSocket();
        return;
    }
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
/**
 * 给棋盘落子
 *@Author xw
 *@Date 2017/11/21 16:13
 *@param x x坐标, y y坐标， c 黑白子
 */
function setChessBoard(x,y,c) {
    var msg={command:"CHESS_BOARD",x:x,y:y,c:c}
    sendMsgToServer(msg);

}
/**
 * 接受棋盘的落子点
 *@Author xw
 *@Date 2017/11/22 15:56
 *@Param x x坐标,y y坐标,c 黑白子
 */
function  receiveChessBoard(x,y,c) {
    editable.play(x,y,c);//棋盘落子
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
        $("#clientStatusIcon").attr('src',"img/online.png")
    };
    //收到消息时触发
    webSocket.onmessage = function(event) {

        console.log("服务器接受的文本:\t"+event.data)
        var data=JSON.parse(event.data);
        if(data.hasOwnProperty("code"))
        {
            if(data.code==200)
            {

              if(data.hasOwnProperty("jsonObject"))
              {
                  if(data.jsonObject==null)
                  {
                      layer.msg(data.codeMessage)
                  }else {
                     if(data.jsonObject.hasOwnProperty("x")&&data.jsonObject.hasOwnProperty("y")&&data.jsonObject.hasOwnProperty("c"))
                     {
                         if(data.jsonObject.c==2)
                         {
                             data.jsonObject.c=-1
                         }
                         receiveChessBoard(data.jsonObject.x,data.jsonObject.y,data.jsonObject.c);
                     }

                  }

              }

            }else {
                layer.msg(data.codeMessage+"请重试")
            }
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
        $("#clientStatusIcon").attr('src',"img/offline.png")
    }
    //连接错误时触发
    webSocket.onerror = function(event) {
        layer.close(loading)
        console.log("服务器连接错误")
    	layer.alert("连接服务器错误，请确定服务器开启或检查输入地址")
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
function  pleaseClientWebSocket() {
    layer.alert("请先连接webSocket")
}
function encodeScript(data) {
    if(null == data || "" == data) {
        return "";
    }
    return data.replace("<", "&lt;").replace(">", "&gt;");
}


