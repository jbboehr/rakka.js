
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
		//maxVideoId : maxVideoId,
		moderated : 1,
		nsfw: 0,
		private: 0
	};
	
	var FilesGenerator = function(options) {
		this.init(options);
		this.fileList = options.files;
		this.cursor = 0;
		this.files = [];
		for( var i = 0, l = this.fileList.length; i < l; i++ ) {
			this.files[i] = this.fileList.item(i);
		}
	};
	
	FilesGenerator.prototype = new Generator();
	
	FilesGenerator.prototype.getBatch = function() {
		if( this.semaphore > 0 ) {
			return;
		}
		this.semaphore++;
		
		var self = this;
		var fn = function(result, file) {
			var extra = {
				result: result,
				file: file,
				label: file.name,
				url: result // @todo think this is causing a problem, convert to event?
			};
			self.loadImage(result, extra);
		};
		var load = function(cursor) {
			console.log(cursor, this.files);
			var file = this.files[cursor];
			if( !file ) {
				self.semaphore--;
				return;
			}
			var reader = new FileReader();
			self.semaphore++;
			reader.onload = function() {
				fn(reader.result, file);
				self.semaphore--;
			};
			reader.onerror = function() {
				self.semaphore--;
			};
			reader.readAsDataURL(file);
		}.bind(this);
			
		for( var i = 0; i < this.batchSize; i++, this.cursor++ ) {
			load(this.cursor % this.files.length);
		}
		self.semaphore--;
	};
	
	
	
	// Exports
	window.RakkaFilesGenerator = FilesGenerator;
	return FilesGenerator;
}));
