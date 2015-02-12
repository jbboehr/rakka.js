
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {
	
	function Bus() {
		this._events = {};
	}
	
	Bus.prototype.on = function(name, cb, ctx) {
		if( !(name in this._events) ) {
			this._events[name] = [];
		}
		this._events[name].push({
			cb : cb,
			ctx : ctx
		});
		return this;
	};
	
	Bus.prototype.one = function(name, cb, ctx) {
		if( !(name in this._events) ) {
			this._events[name] = [];
		}
		this._events[name].push({
			cb : cb,
			ctx : ctx,
			once : true
		});
		return this;
	};
	
	Bus.prototype.off = function(name, cb) {
		var i, ev;
		
		if( !(name in this._events) ) {
			return this;
		}
		
		i = this._events[name].length;
		while( i-- ) {
			ev = this._events[name][i];
			if( cb === undefined || cb === ev.cb ) {
				this._events[name].splice(i, 1);
			}
		}
		
		return this;
	};
	
	Bus.prototype.triggerSync = function(name, args, async) {
		var i, ev;
		
		if( !(name in this._events) ) {
			return this;
		}
		
		if( !(args instanceof Array) ) {
			args = [args];
		}
		
		i = this._events[name].length;
		while( i-- ) {
			ev = this._events[name][i];
			var cb = ev.cb;
			
			//console.log(name, i, cb, args);
			
			// Run the callback
			if( async || ev.async ) {
				setTimeout(function() {
					this.apply(null, args);
				}.bind(cb), 0);
			} else {
				cb.apply(null, args);
			}
			
			// Remove if once
			if( ev.once ) {
				this._events[name].splice(i, 1);
			}
		}
		
		return this;
	};
	
	Bus.prototype.trigger = function(name, args, async) {
		var self = this;
		setTimeout(function() {
			self.triggerSync(name, args, true);
		}, 0);
	};
	
	Bus.prototype.proxy = function(object) {
		object.on = function(name, cb) {
			this.on(name, cb, object);
		}.bind(this);
		object.one = function(name, cb) {
			this.one(name, cb, object);
		}.bind(this);
		object.off = this.off.bind(this);
		object.trigger = this.trigger.bind(this);
		return this;
	};
	
	Bus.prototype.detach = function(object) {
		// @todo maybe replace with an empty function
		delete object.on;
		delete object.one;
		delete object.off;
		delete object.trigger;
		for( var x in this._events ) {
			var i = this._events[x].length;
			while( i-- ) {
				ev = this._events[x][i];
				if( ev.ctx === object ) {
					this._events[x].splice(i, 1);
				}
			}
		}
		return this;
	};
	
	
	
	// Exports
	window.RakkaBus = Bus;
	return Bus;
}));
