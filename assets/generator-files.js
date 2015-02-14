
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
	
	var FilesGenerator = function(options) {
		Generator.prototype.constructor.call(this, options);
		
		this.files = options.files;
		this.cursor = 0;
	};
	
	FilesGenerator.prototype = Object.create(Generator.prototype);
	
	FilesGenerator.prototype.addImage = function(img, extra) {
		this.images.push(new FilesImage(img, extra, this.imageIndex++));
		return this;
	};
	
	FilesGenerator.prototype.getBatch = function() {
		if( Utils.isCreateObjectUrlSupported() ) {
			this.getBatchObjectURL();
		} else {
			this.getBatchFileReader();
		}
	}
	
	FilesGenerator.prototype.getBatchObjectURL = function() {
		if( this.semaphore > 0 ) {
			return;
		}
		this.semaphore++;
		
		for( var i = 0; i < this.batchSize; i++, this.cursor++ ) {
			var file = this.files.item(this.cursor % this.files.length);
			if( ('' + file.type).indexOf('image/') !== 0 ) {
				continue;
			}
			
			var url = Utils.createObjectURL(file);
			this.loadImage(url, {
				file: file,
				label: file.name,
				objectURL: url,
				url: url
			});
		}
		
		this.semaphore--;
	};
	
	FilesGenerator.prototype.getBatchFileReader = function() {
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
				onlistclick: function() { window.open(result); },
				url: 'javascript:void(0)' //result
			};
			self.loadImage(result, extra);
		};
		
		var load = function(cursor, cb) {
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
				if( cb ) {
					cb();
				}
			};
			reader.onerror = function() {
				self.semaphore--;
				if( cb ) {
					cb();
				}
			};
			reader.readAsDataURL(file);
		};
		
		var fns = [];
		for( var i = 0; i < this.batchSize; i++, this.cursor++ ) {
			fns.push(load.bind(this, this.cursor % this.files.length));
		}
		
		this.semaphore++;
		this.interval = setInterval(Utils.bind(function() {
			var fn = fns.shift();
			if( fn ) {
				fn();
			} else {
				clearInterval(this.interval);
				this.interval = undefined;
				this.semaphore--;
			}
		}, this), 50);
		
		// End batch semaphore
		this.semaphore--;
	};
	
	
	
	function FilesImage() {
		Image.prototype.constructor.apply(this, arguments);
	};
	
	FilesImage.prototype = Object.create(Image.prototype);
	
	FilesImage.prototype.dispose = function() {
		if( this.extra && this.extra.objectURL ) {
			Utils.revokeObjectURL(this.extra.objectURL);
		}
		Image.prototype.dispose.call(this);
		return this;
	};
	
	
	
	// Exports
	window.RakkaFilesGenerator = FilesGenerator;
	return FilesGenerator;
}));
