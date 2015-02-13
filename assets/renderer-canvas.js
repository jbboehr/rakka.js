
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'rakka/utils'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaUtils
		);
    }
}(function($, Utils) {
	
	function RakkaRendererCanvas(options) {
		this.$container = options.container;
		this.debug = options.debug;
		this.log = options.log;
		this.maxDrawsPerFrame = options.maxDrawsPerFrame || 3;
		
		// Setup canvases
		this.$canvas = $('<canvas>').appendTo(this.$container);
		this.$circCanvas = $('<canvas>');
		//if( this.debug ) {
			this.$circCanvas.appendTo(this.$container);
		//}
		
		// Setup canvas contexts
		this.ctx = this.$canvas[0].getContext('2d');
		this.circCtx = this.$circCanvas[0].getContext('2d');
		
		// Setup vars
		this.redrawBacklog = [];
		this.partialDraws = [];
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
	
	RakkaRendererCanvas.prototype.draw = function(cursor, circCount, redraws) {
		this.cursor = cursor;
		this.circCount = circCount;
		
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
		// Copy partial draws into backlog
		var tmp;
		while(tmp = this.partialDraws.shift()) {
			if( !tmp ) {
				break;
			}
			this.redrawBacklog.push(tmp);
		}
		// Add leftover redraws to the backlog
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
		var isAtCursor = ( Utils.circCmp(image.cursor, image.circCount, '<=', this.cursor, this.circCount) &&
						   Utils.circCmp(image.nextCursor, image.nextCircCount, '>=', this.cursor, this.circCount) );
		var isAtEndOfCursor = false;
		
		// Draw the image
		var stopCursor, stopCircCount, startCursor, startCircCount;
		if( isAtCursor ) {
			// Draw up to the cursor
			startCursor = (image.lastDrawCursor || image.cursor);
			startCircCount = (image.lastDrawCircCount || image.circCount);
			stopCursor = this.cursor;
			stopCircCount = this.circCount;
			if( Utils.circCmp(stopCursor, stopCircCount, '>', image.nextCursor, image.nextCircCount) ) {
				stopCursor = image.nextCursor;
				stopCircCount = image.nextCircCount;
				isAtEndOfCursor = true;
			}
		} else {
			return; // @todo make sure this works for full redraws T_T
			
			// Draw the full image
			startCursor = image.cursor;
			startCircCount = image.circCount;
			stopCursor = image.nextCursor;
			stopCircCount = image.nextCircCount;
		}
		
		var needsSplit = ( stopCircCount > startCircCount );
		var sx, sy, sw, sh, dx, dy, dw, dh;
		dx = image.offset;
		sx = 0;
		dw = image.width;
		sw = image.originalWidth;
		
		if( !needsSplit ) {
			// Section 0 - full copy
			sy = 0;
			dy = startCursor;
			dh = stopCursor - startCursor;
			sh = Math.round(image.scaleFactor * dh);
			
			this.log('ImageSection0', sx, sy, sw, sh, dx, dy, dw, dh);
			ctx.drawImage(image.img, sx, sy, sw, sh, dx, dy, dw, dh);
		} else {
			
			// Section 1 - bottom section
			sy = 0;
			dh = circHeight - startCursor;
			sh = Math.round(image.scaleFactor * dh);
			dy = startCursor;
			
			this.log('ImageSection1', sx, sy, sw, sh, dx, dy, dw, dh);
			ctx.drawImage(image.img, sx, sy, sw, sh, dx, dy, dw, dh);
			
			// Section 2 - top section
			dy = 0;
			sy = Math.round(image.scaleFactor * (circHeight - startCursor));
			dh = stopCursor;
			sh = image.scaleFactor * dh;
			
			this.log('ImageSection2', sx, sy, sw, sh, dx, dy, dw, dh);
			ctx.drawImage(image.img, sx, sy, sw, sh, dx, dy, dw, dh);
		}
		
		if( !isAtEndOfCursor ) {
			// @todo fix if image gc'ed before finish drawing
			this.partialDraws.push(image);
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
