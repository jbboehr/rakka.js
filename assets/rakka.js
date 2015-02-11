
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define('rakka/rakka', [
			'jquery',
			'./bus',
			'./column',
			'./image',
			'./renderer-canvas',
			'./renderer-three'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaBus,
			window.RakkaColumn,
			window.RakkaImage,
			window.RakkaRendererCanvas,
			window.RakkaRendererThree
		);
    }
}(function($, Bus, Column, Image, CanvasRenderer, ThreeRenderer) {

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
		this.consume = function() {
			var i = this.generator.consume();
			if( i ) {
				this.imagesConsumed++;
			}
			return i;
		}.bind(this);
		
		// Setup renderer
		var Renderer = ThreeRenderer; //CanvasRenderer;
		this.renderer = new Renderer({
			bufferSize: this._bufferSize,
			bus: this.bus,
			container: this.$container,
			debug: this.debug,
			log: this.log
		});
		
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
				width : self.width,
				height : self.height,
				bufferWidth : self.width,
				bufferHeight : self.bufferHeight,
			};
			self.trigger('rakka.stats', stats);
		});
	};
	
	
	// Loop
	
	Rakka.prototype.loop = function() {
		this.incrCursorOkay = true;
		this.calculate();
		this.draw();
	};
	
	Rakka.prototype.calculate = function() {
		this.calculateDelta();
		this.calculateColumns();
		this.calculateCursor();
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
	
	Rakka.prototype.calculateColumns = function() {
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
		for( var x in this.columns ) {
			var column = this.columns[x];
			for( var i = 0, l = column.redraws.length; i < l; i++ ) {
				redraws.push(column.redraws[i]);
			}
			column.redraws = [];
		}
		this.renderer.draw(this.cursor, redraws);
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
		this.bufferHeight = this.height * this._bufferSize;
		
		// Calc column width
		this.columnWidth = Math.floor(this.width / this.nColumns);
		
		// Resize generator (for mirror)
		this.generator.resize(this.columnWidth, this.height);
		
		// Adjust cursor
		if( newHeightFactor ) {
			this.cursor = Math.round(this.cursor * newHeightFactor);
		}
		
		// Resize the columns
		for( var i = 0; i < this.columns.length; i++ ) {
			this.columns[i].resize(this.columnWidth, this.bufferHeight);
		}
		
		// Resize renderer
		this.renderer.resize(this.width, this.height);
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
