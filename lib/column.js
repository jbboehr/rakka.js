
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
			this.ctx.drawImage(image.img, this.offset, this.nextCursor, this.width, image.height);
			if( needsSplit ) {
				// If it needs a split, draw to the top as well
				this.ctx.drawImage(image.img, this.offset, this.nextCursor - this.height, this.width, image.height);
			}
			
			// Add to the image stack and set the cursor/circ/fresh
			image.cursor = this.nextCursor;
			image.circCount = this.nextCircCount;
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