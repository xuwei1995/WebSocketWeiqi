/**
 * Created by larry on 2016/12/30.
 * display marks move in board
 */
(function(WGo) {
	"use strict";
	var Branch = {};
	var defConfig = {
		branchListen: function() {},
		method: 1, //0 显示在棋盘上，1 返回数据
	}
	Branch = function(player, board, config) {
		this.player = player;
		this.board = board;
		this.config = config || {};
		for(var key in defConfig)
			if(this.config[key] === undefined && defConfig[key] !== undefined) 
			this.config[key] = defConfig[key];
		this.init();
		this.curNode = null;
	}

	Branch.prototype = {
		init: function() {
			this._bindEvent();
			this.addBranch({
				node:this.player.kifuReader.node
			});
		},
		_bindEvent: function() {
			var self = this;
			this.player.addEventListener('update', function(e) {
				self.addBranch(e);
				self.curNode = e.node;
			});
		},
		/**
		 * 添加分支
		 */
		addBranch: function(e) {
			var branch = []
			if(e.node.children.length > 1) {
				for(var i = 0; i < e.node.children.length; i++) {
					if(e.node.children[i].move && !e.node.children[i].move.pass) branch.push({
						type: "LB",
						text: String.fromCharCode(65 + i),
						x: e.node.children[i].move.x,
						y: e.node.children[i].move.y,
						c: "rgba(0,32,128,0.8)",
						move:this.player.kifuReader.path.m
					});
				}
			}
			if(this.config.method == 0) {
				for(var i = 0; i < branch.length; i++) {
					this.board.addObject(branch[i])
				}
			} else {
				this.config.branchListen(branch);
			}
		},
		/**
		 * 切换分支
		 */
		checkout: function(x, y,move) {
			this.player.goTo(move);
			var node=this.player.kifuReader.node;
			for(var i in node.children) {
				if(node.children[i].move && node.children[i].move.x == x && node.children[i].move.y == y) {
					this.player.next(i);
					return;
				}
			}
		}
	}
	WGo.Player.Branch = Branch
})(WGo)