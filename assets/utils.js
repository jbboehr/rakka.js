
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {
	
	/**
	 * Compare two circ cursors.
	 * If cmp is not specified: 1 if A > B, -1 if A < B, or zero if A == B
	 * If cmp is specified: true or false
	 * 
	 * @return Integer|Boolean
	 */
	function circCmp(yA, ccA, cmp, yB, ccB) {
		if( arguments.length < 5 ) {
			ccB = yB;
			yB = cmp;
			cmp = undefined;
		}
		var v;
		if( ccB != ccA ) { // Compare circ
			v = ccB > ccA ? -1 : 1;
		} else if( yB == yA ) { // Compare cursor
			v = 0;
		} else {
			v = yB > yA ? -1 : 1;
		}
		if( !cmp ) {
			return v;
		}
		switch( cmp ) {
			case '==': return (v === 0);
			case '!=': return (v !== 0);
			case '>=': return (v >= 0);
			case '<=': return (v <= 0);
			case '>': return (v > 0);
			case '<': return (v < 0);
		}
		return v;
	}
	
	
	
	// Bind
	var bind = function(f, context) {
		if( typeof context === 'string' ) {
			var t = f[context];
			context = f;
			f = t;
		}
		return function() {
			return f.apply(context, arguments);
		}
    };
	var bindToWindow = function(f) {
		return bind(f, window);
	};
	Function.prototype.rakkaSimpleBind = function(context) {
		var f = this;
		return function() {
			return f.apply(context, arguments);
		}
	};
	
	
	
	// requestAnimationFrame polyfill
	// Based on: https://gist.github.com/paulirish/1579671
	var requestAnimationFrame = window.requestAnimationFrame;
	var cancelAnimationFrame = window.cancelAnimationFrame;
	(function() {
		var lastTime = 0;
		var vendors = ['ms', 'moz', 'webkit', 'o'];
		for(var x = 0; x < vendors.length && !requestAnimationFrame; ++x) {
			requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
			cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
									   || window[vendors[x]+'CancelRequestAnimationFrame'];
		}
		
		if( !requestAnimationFrame ) {
			var timeToCallDelta = 0;
			var timeToCallTarget = 1000 / 60;
			requestAnimationFrame = function(callback, element) {
				var currTime = Date.now();
				var timeToCall = Math.max(0, Math.round(16 - (currTime - lastTime) + timeToCallDelta));
				var id = window.setTimeout(function() {
					lastTime = Date.now();
					var timeToCallActual = lastTime - currTime;
					timeToCallDelta += (timeToCallTarget - timeToCallActual);
					callback(lastTime);
				}, timeToCall);
				return id;
			};
		} else {
			requestAnimationFrame = bindToWindow(requestAnimationFrame);
		}
	 
		if( !cancelAnimationFrame ) {
			cancelAnimationFrame = function(id) {
				lastTime = 0;
				clearTimeout(id);
			};
		} else {
			cancelAnimationFrame = bindToWindow(cancelAnimationFrame);
		}
	}());
	
	
	
	// URL compat
	var createObjectURL = bindToWindow(window.URL && window.URL.createObjectURL || function() {});
	var revokeObjectURL = bindToWindow(window.URL && window.URL.revokeObjectURL || function() {});
	function isCreateObjectUrlSupported() {
		return (window.URL && window.URL.createObjectURL ? true : false);
	}
	
	
	
	// Exports
	var RakkaUtils = {
		bind: bind,
		bindToWindow: bindToWindow,
		circCmp: circCmp,
		requestAnimationFrame: requestAnimationFrame,
		cancelAnimationFrame: cancelAnimationFrame,
		createObjectURL: createObjectURL,
		revokeObjectURL: revokeObjectURL,
		isCreateObjectUrlSupported: isCreateObjectUrlSupported
	};
	window.RakkaUtils = RakkaUtils;
	return RakkaUtils;
}));
