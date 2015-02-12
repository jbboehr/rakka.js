
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
		this.redraws = [];
		
		this.nextCursor = 0;
		this.nextCircCount = 0;
		
		if( options.width && options.height ) {
			this.resize(options.width, options.height);
		}
	};

	Column.prototype.resize = function(width, height) {
		this.newHeightFactor = (this.height ? height / this.height : null);
		this.width = width;
		this.height = height;
		this.offset = this.index * this.width;
		if( this.nextCursor ) {
			this.nextCursor = Math.round(this.nextCursor * this.newHeightFactor);
		}
		
		// Resize images in buffer
		for( var x in this.images ) {
			this.images[x].resize(this.width, this.height);
		}
		
		// Reposition
		this.reposition();
		
		this.log("Column", this.index, this.offset, this.width, this.height, this.lastDeltaHeight);
		return this;
	};

	Column.prototype.fill = function(cursor, circCount, direction) {
		var okay = true;
		this.inFill = true;
		
		do {
			// Skip if cursor is behind nextCursor
			if( circCount < this.nextCircCount ) {
				break;
			} else if( circCount == this.nextCircCount && cursor < this.nextCursor ) {
				break;
			}
			
			// Preload an image if we don't already have one
			var image = this.consume();
			if( !image ) {
				// If we can't get a new image, skip adjusting cursor for now
				okay = false;
				break;
			}
			
			// Assign the column index
			image.columnIndex = this.index;
			
			// Resize the image to fit within our size
			image.resize(this.width, this.height);
			
			// Reposition the image
			image.reposition(this.offset, this.nextCursor, this.nextCircCount);
			
			// Save the next cursor
			this.nextCursor = image.nextCursor;
			this.nextCircCount = image.nextCircCount;
			
			// Mark the image for redraw and add to the image stack
			this.redraws.push(image);
			this.images.push(image);
			
			// Trigger the new image event
			this.trigger('rakka.image.new', image);
			
			// Draw
			//this.drawImage(image);
			
		} while(1);
		
		this.inFill = false;
		return okay;
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
	
	Column.prototype.reposition = function() {
		// Need to reposition all images in the buffer
		var prevCursor = null;
		var prevCircCount = null;
		var firstCursor = null;
		var firstCircCount = null;
		
		for( var i = this.images.length - 1; i >= 0; i-- ) {
			var image = this.images[i];
			if( prevCursor === null ) {
				firstCursor = prevCursor = Math.round(image.nextCursor * this.newHeightFactor);
				firstCircCount = prevCircCount = image.nextCircCount;
			}
			
			// Make sure we don't wrap around the buffer
			var d = firstCircCount - prevCircCount;
			if( d >= 2 || (d === 1 && prevCursor - image.height < firstCursor) ) {
				break;
			}
			
			// Reposition and mark for redraw
			image.reposition(this.offset, prevCursor - image.height, prevCircCount);
			
			// Mark for redraw
			this.redraws.push(image);
			
			// Save cursor for next loop
			prevCursor = image.cursor;
			prevCircCount = image.circCount;
		}
	};
	
	
	
	// Exports
	window.RakkaColumn = Column;
	return Column;
}));
