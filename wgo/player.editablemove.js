
(function(WGo) {

 //  board mousemove callback for edit move - adds highlighting
var edit_board_mouse_move = function(x,y) {
	if(this.player.frozen || (this._lastX == x && this._lastY == y)) return;
	
	this._lastX = x;
	this._lastY = y;
	
	if(this._last_mark) {
		this.board.removeObject(this._last_mark);
	}
	
	if(x != -1 && y != -1 && this.player.kifuReader.game.isValid(x,y)) {
		this._last_mark = {
			type: "outline",
			x: x,
			y: y, 
			c: this.player.kifuReader.game.turn
		};
		this.board.addObject(this._last_mark);
	}
	else {
		delete this._last_mark;
	}
}

// board mouseout callback for edit move	
var edit_board_mouse_out = function() {
	if(this._last_mark) {
		this.board.removeObject(this._last_mark);
		delete this._last_mark;
		delete this._lastX;
		delete this._lastY;
	}
}

// get differences of two positions as a change object (TODO create a better solution, without need of this function)
var pos_diff = function(old_p, new_p) {
	var size = old_p.size, add = [], remove = [];
	
	for(var i = 0; i < size*size; i++) {
		if(old_p.schema[i] && !new_p.schema[i]) remove.push({x:Math.floor(i/size),y:i%size});
		else if(old_p.schema[i] != new_p.schema[i]) add.push({x:Math.floor(i/size),y:i%size,c:new_p.schema[i]});
	}
	
	return {
		add: add,
		remove: remove
	}
}

WGo.Player.Editable = {};

/**
 * Toggle edit mode.
 */
	
WGo.Player.Editable = function(player, board) {
	this.player = player;
	this.board = board;
	this.editMode = false;
	this.IsDrop="0";//落子状态 0 交换落子 1 落黑子 -1 落白子
	this.isCheap=false;//是否确认落子
	this.isMove=false;//是否启动微调
	this.isCurrent=true;//是否为您落子
	this.callback=null;//落子回调
	this.boardControlCB=null;//
	this.coordinate=null;//微调坐标
	this.curX=-1;
	this.curY=-1;
}
WGo.Player.Editable.prototype.setIsDrop=function(flag){
	this.IsDrop=flag;
}
WGo.Player.Editable.prototype.setCurrent=function(flag){
	this.isCurrent=flag;
}
WGo.Player.Editable.prototype.setCallback=function(callback){
	this.callback=callback;
}
WGo.Player.Editable.prototype.setBoardControlCB=function(callback){
	this.boardControlCB=callback;
}
WGo.Player.Editable.prototype.setCoordinate=function(callback){
	this.coordinate=callback;
}

//开启关闭微调
WGo.Player.Editable.prototype.setMove=function(move){
	if(move){
		this.board.removeEventListener("click", this._ev_click);
		this._ev_click = this.preplay.bind(this);
		this.board.addEventListener("click", this._ev_click);
		this.isMove=true;
	}else{
		this.board.removeEventListener("click", this._ev_click);
		this.isMove=false;
		this.editMode = false;
//		this._ev_click = this.play.bind(this);
//		this.board.addEventListener("click", this._ev_click);
	}
}


WGo.Player.Editable.prototype.set = function(set) {
	if(!this.editMode && set) {
		// save original kifu reader
		this.originalReader = this.player.kifuReader;
		// create new reader with cloned kifu
		this.player.kifuReader = new WGo.KifuReader(this.player.kifu.clone(), this.originalReader.rememberPath);
		// go to current position
		this.player.kifuReader.goTo(this.originalReader.path);
		this.board.removeEventListener("click", this._ev_click);
		// register edit listeners
		this._ev_click =this.play.bind(this);
		this.board.addEventListener("click", this._ev_click);
		this.editMode = true;
	}
	else if(this.editMode && !set) {
		// go to the last original position
		this.originalReader.goTo(this.player.kifuReader.path);
		// change object isn't actual - update it, not elegant solution, but simple
		this.originalReader.change = pos_diff(this.player.kifuReader.getPosition(), this.originalReader.getPosition());
		// update kifu reader
		this.player.kifuReader = this.originalReader;
		this.player.update(true);
		// remove edit listeners
		this.board.removeEventListener("click", this._ev_click);
		this.editMode = false;
	}
}
WGo.Player.Editable.prototype.cancelPlay=function(){
	if(!this.isCheap){
		return;
	}
	var color=this.player.kifuReader.game.turn;
	this.board.removeObject([
	    {x: this.curX, y: this.curY, c: color},
		{type: "CR",x: this.curX, y: this.curY} 
	]);
	//this.player.toggleChessTrim(false);
	this.isCheap=false;
	this.curX=-1;
	this.curY=-1;
}

WGo.Player.Editable.prototype.preplay = function(x,y) {
	var _self=this;
	if(!this.isCurrent){
		return;
	}
	if(this.player.frozen || !this.player.kifuReader.game.isValid(x, y)) return;
	if(this.isCheap){
		this.board.removeObject([
		    {x: _self.curX, y: _self.curY, c: color},
    		{type: "CR",x: _self.curX, y: _self.curY}
		]);
		_self.curX=-1;
		_self.curY=-1;
		_self.isCheap=false;
		this.boardControlCB(false);
		return;
	}
	
	this.isCheap=true;
	_self.curX=x;
	_self.curY=y;
	var color=this.IsDrop==0? this.player.kifuReader.game.turn:this.IsDrop;
	_self.board.addObject([
	    {x: x, y: y, c:color },
	    {type: "CR",x: x, y: y}
	]);
	this.boardControlCB&&this.boardControlCB(true,function(e){
		var type=e;
		var x1=x,y1=y;
		_self.board.removeObject([
		    {x: x1, y: y1, c: color},
    		{type: "CR",x: x1, y: y1}
		]);
		if(type=="up"){
			y=y-1;
			var flag=check(x,y);
			while(flag){
				if(y<0){
					flag=false;
				}else{
					y=y-1;
					flag=check(x,y);
				}
			}		
		}else if(type=="down"){
			y=y+1;
			var flag=check(x,y);
			while(flag){
				if(y>parseFloat(_self.board.by)){
					flag=false;
				}else{
					y=y+1;
					flag=check(x,y);
				}
			}
		}else if(type=="left"){
			x=x-1;
			var flag=check(x,y);
			while(flag){
				if(x<0){
					flag=false;
				}else{
					x=x-1;
					flag=check(x,y);
				}
			}
		}else if(type=="right"){
			x=x+1;
			var flag=check(x,y);
			while(flag){
				if(x>parseFloat(_self.board.bx)){
					flag=false;
				}else{
					x=x+1;
					flag=check(x,y);
				}
			}
		}else if(type=="ok"){
			_self.play(x,y);
			_self.isCheap=false;
			this.boardControlCB(false);
			moveBtns=null;
			type=null;
			_self.curX=-1;
			_self.curY=-1;
			return;
		}else{
			moveBtns=null;
			type=null;
			_self.isCheap=false;
			this.boardControlCB(false);
			return;
		}
		if(_self.player.frozen || !_self.player.kifuReader.game.isValid(x, y)||x<0||y<0||x>_self.board.bx||y>_self.board.by) {
			x=x1,y=y1;
		};
		//微调移动 返回坐标
		_self.coordinate&&_self.coordinate({x:x,y:y,c:color})
		_self.curX=x;
		_self.curY=y;
		_self.board.addObject([
		    {x: x, y: y, c: color},
    		{type: "CR",x: x, y: y}
		]);
	});
	function check(x,y){
		return (_self.player.frozen || !_self.player.kifuReader.game.isValid(x, y)||x<0||y<0||x>_self.board.bx||y>_self.board.by) ;
	}
}

WGo.Player.Editable.prototype.play = function(x,y) {

	if(this.player.frozen || !this.player.kifuReader.game.isValid(x, y)) return;
	var _move=this.player.kifuReader.node.move;
	var m=_move?_move.m:0;
	var color=this.IsDrop==0? this.player.kifuReader.game.turn:this.IsDrop;
	this.player.kifuReader.node.appendChild(new WGo.KNode({
		move: {
			x: x, 
			y: y, 
			c: color,
			m:m+1
		}, 
		_edited: true
	}));
	this.player.next(this.player.kifuReader.node.children.length-1);
	this.player.kifu.nodeCount++;
	this.callback&&this.callback("3",{
		x: x, 
		y: y, 
		c: color
	});
}
WGo.Player.Editable.prototype.pass = function(x, y, c) {
	if(this.player.frozen) return;
	this.player.kifuReader.node.appendChild(new WGo.KNode({
		move: {
			pass: true,
			c: c || this.player.kifuReader.game.turn,
		},
		_edited: true
	}));
	this.player.kifuReader.kifu.nodeCount++;
	this.player.next(this.player.kifuReader.node.children.length - 1);
	this.playcb && this.playcb(x, y);
};


if(WGo.BasicPlayer && WGo.BasicPlayer.component.Control) {
	WGo.BasicPlayer.component.Control.menu.push({
		constructor: WGo.BasicPlayer.control.MenuItem,
		args: {
			name: "editmode",
			togglable: true,
			click: function(player) { 
				this._editable = this._editable || new WGo.Player.Editable(player, player.board);
				this._editable.set(!this._editable.editMode);
				return this._editable.editMode;
			},
			init: function(player) {
				var _this = this;
				player.addEventListener("frozen", function(e) {
					_this._disabled = _this.disabled;
					if(!_this.disabled) _this.disable();
				});
				player.addEventListener("unfrozen", function(e) {
					if(!_this._disabled) _this.enable();
					delete _this._disabled;
				});
			},
		}
	}); 
}

WGo.i18n.en["editmode"] = "Edit mode";

})(WGo);
