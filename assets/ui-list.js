
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
		
		// Setup bus
		this.bus = options.bus;
		this.bus.proxy(this);
		
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
		this.bind();
	};
	
	RakkaUIList.prototype.bind = function() {
		this.on('rakka.image.gc', this.onImageGc.bind(this));
		this.on('rakka.image.new', this.onImageNew.bind(this));
		//this.rakka.on('fill', this.onFill.bind(this));
	};
	
	RakkaUIList.prototype.onImageGc = function(image) {
		if( image.index in this.listItems ) {
			var listItem = this.listItems[image.index];
			listItem.remove();
			delete this.listItems[image.index];
		} else {
			// Try to remove manually?
			var found = $('rakka-img-info-' + image.index);
			if( 'console' in window && 'warn' in console ) {
				console.warn('Missing image for gc: ', image.index);
				console.warn('Alt lookup: ', found[0]);
			}
			found.remove();
		}
	};
	
	RakkaUIList.prototype.onImageNew = function(image) {
		var list = this.lists[image.columnIndex];
		var listItem = $('<li>').appendTo(list);
		var label = (image.label || image.url || '');
		var labelShort = (label.length > 8 ? label.substr(0, 8) + '…' : label);
		var text = ('(#' + image.index) + ') ' + labelShort;
		var href = '' + (image.url || image.img.src || 'javavscript:void(0)');
		var link = $('<a>')
			.text(text)
			.attr('title', label)
			.attr('href', href)
			.attr('target', '_blank')
			.attr('id', 'rakka-img-info-' + image.index)
			.appendTo(listItem);
		this.listItems[image.index] = listItem;
	};
	
	RakkaUIList.prototype.onFill = function(payload) {
	};
	
	
	
	// Exports
	window.RakkaUIList = RakkaUIList;
	return RakkaUIList;
}));
