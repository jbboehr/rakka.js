
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('rakka/rakka', [
			'jquery',
			'./bus',
			'./column',
			'./image',
			'./renderer-canvas',
			'./utils'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaBus,
			window.RakkaColumn,
			window.RakkaImage,
			window.RakkaRendererCanvas,
			window.RakkaUtils
		);
    }
}(function($, Bus, Column, Image, CanvasRenderer, Utils) {
	
	var Rakka = function(options) {
		this.init(options);
	};
	
	Rakka.prototype.init = function init(options) {
		// Setup options
		this._bufferSize = (options && options.bufferSize) || 4;
		this.debug = (options && options.debug) || false;
		this.nColumns = (options && options.columns) || 3;
		this._speed = (options && options.speed) || 500;
		
		this.$container = options.container;
		
		// Setup log
		this.log = this.debug ? function() {
			console.log.apply(console, arguments);
		} : function() {};
		
		// Setup event bus
		this.bus = (options && options.bus) || new Bus();
		this.bus.proxy(this);
		this.bind();
		
		// Setup generator
		this.generator = options.generator;
		this.consume = Utils.bind(function() {
			var i = this.generator.consume();
			if( i ) {
				this.imagesConsumed++;
			}
			return i;
		}, this);
		
		// Setup renderer
		this.renderer = new CanvasRenderer({
			bus: this.bus,
			container: this.$container,
			debug: this.debug,
			log: this.log,
			maxDrawsPerFrame: this.nColumns * 4
		});
		
		// Setup vars
		this.cursor = 0;
		this.circCount = 0;
		this._direction = 1;
		this.deltaPixelsAdjust = 0;
		this.fps = null;
		this.fpsSmooth = null;
		this.interval = null;
		this._events = {};
		this.maxCursor = 0;
		this.maxCircCount = 0;
		
		// Setup stats
		this.droppedFrames = 0;
		this.imagesConsumed = 0;
		
		// Setup columns
		this._columns = [];
		this.columns(this.nColumns);
		
		// Resize
		this.resize();
	};
	
	Rakka.prototype.bind = function() {
		var self = this;
		
		this.on('rakka.start', Utils.bind(this.start, this));
		this.on('rakka.stop', Utils.bind(this.stop, this));
		this.on('rakka.toggle', Utils.bind(this.toggle, this));
		this.on('rakka.direction.change', Utils.bind(this.direction, this));
		this.on('rakka.direction.toggle', Utils.bind(this.directionToggle, this));
		this.on('rakka.speed.change', Utils.bind(this.speed, this));
		
		this.on('rakka.setBufferSize', Utils.bind(this.bufferSize, this));
		this.on('rakka.setColumns', Utils.bind(this.columns, this));
		
		this.on('rakka.speed.emit', Utils.bind(function() {
			this.trigger('rakka.speed.changed', this._speed);
		}, this));
		
		this.on('rakka.stats.emit', Utils.bind(function() {
			var stats = {
				imagesLoading : this.generator.semaphore,
				imagesPreloaded : this.generator.count(),
				imagesConsumed : this.imagesConsumed,
				fps : this.fps,
				fpsSmooth : this.fpsSmooth,
				speed : this._speed,
				width : this.width,
				height : this.height,
				bufferWidth : this.width,
				bufferHeight : this.bufferHeight,
			};
			this.trigger('rakka.stats', stats);
		}, this));
		
		this.$container.on('click', Utils.bind(function(event) {
			var absY = this.cursor - (this.height - event.offsetY);
			var image = this.getImageAtPosition(event.offsetX, absY);
			if( image ) {
				this.trigger('rakka.image.click', image);
			}
		}, this));
	};
	
	Rakka.prototype.getImageAtPosition = function(x, y) {
		for( var i = 0, l = this._columns.length; i < l ; i++ ) {
			var col = this._columns[i];
			if( col.offset > x || col.offset + col.width < x ) {
				continue;
			}
			return col.getImageAtPosition(y, this.circCount);
		}
	};
	
	
	// Loop
	
	Rakka.prototype.loop = function(ts) {
		this.incrCursorOkay = true;
		this.calculateDelta(ts);
		this.calculateColumns();
		this.calculateCursor();
		this.draw();
		
		this.interval = Utils.requestAnimationFrame(Utils.bind(this.loop, this));
	};
	
	Rakka.prototype.calculateDelta = function(ts) {
		// Delta time
		if( !ts ) {
			ts = Date.now();
		}
		if( this.lastTs ) {
			this.deltaTs = ts - this.lastTs;
		} else {
			this.deltaTs = 0;
		}
		this.lastTs = ts;
		
		// If deltaTs is larger than a second, abort otherwise it gets jumpy
		if( this.deltaTs > 1000 || this.deltaTs <= 0 ) {
			return;
		}
		
		// Frames per second
		var smoothFactor = 0.2
		this.fps = 1000 / this.deltaTs;
		this.fpsSmooth = smoothFactor * this.fps + (1 - smoothFactor) * this.fpsSmooth;
		
		// Delta pixels
		this.deltaPixelsFloat = this._direction * this.deltaTs * this._speed / 1000;
		this.deltaPixelsFloat -= this.deltaPixelsAdjust;
		this.deltaPixels = Math.round(this.deltaPixelsFloat);
		this.deltaPixelsAdjust = this.deltaPixels - this.deltaPixelsFloat;
		
		this.log('Delta ts/px', this.deltaTs, this.deltaPixels);
	};
	
	Rakka.prototype.calculateColumns = function() {
		if( this._direction === -1 ) {
			return;
		}
		for( var i = 0, l = this._columns.length; i < l ; i++ ) {
			var col = this._columns[i];
			var newImages = col.fill(this.cursor, this.circCount);
			if( newImages === false ) {
				this.incrCursorOkay = false;
			}
			col.gc();
		}
	};
	
	Rakka.prototype.calculateCursor = function() {
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
		if( this.cursor > this.bufferHeight ) {
			this.cursor -= this.bufferHeight;
			this.circCount++;
		} else if( this.cursor < 0 ) {
			this.cursor += this.bufferHeight;
			this.circCount--;
		}
		
		this.maxCursor = Math.max(this.maxCursor, this.cursor);
		this.maxCircCount = Math.max(this.maxCircCount, this.circCount);
		
		this.log('Main Cursor', this.cursor, this.circCount);
	};
	
	Rakka.prototype.draw = function() {
		// Pull everything out that needs a redraw
		var redraws = [];
		for( var x in this._columns ) {
			var column = this._columns[x];
			for( var i = 0, l = column.redraws.length; i < l; i++ ) {
				redraws.push(column.redraws[i]);
			}
			column.redraws = [];
		}
		this.renderer.draw(this.cursor, redraws);
	};
	
	
	
	
	// State changes
	
	Rakka.prototype.bufferSize = function(bufferSize) {
		if( bufferSize === undefined ) {
			return this._bufferSize;
		} else {
			this._bufferSize = bufferSize;
			this.resize();
			return this;
		}
	};
	
	Rakka.prototype.columns = function(columns) {
		this.nColumns = columns;
		
		var l = this._columns.length;
		if( columns > l ) {
			// Add new columns (to the right)
			var i = columns - l;
			while(i--) {
				var column = new Column({
					bus : this.bus,
					consume : this.consume,
					index : this._columns.length,
					log : this.log
				});
				this._columns.push(column);
				this.trigger('rakka.column.new', column);
			}
		} else if( columns < l ) {
			// Remove columns (from the right)
			var i = l - columns;
			while(i--) {
				var column = this._columns.pop();
				this.trigger('rakka.column.remove', column);
				column.dispose();
			}
		} else {
			return this;
		}
		this.resize();
		return this;
	};
	
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
		this.bufferHeight = this.height * this._bufferSize;
		
		// Calc column width
		this.columnWidth = Math.floor(this.width / this._columns.length);
		
		// Resize generator (for mirror)
		this.generator.resize(this.columnWidth, this.height);
		
		// Adjust cursor
		if( newHeightFactor ) {
			this.cursor = Math.round(this.cursor * newHeightFactor);
		}
		
		// Resize the columns
		for( var i = 0; i < this._columns.length; i++ ) {
			this._columns[i].resize(this.columnWidth, this.bufferHeight);
		}
		
		// Resize renderer
		this.renderer.resize(this.width, this.height, this.bufferHeight);
	};
	
	Rakka.prototype.start = function start() {
		if( this.interval ) {
			return;
		}
		
		this.interval = Utils.requestAnimationFrame(Utils.bind(this.loop, this));
		
		// fire event
		this.bus.trigger('rakka.started');
		
		return this;
	};
	
	Rakka.prototype.stop = function stop() {
		if( !this.interval ) {
			return;
		}
		
		//clearInterval(this.interval);
		Utils.cancelAnimationFrame(this.interval);
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
