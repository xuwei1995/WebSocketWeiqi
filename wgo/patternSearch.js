(function(WGo) {
	//棋形搜索
	var PatternSearch = function(player, board, callback) {
		this.player = player;
		this.board = board;
		this.callback = callback || null;
		this.init();
	}
	PatternSearch.prototype = {
		//初始点位置
		origin: {
			x: 18,
			y: 0
		},
		//画布元素
		element: null,
		//画布内容
		context: null,
		//是否开启
		isOpen: false,
		//初始化化方法
		init: function() {
			var board = this.board,
				player = this.player,
				element = document.createElement('canvas'),
				context = element.getContext('2d');
			//初始化画布属性
			element.style.position = 'absolute';
			element.style.zIndex = 400;
			element.width = board.width;
			element.height = board.height;
			element.style.width = board.width / board.pixelRatio + 'px';
			element.style.height = board.height / board.pixelRatio + 'px';
			board.element.appendChild(element);
			this.element = element;
			this.context = context;
			//绑定滑动事件
			board.addEventListener('touchmove', function(e) {
				var x, y,
					boardTop = player.element.offsetTop,
					boardLeft = player.element.offsetLeft;
				//计算x，y坐标
				x = (event.targetTouches[0].clientX - boardLeft) * board.pixelRatio;
				x -= board.left;
				x /= board.fieldWidth;
				x = Math.round(x);
				y = (event.targetTouches[0].clientY - boardTop) * board.pixelRatio;
				y -= board.top;
				y /= board.fieldHeight;
				y = Math.round(y);
				//绘制区域
				this.drawArea(x, y);
			}.bind(this));
			//绑定点击事件
			var clickEvent = mui.os.ios ? 'touchend' : 'click';
			board.addEventListener(clickEvent, function(x, y) {
				this.drawArea(x, y);
			}.bind(this))
		},
		//选择初始点
		switchArea: function(type) {
			var x, y;
			//设置为可绘制
			this.set(true);
			switch(type) {
				case 'upperLeft':
					//左上方
					x = 0;
					y = 0;
					break;
				case 'upperRight':
					//右上方
					x = this.board.size - 1;
					y = 0;
					break;
				case 'LowerLeft':
					//左下方
					x = 0;
					y = this.board.size - 1;
					break;
				case 'LowerRight':
					//右下方
					x = y = this.board.size - 1;
					break;
			}
			this.origin.x = x;
			this.origin.y = y;
			//绘制初始1/4棋盘位置
			this.drawArea((this.board.size - 1) / 2, (this.board.size - 1) / 2);
		},
		//绘制方法
		drawArea: function(x, y) {
			if(!this.isOpen) return;
			//边界限制
			if(x < 0 || y < 0 || x > this.board.size - 1 || y > this.board.size - 1) return;
			//最大最小区域限制
			var xLength = Math.abs(this.origin.x - x),
				yLength = Math.abs(this.origin.y - y);
			if(yLength * yLength < 4) return;
			var board = this.board,
				element = this.element,
				context = this.context,
				//初始点扩展定位（多出半个棋子距离）
				drawXStart = this.origin.x == 0 ? this.origin.x - 0.5 : this.origin.x + 0.5,
				drawYStart = this.origin.y == 0 ? this.origin.y - 0.5 : this.origin.y + 0.5,
				xStart = board.getX(drawXStart),
				yStart = board.getY(drawYStart),
				//结束点扩展定位（多出半个棋子距离）
				drawX = this.origin.x == 0 ? x + 0.5 : x - 0.5,
				drawY = this.origin.y == 0 ? y + 0.5 : y - 0.5,
				xEnd = board.getX(drawX),
				yEnd = board.getY(drawY);
			if(context) context.clearRect(0, 0, element.width, element.height);
			context.fillStyle = "rgba(123,201,219,0.25)";
			context.lineWidth = 1;
			context.strokeStyle = "#3f85c5";
			context.beginPath();
			context.moveTo(xStart, yStart);
			context.lineTo(xEnd, yStart);
			context.lineTo(xEnd, yEnd);
			context.lineTo(xStart, yEnd);
			context.closePath();
			context.fill();
			context.stroke();
			//生成请求参数
			this.generatData(x, y);
		},
		//生成请求参数
		generatData: function(x, y) {
			var xLength = Math.abs(this.origin.x - x),
				yLength = Math.abs(this.origin.y - y),
				str = '',
				position = this.player.kifuReader.getPosition().schema,
				stoneNum = 0;
			for(var yStart = 0; yStart <= yLength; yStart++) {
				for(var xStart = 0; xStart <= xLength; xStart++) {
					//根据初始位置确定初始值
					var dataX = x > this.origin.x ? this.origin.x + xStart : x + xStart,
						dataY = y > this.origin.y ? this.origin.y + yStart : y + yStart;
					var target = dataX * this.board.size + dataY;
					var thisNode = '.';
					if(position[target] == WGo.B) {
						thisNode = 'X';
						stoneNum += 1
					} else if(position[target] == WGo.W) {
						thisNode = 'O';
						stoneNum += 1
					}
					str = str + thisNode;
				}
				str = str;
			}
			var result = {
				width: xLength + 1,
				height: yLength + 1,
				content: str,
				num: stoneNum
			}
			this.callback && this.callback(result);
		},
		//设置是否可绘制
		set: function(type) {
			this.isOpen = type;
		},
		//关闭绘制
		close: function(callback) {
			this.set(false);
			if(this.context) this.context.clearRect(0, 0, this.element.width, this.element.height);
			callback && callback();
		}
	}
	WGo.Player.PatternSearch = PatternSearch
})(WGo)