
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
		show: 'all'
	};
	
	var RedditGenerator = function(options) {
		Generator.prototype.constructor.call(this, options);
		
		this.data = $.extend({}, defaultParams, options && options.data || {});
		this.data.limit = this.batchSize;
		
		if( !this.url ) {
			var sort = options && options.sort || 'new';
			this.data.t = (sort === 'top' ? 'all' : '');
			if( options.subreddit ) {
				this.url = 'https://www.reddit.com/r/' + options.subreddit + '/' + sort + '.json';
			} else {
				this.url = 'https://www.reddit.com/r/starshipporn/' + sort + '.json';
			}
		}
		
		this.useThumbnails = (options && options.useThumbnails);
		this.maxVideoId = undefined;
		this.lastRequestTs = 0;
	};
	
	RedditGenerator.prototype = Object.create(Generator.prototype);
	
	RedditGenerator.prototype.getBatch = function() {
		if( this.semaphore > 0 ) {
			return;
		}
		this.semaphore++;
		
		// Check time since last batch
		// https://github.com/reddit/reddit/wiki/API#rules
		var now = Date.now();
		if( now - this.lastRequestTs < 2000 ) {
			this.semaphore--;
			return this;
		}
		this.lastRequestTs = now;
		
		if( this.nextAfter ) {
			this.data.after = this.nextAfter;
		}
		
		var self = this;
		
		var fn = function(index, data) {
			var listing = data.data;
			var src;
			if( this.useThumbnails ) {
				if( !listing.thumbnail ) {
					return;
				}
				src = listing.thumbnail;
			} else {
				if( !listing.url || !listing.url.match(/\.(jpg|gif|png|jpeg)(\?|$)/i) ) {
					return;
				}
				src = listing.url;
			}
			self.loadImage(src, {
				label: listing.title,
				url: 'https://www.reddit.com' + listing.permalink,
				listing: listing
			});
		};
		
		$.ajax({
			url: this.url,
			data: this.data
		}).done(function(data) {
			self.nextAfter = data.data.after;
			$.each(data.data.children, fn);
			self.semaphore--;
		}).error(function() {
			self.semaphore--;
		});
		
		return this;
	};
	
	
	
	// Exports
	window.RakkaRedditGenerator = RedditGenerator;
	return RedditGenerator;
}));
