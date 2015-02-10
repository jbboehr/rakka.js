
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {

	var Column = function(options) {
		this.ctx = options.ctx;
		this.consume = (options && options.consume);
		this.index = (options && options.index);
		this.log = (options && options.log);
		
		// Setup bus
		this.bus = options.bus;
		this.bus.proxy(this);
		
		this.images = [];
		
		this.nextCursor = 0;
		this.nextCircCount = 0;
		
		if( options.width && options.height ) {
			this.resize(options.width, options.height);
		}
	};

	Column.prototype.resize = function(width, height) {
		this.newHeightFactor = height / this.height;
		this.width = width;
		this.height = height;
		this.offset = this.index * this.width;
		
		// Resize images in buffer >.>
		for( var x in this.images ) {
			this.images[x].resize(this.width);
		}
		
		// Redraw?
		this.redraw();
		
		this.log("Column", this.index, this.offset, this.width, this.height, this.lastDeltaHeight);
		return this;
	};

	Column.prototype.fill = function(cursor, circCount, direction) {
		var ctx = this.ctx;
		do {
			// Preload an image if we don't already have one
			var image;
			if( !this.nextImage ) {
				this.nextImage = this.consume();
				if( !this.nextImage ) {
					// If we can't get a new image, skip adjusting cursor for now
					return false;
				}
			}
			image = this.nextImage;
			image.resize(this.width);
			
			//this.log('CIRC', this.index, this.circCount, this.nextCircCount);
			//this.log('CUR', this.index, this.cursor, this.nextCursor);
			
			// Skip if cursor is behind nextCursor
			if( circCount < this.nextCircCount ) {
				break;
			} else if( circCount == this.nextCircCount && cursor < this.nextCursor ) {
				break;
			}
			
			// Draw the image to the buffer
			var newNextCursor = this.nextCursor + image.height;
			var newNextCircCount = this.nextCircCount;
			if( newNextCursor > this.height ) {
				newNextCircCount++;
				newNextCursor -= this.height;
			}
			
			// Add to the image stack and set the cursor/circ/fresh
			image.cursor = this.nextCursor;
			image.nextCursor = newNextCursor;
			image.circCount = this.nextCircCount;
			image.nextCircCount = newNextCircCount;
			image.columnIndex = this.index;
			image.fresh = true;
			this.images.push(image);
			
			this.trigger('rakka.image.new', image);
			
			// Draw
			this.drawImage(image);
			
			// Assign the new cursor/circcount
			this.nextCursor = newNextCursor;
			this.nextCircCount = newNextCircCount;
			this.nextImage = undefined;
		} while(1);
		
		return true;
	};
	
	Column.prototype.gc = function() {
		// Garbage collect the images
		var gced = false;
		while( this.images.length ) {
			var i = this.images[0];
			var d = this.nextCircCount - i.circCount;
			if( d >= 2 || (d === 1 && i.cursor < this.nextCursor) ) {
				gced = true;
				this.trigger('rakka.image.gc', i);
				this.images.shift();
			} else {
				break;
			}
		}
		return gced;
	};
	
	Column.prototype.drawImage = function(image) {
		var ctx = this.ctx;
		var needsSplit = ( image.nextCircCount > image.circCount );
		
		// Draw the image
		// @todo maybe reduce the size of the copy?
		ctx.drawImage(image.img, this.offset, image.cursor, this.width, image.height);
		if( needsSplit ) {
			// If it needs a split, draw to the top as well
			ctx.drawImage(image.img, this.offset, image.cursor - this.height, this.width, image.height);
		}
		
		// Draw the URL
		if( true ) { // @todo add setting?
			var text = '#' + image.index;
			var size = 24;
			var padding = 4;
			ctx.font = size + "px bold verdana, sans-serif";
			ctx.textBaseline = 'middle';
			var tm = ctx.measureText(text);
			ctx.globalAlpha = 0.75;
			ctx.fillStyle = '#999999'; //'#5bc0de'; //"#ffffff";
			ctx.fillRect(this.offset, image.cursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
			ctx.strokeStyle = '#909090'; //'#46b8da'; //'#000000';
			ctx.strokeRect(this.offset, image.cursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#ffffff'; //"#088080";
			ctx.fillText(text, this.offset + padding, Math.round(image.cursor + (size / 2) + padding + 1));
		}
	};
	
	Column.prototype.redraw = function() {
		// Need to redraw all images in the buffer
		var prevCursor = null;
		var prevCircCount = null;
		for( var i = this.images.length - 1; i >= 0; i-- ) {
			var image = this.images[i];
			if( prevCursor === null ) {
				prevCursor = Math.round(image.nextCursor * this.newHeightFactor); // fear
				prevCircCount = image.nextCircCount;
			}
			image.offset = this.offset;
			// Pacth the image next cursor
			image.nextCursor = prevCursor;
			image.nextCircCount = prevCircCount;
			// Patch the image cursor
			image.cursor = image.nextCursor - image.height;
			image.circCount = image.nextCircCount;
			if( image.cursor < 0 ) {
				image.cursor += this.height;
				image.circCount--;
			}
			this.drawImage(image);
			prevCursor = image.cursor;
			prevCircCount = image.circCount;
		}
	};
	
	
	
	// Exports
	window.RakkaColumn = Column;
	return Column;
}));
