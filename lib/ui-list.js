
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery'
		], factory);
    } else {
        factory(
			window.jQuery
		);
    }
}(function($) {
	
	function RakkaUIList(options) {
		this.rakka = options.rakka;
		this.$container = options.container;
		
		this.$element = $('<div>').addClass('rakka-ui-component rakka-ui-list')
			.appendTo(this.$container);
		
		// Setup vars
		this.listItems = {};
		this.lists = [];
		
		// Setup columns?
		for( var i = 1; i <= this.rakka.nColumns; i++ ) {
			this.lists.push($('<ul>').attr('data-index', '' + i).appendTo(this.$element));
		}
		
		// Bind events
		this.rakka.on('fill', this.onFill.bind(this));
	};
	
	RakkaUIList.prototype.onFill = function(payload) {
		var x;
		
		// Remove gc images first
		for( x in payload.gcImages ) {
			var image = payload.gcImages[x];
			if( !(image.index in this.listItems) ) {
				if( console && 'warn' in console ) {
					console.warn('Missing image for gc: ', image.index);
				}
				continue;
			}
			var listItem = this.listItems[image.index];
			listItem.remove();
			delete this.listItems[image.index];
		}
		
		// Add new images
		for( x in payload.images ) {
			var image = payload.images[x];
			var list = this.lists[image.columnIndex];
			var listItem = $('<li>').appendTo(list);
			var text = ('(#' + image.index) + ') ' + (image.label || image.url || '');
			var href = '' + (image.url || image.img.src || 'javavscript:void(0)');
			var link = $('<a>')
				.text(text)
				.attr('href', href)
				.attr('target', '_blank')
				.appendTo(listItem);
			this.listItems[image.index] = listItem;
		}
	};
	
	RakkaUIList.prototype.userActive = function(state) {};
	
	// Exports
	window.RakkaUIList = RakkaUIList;
	return RakkaUIList;
}));
