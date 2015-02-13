
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./image'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaImage
		);
    }
}(function($, RakkaImage) {
	
	/* Interface for generators */
	
	var Generator = function(options) {
		this.url = (options && options.url) || undefined;
		this.batchSize = (options && options.batchSize) || 25;
		this.cacheSize = (options && options.cacheSize) || 100;
		this.cacheBust = (options && options.cacheBust) || undefined;
		this.mirror = (options && options.mirror);
		this.images = [];
		this.imageIndex = 0;
		this.semaphore = 0;
		
		// Setup events
		if( options.bus ) {
			this.bus = options.bus;
			this.bus.proxy(this);
		}
	};
	
	Generator.prototype.resize = function(columnWidth, columnHeight) {
		this.columnWidth = columnWidth;
		this.columnHeight = columnHeight;
		return this;
	}
	
	Generator.prototype.consume = function consume() {
		if( this.images.length < this.cacheSize ) {
			this.getBatch();
		}
		if( this.images.length ) {
			return this.images.shift();
		}
	};
	
	Generator.prototype.count = function() {
		return this.images.length;
	};
	
	Generator.prototype.addImage = function(img, extra) {
		this.images.push(new RakkaImage(img, extra, this.imageIndex++));
		return this;
	};
	
	Generator.prototype.loadImage = function loadImage(src, extra) {
		this.semaphore++;
		
		var self = this;
		
		function done(event) {
			self.semaphore--;
			if( event.type === 'load' ) {
				self.addImage(this, extra);
			}
		};
		
		if( this.cacheBust ) {
			src += (src.indexOf('?') === -1 ? '?' : '&') + this.cacheBust;
		}
		
		if( this.mirror ) {
			src = this.mirror + (this.mirror.indexOf('?') === -1 ? '?' : '&') + 'url=' + encodeURIComponent(src);
			if( this.columnWidth && this.columnHeight ) {
				src += '&width=' + this.columnWidth;
				src += '&height=' + this.columnHeight;
				src += '&mode=inside';
			}
		}
		
		var img = new Image();
		//img.crossOrigin = "anonymous";
		img.onload = done;
		img.onerror = done;
		img.src = src;
		
		return this;
	};
	
	Generator.prototype.getBatch = function() {
		throw new Error('getBatch should be implemented by descendant');
	};
	
	
	
	// Exports
	window.RakkaGenerator = Generator;
	return Generator;
}));
