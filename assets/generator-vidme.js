
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./image',
			'./generator'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaImage,
			window.RakkaGenerator
		);
    }
}(function($, Image, Generator) {
	
	var defaultParams = {};
	
	var VidmeGenerator = function(options) {
		Generator.prototype.constructor.call(this, options);
		
		this.data = $.extend({}, defaultParams, options && options.data || {});
		this.data.limit = this.batchSize;
		this.url = this.makeUrl(options);
		this.maxVideoId = undefined;
		this.cacheBust = 1;
		this.offset = 0;
	};
	
	VidmeGenerator.prototype = Object.create(Generator.prototype);
	
	VidmeGenerator.prototype.makeUrl = function(options) {
		if( options && options.url ) {
			return options.url;
		} else if( !options ) {
			this.useMaxVideoId = true;
			return 'https://api.vid.me/videos/list';
		}
		var feed = options.feed;
		var channel = options.channel;
		var order = options.order;
		var url = 'https://api.vid.me/';
		if( feed === 'channel' ) {
			url += 'channel/' + channel + '/' + order;
		} else if( feed === 'frontpage' ) {
			url += 'videos/frontpage/' + order;
		} else if( order === 'hot' ) {
			url += 'videos/hot';
		} else {
			this.useMaxVideoId = true;
			url += 'videos/list';
		}
		
		return url;
	};
	
	VidmeGenerator.prototype.getBatch = function() {
		if( this.semaphore > 0 ) {
			return;
		}
		this.semaphore++;
		
		// Check time since last batch
		var now = Date.now();
		if( now - this.lastRequestTs < 2000 ) {
			this.semaphore--;
			return this;
		}
		this.lastRequestTs = now;
		
		// Check the paging parameter to use
		if( this.useMaxVideoId ) {
			if( this.maxVideoId ) {
				this.data.maxVideoId = this.maxVideoId;
			}
		} else {
			if( this.offset ) {
				this.data.offset = this.offset;
			}
		}
		
		var self = this;
		
		var fn = function(index, video) {
			var id = parseInt(video.video_id);
			if( self.maxVideoId === undefined || id < self.maxVideoId ) {
				self.maxVideoId = id;
			}
			var src = video.thumbnail_url;
			video.label = video.url;
			video.url = video.full_url;
			self.loadImage(src, video);
		};
		
		$.ajax({
			url: this.url,
			data: this.data
		}).done(function(data) {
			self.offset += data.videos.length;
			$.each(data.videos, fn);
			self.semaphore--;
		}).error(function() {
			self.semaphore--;
		});
	};
	
	
	
	// Exports
	window.RakkaVidmeGenerator = VidmeGenerator;
	return VidmeGenerator;
}));
