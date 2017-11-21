/**
 * Created by larry on 2016/12/30.
 * display marks move in board
 */
(function(WGo) {
	"use strict";
	/*
	 *  add solid triangle for show
	 */
	WGo.Board.drawHandlers['TRS'] = WGo.Board.drawHandlers['TR'] = {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius;

				//this.strokeStyle ="red";// args.c || get_markup_color(board, args.x, args.y);
				//this.lineWidth = args.lineWidth || board.lineWidth || 1;
				this.fillStyle = "#FF0000";
				this.beginPath();
				this.moveTo(xr - 0.5, yr - 0.5 - Math.round(sr / 2));
				this.lineTo(Math.round(xr - sr / 2) - 0.5, Math.round(yr + sr / 3) + 0.5);
				this.lineTo(Math.round(xr + sr / 2) + 0.5, Math.round(yr + sr / 3) + 0.5);
				this.closePath();
				this.fill();
				//this.stroke();
			}
		}
	}
	var theme_variable = function(key, board) {
		return typeof board.theme[key] == "function" ? board.theme[key](board) : board.theme[key];
	}
	var get_markup_color = function(board, x, y) {
		if(board.obj_arr[x][y][0].c == WGo.B) return theme_variable("markupBlackColor", board);
		else if(board.obj_arr[x][y][0].c == WGo.W) return theme_variable("markupWhiteColor", board);
		return theme_variable("markupNoneColor", board);
	}
	var _CrNum = null;
	WGo.Board.drawHandlers['LB'] = {
		stone: {
			draw: function(args, board) {
				var xr = board.getX(args.x),
					yr = board.getY(args.y),
					sr = board.stoneRadius,
					font = args.font || theme_variable("font", board) || "";
				this.fillStyle = args.c || get_markup_color(board, args.x, args.y);
				if(args.text.length == 1) this.font = Math.round(sr * 1.5) + "px " + font;
				else if(args.text.length == 2) this.font = Math.round(sr * 1.2) + "px " + font;
				else this.font = Math.round(sr) + "px " + font;
				this.beginPath();
				this.textBaseline = "middle";
				this.textAlign = "center";
				this.fillText(args.text, xr, yr, 2 * sr);
				if(args.addCr) {
					_CrNum = args.text;
					this.fillStyle = "#FF0000";
					this.beginPath();
					this.moveTo(xr - 0.5, yr + 0.5 + Math.round(sr / 1.2));
					this.lineTo(Math.round(xr - sr / 1.5) - 0.5, Math.round(yr + sr / 2) + 0.5);
					this.lineTo(Math.round(xr + sr / 1.5) + 0.5, Math.round(yr + sr / 2) + 0.5);
					this.closePath();
					this.fill();
				}
			}
		},
	}
	var Marker = {};
	var defConfig = {
		markerStyle: 'TRS', //display style
		markerNum: 1, // Set to specify how many items should be displayed at once. from back to front
		lastMoveColor: 'red',
		start: 0,
		branchPath: -1,
	}

	Marker = function(player, board, config) {
		this.player = player;
		this.board = board;
		this.config = config || {};
		for(var key in defConfig)
			if(this.config[key] === undefined && defConfig[key] !== undefined) this.config[key] = defConfig[key];
		this.init();
	}

	Marker.prototype = {
		init: function() {
			this.poss = new WGo.Position(this.player.kifu.size);
			this._bindEvent();
		},
		clearDefaultSytle: function() {
			var node = this.player.kifuReader.node;
			if(node.move) {
				this.board.removeObject({
					x: node.move.x,
					y: node.move.y,
					type: 'CR'
				})
			}
		},
		_bindEvent: function() {
			var self = this;
			this.player.addEventListener('update', function(e) {
				self.showMarker(e);
			});
		},
		clearMarker: function() {
			for(var x = 0; x < this.player.kifu.size; x++) {
				for(var y = 0; y < this.player.kifu.size; y++) {
					var num = this.poss.get(x, y);
					if(num > 0)
						this.board.removeObject({
							x: x,
							y: y,
							type: this.config.markerStyle
						})
				}
			}

		},
		switchMaker: function(config) {
			this.clearMarker();
			for(var key in config) this.config[key] = config[key];
			var curPath = this.player.kifuReader.path.m
			this.player.first();
			this.player.goTo(curPath);
		},
		comparePosition: function(position) {
			var add = [],
				remove = [];
			for(var x = 0; x < this.player.kifu.size; x++) {
				for(var y = 0; y < this.player.kifu.size; y++) {
					var oldNum = this.poss.get(x, y),
						curNum = position.get(x, y);
					if(oldNum > 0 && curNum > 0) {
						if(oldNum != curNum) {
							add.push({
								x: x,
								y: y,
								text: curNum
							})
							remove.push({
								x: x,
								y: y,
								text: oldNum
							})
						}
					} else if(oldNum > 0 && curNum == 0) {
						remove.push({
							x: x,
							y: y,
							text: oldNum
						})
					} else if(oldNum == 0 && curNum > 0) {
						add.push({
							x: x,
							y: y,
							text: curNum
						})
					}
					if(_CrNum && _CrNum == curNum) {
						remove.push({
							x: x,
							y: y,
							text: curNum
						})
						add.push({
							x: x,
							y: y,
							text: curNum
						})
					}
					if(curNum == this.player.kifuReader.path.m) {
						add.push({
							x: x,
							y: y,
							text: curNum
						})
					}
				}
			}
			this.poss = position.clone();
			return {
				add: add,
				remove: remove
			}
		},
		getPosition: function(position, node) {
			var poss = new WGo.Position(this.player.kifu.size),
				branchNum = 0;
			if(this.config.branchPath != -1)
				branchNum = this.config.branchPath;
			var num = this.player.kifuReader.path.m - branchNum - this.config.start,
				tempMarknum = this.config.markerNum == 0 ? num : this.config.markerNum;
			while(node.move) {
				var x = node.move.x;
				var y = node.move.y;
				if(position.get(x, y) != 0 && (!poss.get(x, y))) {
					poss.set(x, y, num);
				}
				num--;
				tempMarknum--;
				node = node.parent;
				if(tempMarknum <= 0) {
					break;
				}
				if(num <= 0) {
					break;
				}
			}
			return poss;
		},
		showMarker: function(e) {
			var node = this.player.kifuReader.node;
			var poss = this.getPosition(e.position.clone(), node)
			var result = this.comparePosition(poss);
			var temp = [];
			result.remove.forEach(function(v, i) {
				this.board.removeObject({
					x: v.x,
					y: v.y,
					type: this.config.markerStyle
				});
			}.bind(this))
			result.add.forEach(function(v, i) {
				if(v.text > 0) {
					var data = {
						x: v.x,
						y: v.y,
						text: v.text,
						type: this.config.markerStyle
					};
					var branchNum = 0;
					if(this.config.branchPath != -1)
						branchNum = this.config.branchPath;
					if(v.text == this.player.kifuReader.path.m - branchNum) {
						data.addCr = true;
					}
					temp.push(data)
				}
			}.bind(this))
			for(var i = 0; i < temp.length; i++) {
				this.board.addObject(temp[i])
			}
		},
	}
	WGo.Player.Marker = Marker
})(WGo)