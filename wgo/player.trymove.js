/**
 * Created by larry on 2017/1/6.
 */
(function(WGo) {
	var tryMove = function(player, board, marker) {
		this.oldMark = {};
		this.player = player;
		this.board = board;
		this.marker = marker;
		this.isPlayVoice = true;
		this.init();
	};
	var state = {
		BLACK_STONE: 1, // must be equal to WGo.B
		WHITE_STONE: -1, // must be equal to WGo.W
	};
	//  var edit_board_mouse_move = function (x, y) {
	//      if (this.player.frozen || (this._lastX == x && this._lastY == y)) return;
	//
	//      this._lastX = x;
	//      this._lastY = y;
	//
	//      if (this._last_mark) {
	//          this.board.removeObject(this._last_mark);
	//      }
	//
	//      if (x != -1 && y != -1 && this.player.kifuReader.game.isValid(x, y)) {
	//          this._last_mark = {
	//              type: "outline",
	//              x: x,
	//              y: y,
	//              c: this.player.kifuReader.game.turn
	//          };
	//          this.board.addObject(this._last_mark);
	//      }
	//      else {
	//          delete this._last_mark;
	//      }
	//  };
	//  // board mouseout callback for edit move
	//  var edit_board_mouse_out = function () {
	//      if (this._last_mark) {
	//          this.board.removeObject(this._last_mark);
	//          delete this._last_mark;
	//          delete this._lastX;
	//          delete this._lastY;
	//      }
	//  };
	tryMove.prototype = {
		init: function() {
			this.sgf = this.player.kifuReader.kifu.toSgf();
			this.curPos = this.player.kifuReader.path.m;
			this.oldMark.branchPath = this.marker.config.branchPath;
			this.oldMark.lastMoveColor = this.marker.config.lastMoveColor;
			this.oldMark.markerNum = this.marker.config.markerNum;
			this.oldMark.markerStyle = this.marker.config.markerStyle;
			this.oldMark.start = this.marker.config.start;
			var turn = this.player.kifuReader.game.turn;
			var p = this.player.kifuReader.game.position;
			var bs = [],
				ws = [];
			for(var i = 0; i < p.size; i++) {
				for(var j = 0; j < p.size; j++) {
					s = p.get(j, i);
					var x1 = String.fromCharCode(j + 97);
					var y1 = String.fromCharCode(i + 97);
					if(s == state.BLACK_STONE) {
						bs.push("[" + x1 + "" + y1 + "]");
					} else if(s == state.WHITE_STONE) {
						ws.push("[" + x1 + "" + y1 + "]");
					}
				}
			}
			this.marker.switchMaker({
				markerStyle: 'LB',
				markerNum: 0
			});
			var sgf = "(;SZ[" + this.player.kifuReader.kifu.size + "]AB" + bs.join('') + "AW" + ws.join('') + ")";
			this.isPlayVoice = true;
			this.player.loadSgf(sgf);
			this.player.last();
			this.isPlayVoice = false;
			this.player.kifuReader.game.turn = turn;
			this.player.kifuReader.game.position.capCount = p.capCount;
			if(!this._bind_evn) this._bind_evn = this.play.bind(this);
			//          this._ev_move = this._ev_move || edit_board_mouse_move.bind(this);
			//          this._ev_out = this._ev_out || edit_board_mouse_out.bind(this)；
			this.board.addEventListener("click", this._bind_evn);
			//          this.board.addEventListener("mousemove", this._ev_move);
			//          this.board.addEventListener("mouseout", this._ev_out);

		},
		play: function(x, y) {
			if(this.player.frozen || !this.player.kifuReader.game.isValid(x, y) || (this.editMode == false)) return;
			this.player.kifuReader.node.appendChild(new WGo.KNode({
				move: {
					x: x,
					y: y,
					c: this.player.kifuReader.game.turn
				},
				_edited: true
			}));
			this.player.next(this.player.kifuReader.node.children.length - 1);
		},
		endTry: function(curPos) {
			var sgf = this.player.kifuReader.kifu.toSgf();
			this.marker.switchMaker(this.oldMark);
			this.isPlayVoice = true;
			this.player.loadSgf(this.sgf);
			this.player.goTo(curPos || this.curPos);
			this.isPlayVoice = false;
			this.board.removeEventListener("click", this._bind_evn);

			//          this.board.removeEventListener("mousemove", this._ev_move);
			//          this.board.removeEventListener("mouseout", this._ev_out);
			return sgf;
		},
	};
	WGo.TryMove = tryMove;
})(WGo)