
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./ui-controlbar'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaUIControlBar
		);
    }
}(function($, RakkaControlBar) {
	
	function RakkaUI(options) {
		var subopts;
		if( options.controlBar ) {
			options.controlBar = typeof options.controlBar === 'object' ? options.controlBar : {};
			subopts = $.extend({
				rakka: options.rakka,
				container: options.container
			}, options.controlBar);
			this.controlBar = new RakkaControlBar(subopts);
		}
		
		this.listenForUserActivity();
	};
	
	RakkaUI.prototype.listenForUserActivity = function() {
		this._userActivity = true;		
		var lastMoveX
		var lastMoveY;
		var mouseInProgress;
		var onActivity = function () {
			this._userActivity = true;
		}.bind(this);
		function onMouseMove(event) {
			var e = event.originalEvent;
			if( e.screenX != lastMoveX || e.screenY != lastMoveY ) {
				lastMoveX = e.screenX;
				lastMoveY = e.screenY;
				onActivity();
			}
		}
		function onMouseDown() {
			onActivity();
			clearInterval(mouseInProgress);
			mouseInProgress = setInterval(onActivity, 250);
		}
		function onMouseUp() {
			onActivity();
			clearInterval(mouseInProgress);
		}
		// @todo dispose?
		var w = $(window);
		w.on('mousedown', onMouseDown);
		w.on('mousemove', onMouseMove);
		w.on('mouseup', onMouseUp);
		w.on('keydown', onActivity);
		w.on('keyup', onActivity);
		this._activityInterval = setInterval(this.listenLoop.bind(this), 100);
	};
	
	RakkaUI.prototype.listenLoop = function() {
		if( !this._userActivity ) {
			return;
		}
		
		this._userActivity = false;
		this.userActive(true);
		
		clearTimeout(this._inactivityTimeout);
		this._inactivityTimeout = setTimeout(this.listenTimeout.bind(this), 2000);
	};
	
	RakkaUI.prototype.listenTimeout = function() {
		if( !this._userActivity ) {
			this.userActive(false);
		}
	};
	
	RakkaUI.prototype.userActive = function(state) {
		if( this.controlBar ) {
			this.controlBar.userActive(state);
		}
	};
	
	
	
	// Exports
	window.RakkaUI = RakkaUI;
	return RakkaUI;
}));