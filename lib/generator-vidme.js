
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
	
	var defaultParams = {
		order : 'video_id',
		direction : 'DESC',
		limit : 100,
		//maxVideoId : maxVideoId,
		moderated : 1,
		nsfw: 0,
		private: 0
	};
	
	var VidmeGenerator = function(options) {
		this.init(options);
		this.data = $.extend({}, defaultParams, options && options.data || {});
		if( !this.url ) {
			this.url = 'https://api.vid.me/videos/list';
		}
		this.maxVideoId = undefined;
	};
	
	VidmeGenerator.prototype = new Generator();
	
	VidmeGenerator.prototype.getBatch = function() {
		if( this.semaphore > 0 ) {
			return;
		}
		this.semaphore++;
		
		if( this.maxVideoId ) {
			this.data.maxVideoId = this.maxVideoId;
		}
		
		var self = this;
		
		var fn = function(index, video) {
			var id = parseInt(video.video_id);
			if( self.maxVideoId === undefined || id < self.maxVideoId ) {
				self.maxVideoId = id;
			}
			var src = video.thumbnail_url;
			self.loadImage(src, video);
		};
		
		$.ajax({
			url: this.url,
			data: this.data
		}).done(function(data) {
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
