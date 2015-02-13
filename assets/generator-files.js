
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'./image',
			'./generator',
			'./utils'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.RakkaImage,
			window.RakkaGenerator,
			window.RakkaUtils
		);
    }
}(function($, Image, Generator, Utils) {
	
	var defaultParams = {
		order : 'video_id',
		direction : 'DESC',
		//maxVideoId : maxVideoId,
		moderated : 1,
		nsfw: 0,
		private: 0
	};
	
	var FilesGenerator = function(options) {
		Generator.prototype.constructor.call(this, options);
		
		this.fileList = options.files;
		this.cursor = 0;
		this.files = [];
		for( var i = 0, l = this.fileList.length; i < l; i++ ) {
			this.files[i] = this.fileList.item(i);
		}
	};
	
	FilesGenerator.prototype = Object.create(Generator.prototype);
	
	FilesGenerator.prototype.addImage = function(img, extra) {
		this.images.push(new FilesImage(img, extra, this.imageIndex++));
		return this;
	};
	
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
			var file = this.files[cursor];
			if( !file ) {
				self.semaphore--;
				return;
			}
			self.semaphore++;
			var reader = new FileReader();
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
	
	
	
	function FilesImage() {
		Image.prototype.constructor.apply(this, arguments);
	};
	
	FilesImage.prototype = Object.create(Image.prototype);
	
	FilesImage.prototype.dispose = function() {
		if( this.objectURL ) {
			revokeObjectURL(this.objectURL);
		}
		Image.prototype.dispose.call(this);
		return this;
	};
	
	
	
	// Exports
	window.RakkaFilesGenerator = FilesGenerator;
	return FilesGenerator;
}));
