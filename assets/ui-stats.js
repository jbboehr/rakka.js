
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
		this.rakka = options.rakka;
		this.$container = options.container;
		
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
		
		// Start interval
		this.start();
	};
	
	RakkaUIStats.prototype.loop = function() {
		this.$imagesLoading.text(this.rakka.generator.semaphore);
		this.$imagesPreloaded.text(this.rakka.generator.count());
		this.$imagesConsumed.text(this.rakka.imagesConsumed);
		this.$delay.text(this.rakka.delay);
		this.$speed.text(this.rakka._speed);
		this.$dropped.text(Math.round(this.rakka.droppedFrames));
		this.$dims.text(this.rakka.$canvas.width() + 'x' + this.rakka.$canvas.height() + ' / ' +
						this.rakka.$circCanvas.width() + 'x' + this.rakka.$circCanvas.height());
	}
	
	RakkaUIStats.prototype.start = function() {
		if( this._interval ) {
			return;
		}
		this._interval = setInterval(this.loop.bind(this), 250);
	};
	
	RakkaUIStats.prototype.stop = function() {
		if( !this._interval ) {
			return;
		}
		clearInterval(this._interval);
		this._interval = null;
	};
	
	RakkaUIStats.prototype.userActive = function(state) {
		this._userActive = state;
	};
	
	
	// Exports
	window.RakkaUIStats = RakkaUIStats;
	return RakkaUIStats;
}));