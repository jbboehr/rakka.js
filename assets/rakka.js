
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('rakka/rakka', [
			'jquery',
			'./bus',
			'./column',
			'./image'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaBus,
			window.RakkaColumn,
			window.RakkaImage
		);
    }
}(function($, Bus, Column, Image) {

	var Rakka = function(options) {
		this.init(options);
	};
	
	Rakka.prototype.init = function init(options) {
		// Setup options
		this._bufferSize = (options && options.bufferSize) || 4;
		this.debug = (options && options.debug) || false;
		this.delay = (options && options.delay) || 10;
		this.nColumns = (options && options.columns) || 6;
		this._speed = (options && options.speed) || 500;
		
		// Setup event bus
		this.bus = (options && options.bus) || new Bus();
		this.bus.proxy(this);
		this.bind();
		
		// Setup generator
		this.generator = options.generator;
		this.consume = function() {
			var i = this.generator.consume();
			if( i ) {
				this.imagesConsumed++;
			}
			return i;
		}.bind(this);
		
		// Setup log
		this.log = this.debug ? function() {
			console.log.apply(console, arguments);
		} : function() {};
		
		// Setup elements
		this.$container = options.container;
		this.$canvas = $('<canvas>').appendTo(this.$container);
		this.$circCanvas = $('<canvas>');
		if( this.debug ) {
			this.$circCanvas.appendTo(this.$container);
		}
		
		// Setup canvas contexts
		this.ctx = this.$canvas[0].getContext('2d');
		this.circCtx = this.$circCanvas[0].getContext('2d');
		
		/*
		this.circCtx.mozImageSmoothingEnabled = false;
		this.circCtx.webkitImageSmoothingEnabled = false;
		this.circCtx.msImageSmoothingEnabled = false;
		this.circCtx.imageSmoothingEnabled = false;
		*/
		
		// Setup vars
		this.cursor = 0;
		this.circCount = 0;
		this._direction = 1;
		this.interval = null;
		this._events = {};
		this.maxCursor = 0;
		this.maxCircCount = 0;
		
		// Setup stats
		this.droppedFrames = 0;
		this.imagesConsumed = 0;
		
		// Setup columns
		this.columns = [];
		for( var i = 0; i < this.nColumns; i++ ) {
			this.columns[i] = new Column({
				bus : this.bus,
				ctx : this.circCtx,
				consume : this.consume,
				index : i,
				log : this.log
			});
		}
		
		// Resize
		this.resize();
	};
	
	Rakka.prototype.bind = function() {
		var self = this;
		
		this.on('rakka.start', this.start.bind(this));
		this.on('rakka.stop', this.stop.bind(this));
		this.on('rakka.toggle', this.toggle.bind(this));
		this.on('rakka.direction.change', this.direction.bind(this));
		this.on('rakka.direction.toggle', this.directionToggle.bind(this));
		this.on('rakka.speed.change', this.speed.bind(this));
		
		this.on('rakka.speed.emit', function() {
			self.trigger('rakka.speed.changed', self._speed);
		});
		this.on('rakka.stats.emit', function() {
			var stats = {
				imagesLoading : self.generator.semaphore,
				imagesPreloaded : self.generator.count(),
				imagesConsumed : self.imagesConsumed,
				delay : self.delay,
				speed : self._speed,
				droppedFrames : Math.round(self.droppedFrames),
				canvasWidth : self.$canvas.width(),
				canvasHeight : self.$canvas.height(),
				circCanvasWidth : self.$circCanvas.width(),
				circCanvasHeight : self.$circCanvas.height(),
			};
			self.trigger('rakka.stats', stats);
		});
	};
	
	
	// Loop
	
	Rakka.prototype.loop = function() {
		this.incrCursorOkay = true;
		this.calculateDelta();
		this.fillCircularBuffer();
		this.draw();
		this.adjustCursor();
	};
	
	Rakka.prototype.calculateDelta = function() {
		// Delta time
		var now = Date.now();
		if( this.lastTs ) {
			this.deltaTs = now - this.lastTs;
		} else {
			this.deltaTs = 0;
		}
		this.lastTs = now;
		
		// Dropped frames (inaccurate?)
		this.currentDroppedFrames = Math.max(0, (this.deltaTs - 1) / this.delay - 1);
		this.droppedFrames += this.currentDroppedFrames;
		
		// Delta pixels
		this.deltaPixels = Math.round(this._direction * this.deltaTs * this._speed / 1000);
		
		this.log('Delta ts/px', this.deltaTs, this.deltaPixels);
	};
	
	Rakka.prototype.fillCircularBuffer = function() {
		if( this._direction === -1 ) {
			return;
		}
		for( var i = 0, l = this.columns.length; i < l ; i++ ) {
			var col = this.columns[i];
			var newImages = col.fill(this.cursor, this.circCount);
			if( newImages === false ) {
				this.incrCursorOkay = false;
			}
			col.gc();
		}
	};
	
	Rakka.prototype.draw = function() {
		// Copy the circular buffer onto the canvas
		var sx, sy, sw, sh, dx, dy, dw, dh;
		
		// Source/Destination with is always main width, x is always 0
		dw = sw = this.width;
		dx = sx = 0;
		
		// If cursor > height, then there's only one copy necessary
		if( this.cursor >= this.height ) {
			// Copy: sy = cursor - height, sh = height
			sy = this.cursor - this.height;
			dh = sh = this.height;
			dy = 0;
			
			this.log('Section0', sx, sy, sw, sh, dx, dy, dw, dh);
			this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
		} else {
			// Copy: sy = 0, sh = cursor
			sy = 0;
			dh = sh = this.cursor;
			dy = this.height - this.cursor;
			
			this.log('Section1', sx, sy, sw, sh, dx, dy, dw, dh);
			this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
			
			// Copy: sy = circHeight - (height - cursor)
			sy = this.circHeight - (this.height - this.cursor);
			dh = sh = this.height - this.cursor;
			dy = 0;
			
			this.log('Section2', sx, sy, sw, sh, dx, dy, dw, dh);
			this.ctx.drawImage(this.$circCanvas[0], sx, sy, sw, sh, dx, dy, dw, dh);
		}
	};
	
	Rakka.prototype.adjustCursor = function() {
		if( !this.incrCursorOkay ) {
			return;
		}
		if( this._direction === -1 ) {
			var d = this.maxCircCount - this.circCount;
			if( d >= 2 ||  (d === 1 && this.cursor < this.maxCursor - this.height) ) {
				this.trigger('rakka.reverse.ended');
				return;
			}
		}
		
		this.cursor += this.deltaPixels;
		if( this.cursor > this.circHeight ) {
			this.cursor -= this.circHeight;
			this.circCount++;
		} else if( this.cursor < 0 ) {
			this.cursor += this.circHeight;
			this.circCount--;
		}
		
		this.maxCursor = Math.max(this.maxCursor, this.cursor);
		this.maxCircCount = Math.max(this.maxCircCount, this.circCount);
		
		this.log('Main Cursor', this.cursor, this.circCount);
	};
	
	
	
	// State changes
	
	Rakka.prototype.direction = function(direction) {
		direction = (direction < 0 ? -1 : 1);
		// Unchanged
		if( direction === this._direction ) {
			return this;
		}
		// Change
		this._direction = direction;
		
		this.trigger('rakka.direction.changed', this._direction);
		
		return this;
	};
	
	Rakka.prototype.directionToggle = function() {
		if( this._direction === -1 ) {
			this._direction = 1;
		} else {
			this._direction = -1;
		}
		
		this.trigger('rakka.direction.changed', this._direction);
		
		return this;
	};
	
	Rakka.prototype.speed = function(speed) {
		if( speed === undefined ) {
			return this._speed;
		} else {
			// @todo adjust loop delay?
			this._speed = speed;
			this.trigger('rakka.speed.changed', this._speed);
			return this;
		}
	};
	
	Rakka.prototype.resize = function() {
		var width = this.$container.width();
		var height = this.$container.height();
		var newHeightFactor;
		
		if( this.height ) {
			newHeightFactor = height / this.height;
		}
		
		this.width = width;
		this.height = height;
		this.$canvas
			.width(this.width)
			.height(this.height)
			.prop('width', this.width)
			.prop('height', this.height);
		this.log('Canvas Dimensions', this.width, this.height);
		
		this.circWidth = this.width;
		// @todo maybe calculate this based on nColumns and expected image aspect ratio
		this.circHeight = this.height * this._bufferSize;
		this.$circCanvas
			.width(this.circWidth)
			.height(this.circHeight)
			.prop('width', this.circWidth)
			.prop('height', this.circHeight);
		this.log('Circular Buffer Dimensions', this.circWidth, this.circHeight);
		
		// Calc column width
		this.columnWidth = Math.floor(this.circWidth / this.nColumns);
		
		// Resize generator (for mirror)
		this.generator.resize(this.columnWidth, this.height);
		
		// Adjust cursor
		if( newHeightFactor ) {
			this.cursor = Math.round(this.cursor * newHeightFactor);
		}
		
		// Fill the circularbuffer with transparent pixels
		this.circCtx.fillStyle = "rgba(0, 0, 0, 1)";
		this.circCtx.fillRect(0, 0, this.circWidth, this.circHeight);
		
		// Resize the columns
		for( var i = 0; i < this.columns.length; i++ ) {
			this.columns[i].resize(this.columnWidth, this.circHeight);
		}
	};
	
	Rakka.prototype.start = function start() {
		if( this.interval ) {
			return;
		}
		
		this.interval = setInterval(this.loop.bind(this), this.delay);
		
		// fire event
		this.bus.trigger('rakka.started');
		
		return this;
	};
	
	Rakka.prototype.stop = function stop() {
		if( !this.interval ) {
			return;
		}
		
		clearInterval(this.interval);
		this.interval = undefined;
		
		// Clear timer
		this.lastTs = 0;
		
		// fire event
		this.bus.trigger('rakka.stopped');
		
		return this;
	};
	
	Rakka.prototype.toggle = function toggle() {
		if( this.interval ) {
			this.stop();
		} else {
			this.start();
		}
	};
	
	
	// Exports
	window.Rakka = Rakka;
	return Rakka;
}));
