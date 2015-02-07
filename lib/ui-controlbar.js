
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
		this.rakka = options.rakka;
		this.$container = options.container;
	
		this.$element = $('<div>').addClass('rakka-ui-component rakka-ui-controlbar user-active force-show')
			.appendTo(this.$container);
		
		this.$toggle = $('<button>')
			.attr('class', 'btn btn-success')
			.attr('data-action', 'start')
			.text('Start')
			.on('click', this.onToggleClick.bind(this))
			.appendTo(this.$element);
		
		this.$reverse = $('<button>')
			.attr('class', 'btn btn-warning disabled')
			.attr('data-action', 'reverse')
			.prop('disabled', true)
			.text('Reverse')
			.on('click', this.onReverseClick.bind(this))
			.appendTo(this.$element);
		
		this.$fullscreen = $('<button>')
			.attr('class', 'btn btn-info')
			.attr('data-action', 'fullscreen')
			.text('Fullscreen')
			.on('click', this.onFullscreenClick.bind(this))
			.appendTo(this.$element);
		
		if( !this.isFullscreenSupported(this.$container[0]) ) {
			this.$fullscreen.addClass('disabled')
				.prop('disabled', true);
		}
		
		this.$speed = $('<input type="range">')
			.prop('min', 50)
			.prop('max', 2000)
			.val(this.rakka.speed())
			.on('change', this.onSpeedChange.bind(this))
			.appendTo(this.$element);
		
		this.$autoHide = $('<button>')
			.attr('class', 'btn btn-info')
			.attr('data-action', 'auto-hide')
			.attr('data-state', 'off')
			.text('Hide controls')
			.on('click', this.onAutoHideClick.bind(this))
			.appendTo(this.$element);
		
		
		// @todo dispose
		$(window).on('keydown', function(event) {
			switch( event.keyCode ) {
				case 32: // space
					this.onToggleClick(event);
					break;
				case 70: // f
					this.onFullscreenClick(event);
					break;
				case 72: // h
					this.onAutoHideClick(event);
					break;
				case 88: // x
					var prev = parseInt(this.$speed.val());
					prev += 50;
					this.$speed.val(prev);
					this.onSpeedChange(event);
					break;
				case 90: // z
					var prev = parseInt(this.$speed.val());
					prev -= 50;
					this.$speed.val(prev);
					this.onSpeedChange(event);
					break;
			}
			console.log(event);
		}.bind(this));
	};
	
	RakkaUIControlBar.prototype.isFullscreenSupported = function(elem) {
		return (elem.requestFullscreen || 
				elem.msRequestFullscreen ||
				elem.mozRequestFullScreen ||
				elem.webkitRequestFullscreen ? true : false);
	};
	
	
	RakkaUIControlBar.prototype.onToggleClick = function(event) {
		if( this.$toggle.attr('data-action') === 'start' ) {
			this.rakka.start();
			this.$toggle.attr('data-action', 'stop')
				.text('Stop')
				.removeClass('btn-success')
				.addClass('btn-danger');
		} else {
			this.rakka.stop();
			this.$toggle.attr('data-action', 'start')
				.text('Start')
				.removeClass('btn-danger')
				.addClass('btn-success');
		}
	};
	
	RakkaUIControlBar.prototype.onReverseClick = function(event) {
		alert('Not yet implemented');
	};
	
	RakkaUIControlBar.prototype.onFullscreenClick = function(event) {
		var elem = this.$container[0];
		if( elem.requestFullscreen ) {
			elem.requestFullscreen();
		} else if( elem.msRequestFullscreen ) {
			elem.msRequestFullscreen();
		} else if( elem.mozRequestFullScreen ) {
			elem.mozRequestFullScreen();
		} else if( elem.webkitRequestFullscreen ) {
			elem.webkitRequestFullscreen();
		} else {
			// Not supported
		}
	};
	
	RakkaUIControlBar.prototype.onSpeedChange = function(event) {
		this.rakka.speed(this.$speed.val());
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
	
	RakkaUIControlBar.prototype.userActive = function(state) {};
	
	
	// Exports
	window.RakkaUIControlBar = RakkaUIControlBar;
	return RakkaUIControlBar;
}));
