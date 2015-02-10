
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
	
	function RakkaUIStats(options) {
		this.$container = options.container;
		
		// Setup bus
		this.bus = options.bus;
		this.bus.proxy(this);
		
		// Render
		this.render();
		
		// Bind events
		this.bind();
		
		// Start loop
		this.start();
		this.loop();
	}
	
	RakkaUIStats.prototype.bind = function() {
		this.on('rakka.stats', this.onStats.bind(this));
	};
	
	RakkaUIStats.prototype.render = function() {
		this.$element = $('<div>').addClass('rakka-ui-component rakka-ui-stats')
			.appendTo(this.$container);
		
		this.$imagesLoading = $('<div>')
			.text('Images loading: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$imagesPreloaded = $('<div>')
			.text('Images in preload cache: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$imagesConsumed = $('<div>')
			.text('Images consumed: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$delay = $('<div>')
			.text('Delay: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$speed = $('<div>')
			.text('Speed: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$dropped = $('<div>')
			.text('Dropped Frames: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
		
		this.$dims = $('<div>')
			.text('Canvas/Buffer Size: ')
			.append('<span class="val">')
			.appendTo(this.$element)
			.find('span');
	};
	
	RakkaUIStats.prototype.loop = function() {
		this.trigger('rakka.stats.emit');
	};
	
	RakkaUIStats.prototype.onStats = function(stats) {
		this.$imagesLoading.text(stats.imagesLoading);
		this.$imagesPreloaded.text(stats.imagesPreloaded);
		this.$imagesConsumed.text(stats.imagesConsumed);
		this.$delay.text(stats.delay);
		this.$speed.text(stats.speed);
		this.$dropped.text(stats.droppedFrames);
		this.$dims.text(stats.canvasWidth + 'x' + stats.canvasHeight  + ' / ' +
						stats.circCanvasWidth + 'x' + stats.circCanvasHeight);
	};
	
	
	RakkaUIStats.prototype.start = function() {
		if( this._interval ) {
			return;
		}
		this._interval = setInterval(this.loop.bind(this), 500);
	};
	
	RakkaUIStats.prototype.stop = function() {
		if( !this._interval ) {
			return;
		}
		clearInterval(this._interval);
		this._interval = null;
	};
	
	
	// Exports
	window.RakkaUIStats = RakkaUIStats;
	return RakkaUIStats;
}));