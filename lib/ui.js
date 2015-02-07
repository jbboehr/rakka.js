
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./ui-controlbar',
			'./ui-stats'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaUIControlBar,
			window.RakkaUIStats
		);
    }
}(function($, RakkaUIControlBar, RakkaUIStats) {
	
	function RakkaUI(options) {
		var subopts;
		
		this.$container = options.container;
		this.$container.addClass('rakka-container')
			.addClass('rakka-no-auto-hide');
		
		if( options.controlBar ) {
			options.controlBar = typeof options.controlBar === 'object' ? options.controlBar : {};
			subopts = $.extend({
				rakka: options.rakka,
				container: options.container
			}, options.controlBar);
			this.controlBar = new RakkaUIControlBar(subopts);
		}
		
		if( options.list ) {
			options.list = typeof options.list === 'object' ? options.list : {};
			subopts = $.extend({
				rakka: options.rakka,
				container: options.container
			}, options.list);
			this.list = new RakkaUIList(subopts);
		}
		
		if( options.stats ) {
			options.stats = typeof options.stats === 'object' ? options.stats : {};
			subopts = $.extend({
				rakka: options.rakka,
				container: options.container
			}, options.stats);
			this.stats = new RakkaUIStats(subopts);
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
		if( state ) {
			this.$container.addClass('rakka-user-active').removeClass('rakka-user-inactive');
		} else {
			this.$container.addClass('rakka-user-inactive').removeClass('rakka-user-active');
		}
		
		// Propogate
		if( this.controlBar ) {
			this.controlBar.userActive(state);
		}
		if( this.list ) {
			this.list.userActive(state);
		}
		if( this.stats ) {
			this.stats.userActive(state);
		}
	};
	
	
	
	// Exports
	window.RakkaUI = RakkaUI;
	return RakkaUI;
}));