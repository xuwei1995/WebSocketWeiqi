(function(WGo) {
	var to_num = function(str, i) {
		return str.charCodeAt(i) - 97;
	}
	var ajaxUrl = 'https://score.yikeweiqi.com/score?callback=?';
	var ScoreMode = function(position, board, komi, output, mode, role, deadcb, handicap, isShowWating) {
		this.originalPosition = position;
		this.position = position.clone();
		this.initPosition = position.clone();
		this.board = board;
		var re = /^[0-9]+.?[0-9]*$/;
		if(!re.test(komi)) komi = 7.5;
		this.komi = komi;
		this.output = output;
		this.mode = mode || "auto";
		this.role = role || 0;
		this.deadcb = deadcb || false;
		this.handicap = handicap || 0;
		this.isShowWating = isShowWating || 'show';
	}

	var state = ScoreMode.state = {
		UNKNOWN: 0,
		BLACK_STONE: 1, // must be equal to WGo.B
		WHITE_STONE: -1, // must be equal to WGo.W
		BLACK_CANDIDATE: 2,
		WHITE_CANDIDATE: -2,
		BLACK_NEUTRAL: 3,
		WHITE_NEUTRAL: -3,
		NEUTRAL: 4,
	}

	var territory_set = function(pos, x, y, color, margin) {
		var p = pos.get(x, y);
		if(p === undefined || p == color || p == margin) return;

		pos.set(x, y, color);

		territory_set(pos, x - 1, y, color, margin);
		territory_set(pos, x, y - 1, color, margin);
		territory_set(pos, x + 1, y, color, margin);
		territory_set(pos, x, y + 1, color, margin);
	}

	var territory_reset = function(pos, orig, x, y, margin) {
		var o = orig.get(x, y);
		if(pos.get(x, y) == o) return;

		pos.set(x, y, o);
		territory_reset(pos, orig, x - 1, y, margin);
		territory_reset(pos, orig, x, y - 1, margin);
		territory_reset(pos, orig, x + 1, y, margin);
		territory_reset(pos, orig, x, y + 1, margin);
	}

	ScoreMode.prototype.start = function(waiting) {
		this.waiting = waiting || null;
		this.showWaiting();
		this.saved_state = this.board.getState();
		this.remotescore();
		this._click = this._click || this.removeDead.bind(this);
		this.board.removeEventListener("click", this._click);
		this.board.addEventListener("click", this._click);
	}
	ScoreMode.prototype.removeDead = function(x, y) {
		var m = this.initPosition.get(x, y);
		if(this.role == 1 && m == 1) {
			this.deadpoint(x, y);
		} else if(this.role == -1 && m == -1) {
			this.deadpoint(x, y);
		} else if(this.role == 0) {
			this.deadpoint(x, y);
		}
	}
	ScoreMode.prototype.otherdead = function(x, y) {
		var m = this.initPosition.get(x, y);
		this.deadpoint(x, y, false);
	}
	ScoreMode.prototype.deadpoint = function(x, y, flag) {
		if(typeof(flag) == "undefined") flag = true;
		var c = this.originalPosition.get(x, y);

		if(c == WGo.W) {
			if(this.position.get(x, y) == state.WHITE_STONE) territory_set(this.position, x, y, state.BLACK_CANDIDATE, state.BLACK_STONE);
			else {
				territory_reset(this.position, this.originalPosition, x, y, state.BLACK_STONE);
				this.calculate();
			}
		} else if(c == WGo.B) {
			if(this.position.get(x, y) == state.BLACK_STONE) territory_set(this.position, x, y, state.WHITE_CANDIDATE, state.WHITE_STONE);
			else {
				territory_reset(this.position, this.originalPosition, x, y, state.WHITE_STONE);
				this.calculate();
			}
		} else {
			var p = this.position.get(x, y);

			if(p == state.BLACK_CANDIDATE) this.position.set(x, y, state.BLACK_NEUTRAL);
			else if(p == state.WHITE_CANDIDATE) this.position.set(x, y, state.WHITE_NEUTRAL);
			else if(p == state.BLACK_NEUTRAL) this.position.set(x, y, state.BLACK_CANDIDATE);
			else if(p == state.WHITE_NEUTRAL) this.position.set(x, y, state.WHITE_CANDIDATE);
		}

		this.board.restoreState({
			objects: WGo.clone(this.saved_state.objects)
		});
		this.displayScore();
		flag && this.deadcb && this.deadcb(x, y);
	}
	ScoreMode.prototype.end = function() {
		this.board.restoreState({
			objects: WGo.clone(this.saved_state.objects)
		});
		this.board.removeEventListener("click", this._click);
		this.closeWaiting();
	}
	ScoreMode.prototype.removeEvent = function() {
		this._click && this.board.removeEventListener("click", this._click);
	}
	ScoreMode.prototype.showWaiting = function() {
		if(this.isShowWating == 'show') {
			if(window.plus) {
				this.waiting = plus.nativeUI.showWaiting('', {
					padlock: true
				})
			} else {
				this.waiting.show();
			}
		}
	}
	ScoreMode.prototype.closeWaiting = function() {
		this.waiting && this.waiting.close();
	}
	ScoreMode.prototype.displayScore = function() {
		var score = {
			bc: [], //黑的子数
			wc: [], //白的子数
			black: [], //黑的空
			white: [], //白的空
			neutral: [], //空子
			black_captured: [], //黑色虚子
			white_captured: [], //白色虚子
		}

		for(var i = 0; i < this.position.size; i++) {
			for(var j = 0; j < this.position.size; j++) {
				s = this.position.get(i, j);
				t = this.originalPosition.get(i, j);

				if(s == state.BLACK_CANDIDATE) score.black.push({
					x: i,
					y: j,
					type: "mini",
					c: WGo.B
				});
				else if(s == state.WHITE_CANDIDATE) score.white.push({
					x: i,
					y: j,
					type: "mini",
					c: WGo.W
				});
				else if(s == state.NEUTRAL) score.neutral.push({
					x: i,
					y: j
				});
				else if(s == state.BLACK_STONE) score.bc.push({
					x: i,
					y: j,
					c: WGo.B
				});
				else if(s == state.WHITE_STONE) score.wc.push({
					x: i,
					y: j,
					c: WGo.W
				});
				else score.neutral.push({
					x: i,
					y: j
				});

				if(t == WGo.W && s != state.WHITE_STONE) score.white_captured.push({
					x: i,
					y: j,
					type: "outline",
					c: WGo.W
				});
				else if(t == WGo.B && s != state.BLACK_STONE) score.black_captured.push({
					x: i,
					y: j,
					type: "outline",
					c: WGo.B
				});
			}
		}
		for(var i = 0; i < score.black_captured.length; i++) {
			this.board.removeObjectsAt(score.black_captured[i].x, score.black_captured[i].y);
		}

		for(var i = 0; i < score.white_captured.length; i++) {
			this.board.removeObjectsAt(score.white_captured[i].x, score.white_captured[i].y);
		}
		this.board.addObject(score.white_captured);
		this.board.addObject(score.black_captured);
		this.board.addObject(score.black);
		this.board.addObject(score.white);
		var bdame = score.neutral.length;
		//		if(bdame % 2 != 0 && this.originalPosition.color == WGo.B) {
		//			bdame -= 1;
		//		} else if(bdame % 2 != 0 && this.originalPosition.color == WGo.W) {
		//			bdame += 1;
		//		}
		bdame = bdame / 2;
		var btake = (score.white_captured.length + this.originalPosition.capCount.black);
		var wtake = (score.black_captured.length + this.originalPosition.capCount.white);
		this.handicap = parseInt(this.handicap) == 1 ? 0 : parseInt(this.handicap);
		var cnresult = score.bc.length + score.black.length + bdame - parseFloat(this.komi) / 2 - this.handicap / 2 - ((this.board.size * this.board.size) / 2);
		var jpresult = (score.black.length + btake) - (score.white.length + wtake + parseFloat(this.komi));
		var jpwin = jpresult > 0 ? 1 : -1;
		var cnwin = cnresult > 0 ? 1 : -1;
		var result = {
			cn: {
				blackstone: score.bc.length + score.black.length, //黑子数
				whitestone: score.wc.length + score.white.length, //白子数
				result: Math.abs(cnresult), //数子结果
				empty: bdame, //空的子数
				win: cnwin
			},
			jp: {
				blackstone: score.black.length, //黑目
				whitestone: score.white.length, //白目
				result: Math.abs(jpresult), //数目结果
				win: jpwin
			},
			komi: parseFloat(this.komi), //贴目
			btake: btake, //黑的提子
			wtake: wtake, //白的提子
		};
		this.waiting && this.waiting.close();
		this.output(result);
	}
	ScoreMode.prototype.remotescore = function() {
		var p, s, t, b, w, change, bs = [],
			ws = [];
		p = this.position;
		for(var i = 0; i < p.size; i++) {
			for(var j = 0; j < p.size; j++) {
				s = p.get(j, i);
				var x1 = String.fromCharCode(j + 97);
				var y1 = String.fromCharCode(i + 97);
				if(s == state.BLACK_STONE || s == state.BLACK_CANDIDATE) {
					bs.push(x1 + "" + y1);
				} else if(s == state.WHITE_STONE || s == state.WHITE_CANDIDATE) {
					ws.push(x1 + "" + y1);
				}
			}
		}
		var that = this;
		var bwmsg = "";
		if(this.originalPosition.color == -1) {
			bwmsg = "black";
		} else if(this.originalPosition.color == 1) {
			bwmsg = "white";
		}
		var data = {
			komi: that.komi,
			b: bs.join(":"),
			w: ws.join(":"),
			cb: this.originalPosition.capCount.white,
			cw: this.originalPosition.capCount.black,
			turn: bwmsg,
			sz: this.board.size,
			mode: this.mode
		};
		$.ajax({
			type: 'GET',
			url: ajaxUrl,
			timeout: 30000,
			dataType: 'jsonp',
			jsonp: 'callback',
			data: data,
			success: function(data) {
				if(data.Status == 1200) {
					var result = JSON.parse(data.Result);
					that.calcResult(result);
				} else {
					that.failCB();
				}
			},
			error: function(xhr, type, e) {
				that.failCB();
			}
		});
	}
	ScoreMode.prototype.failCB = function() {
		//		this.calculate();
		//		this.displayScore();
		plus.nativeUI.closeWaiting();
		mui.toast('该功能使用过于频繁');
	}
	ScoreMode.prototype.calcResult = function(data) {
		var p = this.position;
		var score = {
			black: [],
			white: [],
			neutral: [],
			black_captured: [],
			white_captured: [],
		}
		var cb = data.b;
		var cw = data.w;
		var itema = cb.split(":");
		for(var it in itema) {
			var i = to_num(itema[it], 0);
			var j = to_num(itema[it], 1);
			s = this.originalPosition.get(i, j);
			if(s != state.BLACK_STONE) {
				p.set(i, j, state.BLACK_CANDIDATE);
			}
		}
		var itemb = cw.split(":");
		for(var it in itemb) {
			var i = to_num(itemb[it], 0);
			var j = to_num(itemb[it], 1);
			s = this.originalPosition.get(i, j);
			if(s != state.WHITE_STONE) {
				p.set(i, j, state.WHITE_CANDIDATE);
			}
		}
		this.displayScore();
	}

	ScoreMode.prototype.calculate = function() {
		var p, s, t, b, w, change;

		// 1. create testing position, empty fields has flag ScoreMode.UNKNOWN
		p = this.position;

		// 2. repeat until there is some change of state:
		change = true;
		while(change) {
			change = false;

			// go through the whole position
			for(var i = 0; i < p.size; i++) {
				//var str = "";
				for(var j = 0; j < p.size; j++) {
					s = p.get(j, i);

					if(s == state.UNKNOWN || s == state.BLACK_CANDIDATE || s == state.WHITE_CANDIDATE) {
						// get new state
						t = [p.get(j - 1, i), p.get(j, i - 1), p.get(j + 1, i), p.get(j, i + 1)];
						b = false;
						w = false;

						for(var k = 0; k < 4; k++) {
							if(t[k] == state.BLACK_STONE || t[k] == state.BLACK_CANDIDATE) b = true;
							else if(t[k] == state.WHITE_STONE || t[k] == state.WHITE_CANDIDATE) w = true;
							else if(t[k] == state.NEUTRAL) {
								b = true;
								w = true;
							}
						}

						t = false;

						if(b && w) t = state.NEUTRAL;
						else if(b) t = state.BLACK_CANDIDATE;
						else if(w) t = state.WHITE_CANDIDATE;

						if(t && s != t) {
							change = true;
							p.set(j, i, t);
						}
					}
					//str += (p.get(j,i)+5)+" ";
				}
				//console.log(str);
			}
			//console.log("------------------------------------------------------------");
		}
	}

	var ScoreModeCheck = function(position, board, komi, output) {
		this.originalPosition = position;
		this.position = position.clone();
		this.board = board;
		var re = /^[0-9]+.?[0-9]*$/;
		if(!re.test(komi)) komi = 7.5;
		this.komi = komi;
		this.output = output;
	}
	ScoreModeCheck.prototype.checkMode = function() {
		this.calculatescore();
	}
	ScoreModeCheck.prototype.calculatescore = function() {
		var p, s, t, b, w, change, bs = [],
			ws = [];
		p = this.position;
		for(var i = 0; i < p.size; i++) {
			for(var j = 0; j < p.size; j++) {
				s = p.get(j, i);
				var x1 = String.fromCharCode(j + 97);
				var y1 = String.fromCharCode(i + 97);
				if(s == state.BLACK_STONE || s == state.BLACK_CANDIDATE) {
					bs.push(x1 + "" + y1);
				} else if(s == state.WHITE_STONE || s == state.WHITE_CANDIDATE) {
					ws.push(x1 + "" + y1);
				}
			}
		}
		var that = this;
		var bwmsg = "";
		if(this.originalPosition.color == -1) {
			bwmsg = "black";
		} else if(this.originalPosition.color == 1) {
			bwmsg = "white";
		}
		var data = {
			komi: that.komi,
			b: bs.join(":"),
			w: ws.join(":"),
			cb: this.originalPosition.capCount.white,
			cw: this.originalPosition.capCount.black,
			turn: bwmsg,
			sz: this.board.size,
			mode: "query"
		};
		$.ajax({
			type: 'GET',
			url: ajaxUrl,
			timeout: 30000,
			dataType: 'jsonp',
			jsonp: 'callback',
			data: data,
			success: function(data) {
				if(data.Status == 1200) {
					that.waiting && that.waiting.close();
					that.output(data.Result);
				} else {
					that.waiting && that.waiting.close();
					that.output("error");
				}
			},
			error: function(xhr, type, e) {
				that.waiting && that.waiting.close();
				that.output("error");
			}
		});
	}

	WGo.ScoreMode = ScoreMode;
	WGo.ScoreModeCheck = ScoreModeCheck;
})(WGo);