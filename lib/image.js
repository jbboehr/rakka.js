
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(window.jQuery);
    }
}(function($) {
	
	var RakkaImage = function(img, extra, index, width) {
		this.img = img;
		this.extra = extra;
		this.label = extra && extra.label || undefined;
		this.url = extra && extra.url || undefined;
		this.index = index;
		this.originalWidth = img.width;
		this.originalHeight = img.height;
		if( width ) {
			this.resize(width);
		}
	};

	RakkaImage.prototype.resize = function(width) {
		this.width = width;
		this.height = Math.round(this.originalHeight * width / this.originalWidth);
	};
	
	
	
	// Exports
	window.RakkaImage = RakkaImage;
	return RakkaImage;
}));
