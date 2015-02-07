
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {

	var Column = function(index, ctx, consume, log) {
		this.index = index;
		this.ctx = ctx;
		this.consume = consume;
		this.log = log;
		
		this.nextCursor = 0;
		this.nextCircCount = 0;
		
		/*if( width && height ) {
			this.resize(width, height);
		}*/
	};

	Column.prototype.resize = function(width, height) {
		this.width = width;
		this.height = height;
		this.offset = this.index * this.width;
		this.images = [];
		
		this.log("Column", this.index, this.offset, this.width, this.height);
		return this;
	};

	Column.prototype.fill = function(cursor, circCount) {
		var newImages = [];
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
			var needsSplit = false;
			if( newNextCursor > this.height ) {
				newNextCircCount++;
				newNextCursor -= this.height;
				needsSplit = true;
			}
			
			// Draw the image
			ctx.drawImage(image.img, this.offset, this.nextCursor, this.width, image.height);
			if( needsSplit ) {
				// If it needs a split, draw to the top as well
				ctx.drawImage(image.img, this.offset, this.nextCursor - this.height, this.width, image.height);
			}
			
			// Draw the URL
			if( true ) { // @todo add setting?
				var text = '#' + image.index;
				var size = 24;
				var padding = 4;
				ctx.font = size + "px bold verdana, sans-serif";
				ctx.textBaseline = 'middle';
				var tm = this.ctx.measureText(text);
				ctx.globalAlpha = 0.75;
				ctx.fillStyle = '#999999'; //'#5bc0de'; //"#ffffff";
				ctx.fillRect(this.offset, this.nextCursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
				ctx.strokeStyle = '#909090'; //'#46b8da'; //'#000000';
				ctx.strokeRect(this.offset, this.nextCursor, Math.min(image.width, tm.width + padding * 2), size + padding * 2);
				ctx.globalAlpha = 1;
				ctx.fillStyle = '#ffffff'; //"#088080";
				ctx.fillText(text, this.offset + padding, Math.round(this.nextCursor + (size / 2) + padding + 1));
			}
			
			// Add to the image stack and set the cursor/circ/fresh
			image.cursor = this.nextCursor;
			image.circCount = this.nextCircCount;
			image.columnIndex = this.index;
			this.images.push(image);
			
			// Set fresh and assign to the list of new images
			image.fresh = true;
			newImages.push(image);
			
			// Assign the new cursor/circcount
			this.nextCursor = newNextCursor;
			this.nextCircCount = newNextCircCount;
			this.nextImage = undefined;
		} while(1);
		
		
		return newImages;
	};
	
	Column.prototype.gc = function() {
		// Garbage collect the images
		var gcImages = [];
		while( this.images.length ) {
			var i = this.images[0];
			var d = this.nextCircCount - i.circCount;
			if( d >= 2 || (d === 1 && i.cursor < this.nextCursor) ) {
				gcImages.push(this.images.shift());
			} else {
				break;
			}
		}
		return gcImages;
	};
	
	Column.prototype.draw = function() {

	};
	
	
	
	// Exports
	window.RakkaColumn = Column;
	return Column;
}));