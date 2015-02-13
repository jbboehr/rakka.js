
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {
	
	var RakkaImage = function(img, extra, index) {
		this.img = img;
		this.extra = extra;
		this.label = extra && extra.label || undefined;
		this.url = extra && extra.url || undefined;
		this.index = index;
		this.originalWidth = img.width;
		this.originalHeight = img.height;
	};
	
	RakkaImage.prototype.dispose = function() {
		delete this.img;
		return this;
	};

	RakkaImage.prototype.resize = function(columnWidth, columnHeight) {
		this.columnWidth = columnWidth;
		this.columnHeight = columnHeight;
		this.width = columnWidth;
		this.height = Math.round(this.originalHeight * columnWidth / this.originalWidth);
	};
	
	RakkaImage.prototype.reposition = function(offset, cursor, circCount) {
		this.offset = offset;
		
		// Calculate and assign the cursor
		this.cursor = cursor;
		this.circCount = circCount;
		
		if( this.cursor < 0 ) {
			this.cursor += this.columnHeight;
			this.circCount--;
		}
		
		// Calculate and assign the next cursor
		this.nextCursor = this.cursor + this.height;
		this.nextCircCount = this.circCount;
		
		if( this.nextCursor >= this.columnHeight ) {
			this.nextCursor -= this.columnHeight;
			this.nextCircCount++;
		}
	};
	
	
	
	// Exports
	window.RakkaImage = RakkaImage;
	return RakkaImage;
}));
