
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery'
		], factory);
    } else {
        factory(
			window.jQuery
		);
    }
}(function($) {
	
	function RakkaUIControlBar(options) {
		this.$container = options.container;
		this.theme = options.theme;
		
		this.speedBaseIncrement = 25;
		this.speedFactor = 1;
		
		// Setup bus
		this.bus = options.bus;
		this.bus.proxy(this);
		
		// Setup elements
		this.render();
		
		// Bind events
		this.bind();
		
		// Cough
		this.trigger('rakka.speed.emit');
	};
	
	RakkaUIControlBar.prototype.render = function() {
		this.$element = $('<div>').addClass('rakka-ui-component rakka-ui-controlbar user-active force-show')
			.appendTo(this.$container);
		
		this.$toggle = $('<button>')
			.attr('class', 'btn btn-success')
			.attr('data-action', 'toggle')
			.text('Start')
			.appendTo(this.$element);
		
		this.$reverse = $('<button>')
			.attr('class', 'btn btn-warning')
			.attr('data-action', 'reverse')
			.text('Reverse')
			.appendTo(this.$element);
		
		this.$fullscreen = $('<button>')
			.attr('class', 'btn btn-info')
			.attr('data-action', 'fullscreen')
			.text('Fullscreen')
			.appendTo(this.$element);
		
		if( !this.isFullscreenSupported(this.$container[0]) ) {
			this.$fullscreen.addClass('disabled')
				.prop('disabled', true);
		}
		
		this.$speed = $('<input type="range">')
			.addClass('form-control')
			.prop('min', 60)
			.prop('max', 2100)
			.prop('step', 30)
			.on('input', this.onSpeedChange.bind(this))
			.appendTo(this.$element);
		
		this.$autoHide = $('<button>')
			.attr('class', 'btn btn-info')
			.attr('data-action', 'auto-hide')
			.attr('data-state', 'off')
			.text('Hide controls')
			.on('click', this.onAutoHideClick.bind(this))
			.appendTo(this.$element);
			
		this.$theme = $('<select>')
			.attr('class', 'form-control')
			.attr('data-action', 'change-theme')
			//.append('<option value=""></option>')
			.append('<option value="light">Light</option>')
			.append('<option value="dark">Dark</option>')
			.on('change', this.onThemeChange.bind(this))
			.val('' + this.theme)
			.appendTo(this.$element);
	};
	
	RakkaUIControlBar.prototype.bind = function() {
		// Bus events
		this.on('rakka.direction.changed', this.onRakkaDirectionChanged.bind(this));
		this.on('rakka.started', this.onRakkaStarted.bind(this));
		this.on('rakka.stopped', this.onRakkaStopped.bind(this));
		this.on('rakka.reverse.ended', this.onRakkaReverseEnded.bind(this));
		this.on('rakka.speed.changed', this.onRakkaSpeedChanged.bind(this));
		
		// DOM events
		this.$element.on('click', '[data-action="toggle"]', this.trigger.bind(null, 'rakka.toggle'));
		this.$element.on('click', '[data-action="reverse"]', this.trigger.bind(null, 'rakka.direction.toggle'));
		this.$element.on('click', '[data-action="fullscreen"]', this.onFullscreenClick.bind(this));
		
		// Keyboard shortcut events
		$(window).on('keydown', this.onKeyDown.bind(this));
	};
	
	RakkaUIControlBar.prototype.isFullscreenSupported = function(elem) {
		return (elem.requestFullscreen || 
				elem.msRequestFullscreen ||
				elem.mozRequestFullScreen ||
				elem.webkitRequestFullscreen ? true : false);
	};
	
	RakkaUIControlBar.prototype.onRakkaDirectionChanged = function(direction) {
		if( direction === -1 ) {
			this.$reverse.text('Forward');
		} else {
			this.$reverse.text('Reverse');
		}
	};
	
	RakkaUIControlBar.prototype.onRakkaStarted = function() {
		this.$toggle
			.text('Stop')
			.removeClass('btn-success')
			.addClass('btn-danger');
		this.$reverse.prop('disabled', false).removeClass('disabled');
	};
	
	RakkaUIControlBar.prototype.onRakkaStopped = function() {
		this.$toggle
			.text('Start')
			.removeClass('btn-danger')
			.addClass('btn-success');
	};
	
	RakkaUIControlBar.prototype.onRakkaReverseEnded = function() {
		this.trigger('rakka.direction.change', 1);
		this.trigger('rakka.stop');
		this.$reverse.prop('disabled', true).addClass('disabled');
	};
	
	RakkaUIControlBar.prototype.onRakkaSpeedChanged = function(speed) {
		if( !this.noSpeedUI ) {
			this.$speed.val(speed);
		}
	};
	
	RakkaUIControlBar.prototype.onSpeedChange = function(event) {
		this.trigger('rakka.speed.change', this.$speed.val());
		
		// Make sure no loop
		this.noSpeedUI = true;
		setTimeout(function() {
			this.noSpeedUi = false;
		}.bind(this), 25);
	};
	
	RakkaUIControlBar.prototype.onKeyDown = function(event) {
		var isControl = (event.ctrlKey || event.altKey) && !event.shiftKey;
		
		if( event.keyCode === 32 ) { // space
			return this.trigger('rakka.toggle');
		} else if( !isControl ) {
			return;
		}
		
		event.preventDefault();
		switch( event.keyCode ) {
			case 13: // enter
				this.onFullscreenClick(event);
				break;
			case 32: // space
				this.trigger('rakka.toggle');
				break;
			case 72: // h
				this.onAutoHideClick(event);
				break;
			case 80: // p
				this.trigger('rakka.toggle');
				break;
			case 82: // r
				this.trigger('rakka.direction.toggle');
				break;
			case 88: // x
				this.speedWithFactor(50);
				break;
			case 90: // z
				this.speedWithFactor(-50);
				break;
			case 187: // + (=)
				event.preventDefault();
				this.speedWithFactor(-50);
				break;
			case 189: // -
				event.preventDefault();
				this.speedWithFactor(-50);
				break;
		}
	};
	
	RakkaUIControlBar.prototype.onFullscreenClick = function(event) {
		toggleFullScreen();
	};
	
	RakkaUIControlBar.prototype.onAutoHideClick = function(event) {
		if( this.$autoHide.attr('data-state') === 'off' ) {
			this.$container.removeClass('rakka-no-auto-hide');
			this.$autoHide.attr('data-state', 'on')
				.text('Show controls');
		} else {
			this.$container.addClass('rakka-no-auto-hide');
			this.$autoHide.attr('data-state', 'off')
				.text('Hide controls');
		}
	};
	
	RakkaUIControlBar.prototype.onThemeChange = function(event) {
		this.trigger('rakka.ui.theme.change', $(event.target).val());
	};
	
	RakkaUIControlBar.prototype.speedWithFactor = function(delta) {
		var val = parseInt(this.$speed.val());
		val += Math.round(delta * this.speedFactor);
		this.$speed.val(val);
		this.onSpeedChange();
		
		this.speedFactor += 0.2;
		
		// Reset speed factor after a bit
		if( this.speedFactorTimeout ) {
			clearTimeout(this.speedFactorTimeout);
		}
		this.speedFactorTimeout = setTimeout(function() {
			this.speedFactor = 1;
		}.bind(this), 50);
	};
	
	
	
	function toggleFullScreen() {
	  if (!document.fullscreenElement &&    // alternative standard method
		  !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		if (document.documentElement.requestFullscreen) {
		  document.documentElement.requestFullscreen();
		} else if (document.documentElement.msRequestFullscreen) {
		  document.documentElement.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
		  document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
		  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	  } else {
		if (document.exitFullscreen) {
		  document.exitFullscreen();
		} else if (document.msExitFullscreen) {
		  document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
		  document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
		  document.webkitExitFullscreen();
		}
	  }
	}
	
	
	
	// Exports
	window.RakkaUIControlBar = RakkaUIControlBar;
	return RakkaUIControlBar;
}));
