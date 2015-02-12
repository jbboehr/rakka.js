
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
	
	function RakkaRendererCanvas(options) {
		this.$container = options.container;
		this.debug = options.debug;
		this.log = options.log;
		this.maxDrawsPerFrame = options.maxDrawsPerFrame || 3;
		
		// Setup canvases
		this.$canvas = $('<canvas>').appendTo(this.$container);
		this.$circCanvas = $('<canvas>');
		//if( this.debug ) {
		//	this.$circCanvas.appendTo(this.$container);
		//}
		
		// Setup canvas contexts
		this.ctx = this.$canvas[0].getContext('2d');
		this.circCtx = this.$circCanvas[0].getContext('2d');
		
		// Setup vars
		this.redrawBacklog = [];
	}
	
	RakkaRendererCanvas.prototype.resize = function(width, height, bufferHeight) {
		this.width = width;
		this.height = height;
		
		this.$canvas
			.width(this.width)
			.height(this.height)
			.prop('width', this.width)
			.prop('height', this.height);
		this.log('Canvas Dimensions', this.width, this.height);
		
		this.circWidth = this.width;
		this.circHeight = bufferHeight;
		this.$circCanvas
			.width(this.circWidth)
			.height(this.circHeight)
			.prop('width', this.circWidth)
			.prop('height', this.circHeight);
		this.log('Circular Buffer Dimensions', this.circWidth, this.circHeight);
		
		// Fill the circularbuffer with transparent pixels
		this.circCtx.fillStyle = "rgba(0, 0, 0, 1)";
		this.circCtx.fillRect(0, 0, this.circWidth, this.circHeight);
	};
	
	RakkaRendererCanvas.prototype.draw = function(cursor, redraws) {
		this.drawCircularBuffer(redraws);
		this.drawMainBuffer(cursor);
	};
	
	RakkaRendererCanvas.prototype.drawCircularBuffer = function(redraws) {
		var max = this.maxDrawsPerFrame + 10;
		var i;
		var l = redraws.length;
		var l2 = this.redrawBacklog.length;
		while(max--) {
			if( l > 0 ) {
				this.drawCircularBufferImage(redraws.shift());
				l--;
				continue;
			} else if( l2 > 0 ) {
				this.drawCircularBufferImage(this.redrawBacklog.shift());
				l2--;
			}
		}
		for( i = 0, l = redraws.length; i < l; i++ ) {
			this.redrawBacklog.push(redraws.shift());
		}
		
		/*
		for( i = 0, l = redraws.length; i < l; i++, max-- ) {
			if( max ) {
				this.drawCircularBufferImage(redraws.shift());
			} else {
				this.redrawBacklog.push(redraws.shift());
			}
		}
		for( i =  0, l = this.redrawBacklog.length; i < l && max > 0; i++, max-- ) {
			this.drawCircularBufferImage(this.redrawBacklog.shift());
		}
		console.log(this.maxDrawsPerFrame - Math.max(max, 0));
		*/
	};
	
	RakkaRendererCanvas.prototype.drawCircularBufferImage = function(image) {
		var ctx = this.circCtx;
		var circHeight = this.circHeight;
		var needsSplit = ( image.nextCircCount > image.circCount );
		
		// Draw the image
		// @todo maybe reduce the size of the copy?
		ctx.drawImage(image.img, image.offset, image.cursor, image.width, image.height);
		if( needsSplit ) {
			// If it needs a split, draw to the top as well
			ctx.drawImage(image.img, image.offset, image.cursor - circHeight, image.width, image.height);
		}
		
		// Draw the label
		var text = '#' + image.index;
		var size = 24;
		var padding = 4;
		ctx.font = size + "px bold verdana, sans-serif";
		ctx.textBaseline = 'middle';
		var tm = ctx.measureText(text);
		ctx.globalAlpha = 0.75;
		ctx.fillStyle = '#999999';
		ctx.fillRect(image.offset, image.cursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
		ctx.strokeStyle = '#909090';
		ctx.strokeRect(image.offset, image.cursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
		ctx.globalAlpha = 1;
		ctx.fillStyle = '#ffffff';
		ctx.fillText(text, image.offset + padding, Math.round(image.cursor + (size / 2) + padding + 1));
	};
	
	RakkaRendererCanvas.prototype.drawMainBuffer = function(cursor) {
		// Copy the circular buffer onto the canvas
		var sx, sy, sw, sh, dx, dy, dw, dh;
		
		// Source/Destination with is always main width, x is always 0
		dw = sw = this.width;
		dx = sx = 0;
		
		// If cursor > height, then there's only one copy necessary
		if( cursor >= this.height ) {
			// Copy: sy = cursor - height, sh = height
			sy = cursor - this.height;
			dh = sh = this.height;
			dy = 0;
			
			this.log('Section0', sx, sy, sw, sh, dx, dy, dw, dh);
			this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
		} else {
			// Copy: sy = 0, sh = cursor
			sy = 0;
			dh = sh = cursor;
			dy = this.height - cursor;
			
			if( cursor > 0 ) {
				this.log('Section1', sx, sy, sw, sh, dx, dy, dw, dh);
				this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
			}
			
			// Copy: sy = circHeight - (height - cursor)
			sy = this.circHeight - (this.height - cursor);
			dh = sh = this.height - cursor;
			dy = 0;
			
			this.log('Section2', sx, sy, sw, sh, dx, dy, dw, dh);
			this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
		}
	};
	
	// Exports
	window.RakkaRendererCanvas = RakkaRendererCanvas;
	return RakkaRendererCanvas;
}));
