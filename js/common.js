$(document).ready(function () {
    window.onresize=function(){

        $("#main").width($(window).width()-35);
        $("#main").height($(window).height()-50);
    }
    $("#main").height($(window).height()-50);
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
    $("#deleteBranch").on('click',function () {
        marker.config.branchPath = -1;
        player.goTo(tempBranch.path);
        player.kifuReader.node.children.splice(tempBranch.index, 1);
        player.kifuReader.node._last_selected = 0;
        tempBranch.path = 0;
        tempBranch.index = 0;
        editable.setPlayType('normal');
    })
    marker.config.branchPath = -1;
    player.goTo(tempBranch.path);
    player.kifuReader.node.children.splice(tempBranch.index, 1);
    player.kifuReader.node._last_selected = 0;
    tempBranch.path = 0;
    tempBranch.index = 0;
    editable.setPlayType('normal');
});
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var seconds=date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if(seconds<10)
    {
        seconds="0"+seconds
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + seconds;
    return currentdate;
}

function objKeySort(obj) {//排序的函数
    var newkey = Object.keys(obj).sort();
    //先用Object内置类的keys方法获取要排序对象的属性名，再利用Array原型上的sort方法对获取的属性名进行排序，newkey是一个数组
    var newObj = {};//创建一个新的对象，用于存放排好序的键值对
    for (index in newkey) {//遍历newkey数组

        newObj[newkey[index]] = obj[newkey[index]];//向新创建的对象中按照排好的顺序依次增加键值对
    }
    return newObj;//返回排好序的新对象
}
var compare = function (x, y) {
   if(x.substring(0,1)=="G"&&y.substring(0,1)=="G")
   {
       x=x.substring(11,x.length);
       y=y.substring(11,y.length);
       console.log(x+"////"+y);
       if (x < y) {
           return 1;
       } else if (x > y) {
           return -1;
       } else {
           return 0;
       }
   }
}
