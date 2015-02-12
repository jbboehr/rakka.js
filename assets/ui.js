
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./ui-controlbar',
			'./ui-list',
			'./ui-stats'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaUIControlBar,
			window.RakkaUIList,
			window.RakkaUIStats
		);
    }
}(function($, RakkaUIControlBar, RakkaUIList, RakkaUIStats) {
	
	function RakkaUI(options) {
		var subopts;
		var theme;
		
		// Setup events
		this.bus = options.bus;
		
		// Setup main options
		if( options && -1 !== ['none', 'light', 'dark'].indexOf(options.theme) ) {
			this.theme = options.theme;
		} else {
			this.theme = options.theme = 'none';
		}
		
		// Setup container
		this.$container = options.container;
		this.$container.addClass('rakka-container')
			.addClass('rakka-no-auto-hide');
		this.onThemeChange(this.theme);
		
		// Setup events
		this.bus.proxy(this);
		this.on('rakka.ui.theme.change', this.onThemeChange.bind(this));
		
		// Setup components
		function makeOpts(opts) {
			return $.extend({
				bus: options.bus,
				container: options.container,
				theme: options.theme
			}, typeof opts === 'object' ? opts : {});
		}
		
		if( options.controlBar ) {
			this.controlBar = new RakkaUIControlBar(makeOpts(options.controlBar));
		}
		
		if( options.list ) {
			this.list = new RakkaUIList(makeOpts(options.list));
		}
		
		if( options.stats ) {
			this.stats = new RakkaUIStats(makeOpts(options.stats));
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
	
	RakkaUI.prototype.onThemeChange = function(theme) {
		if( this.theme ) {
			this.$container.removeClass('rakka-theme-' + this.theme);
		}
		this.theme = theme;
		this.$container.addClass('rakka-theme-' + this.theme);
	};
	
	RakkaUI.prototype.userActive = function(state) {
		if( state ) {
			this.$container.addClass('rakka-user-active').removeClass('rakka-user-inactive');
		} else {
			this.$container.addClass('rakka-user-inactive').removeClass('rakka-user-active');
		}
		
		// Propogate
		this.bus.trigger('rakka.ui.userActive', state);
	};
	
	
	
	// Exports
	window.RakkaUI = RakkaUI;
	return RakkaUI;
}));