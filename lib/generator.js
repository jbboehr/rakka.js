
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
		this.init(options);
	};
	
	Generator.prototype.init = function(options) {
		this.url = (options && options.url) || undefined;
		this.cacheSize = (options && options.cacheSize) || 100;
		this.cacheBust = (options && options.cacheBust) || undefined;
		this.mirror = (options && options.mirror);
		this.images = [];
		this.imageIndex = 0;
		this.semaphore = 0;
	};
	
	Generator.prototype.resize = function(columnWidth, columnHeight) {
		this.columnWidth = columnWidth;
		this.columnHeight = columnHeight;
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
	
	Generator.prototype.loadImage = function loadImage(src, extra) {
		this.semaphore++;
		
		var self = this;
		
		function done(event) {
			self.semaphore--;
			if( event.type === 'load' ) {
				self.images.push(new RakkaImage(img, extra, self.imageIndex++));
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
	};
	
	Generator.prototype.getBatch = function() {
		throw new Error('getBatch should be implemented by descendant');
	};
	
	
	
	// Exports
	window.RakkaGenerator = Generator;
	return Generator;
}));
