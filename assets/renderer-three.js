
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
			'jquery',
			'three'
		], factory);
    } else {
        factory(
			window.jQuery,
			window.THREE
		);
    }
}(function($, THREE) {
	
	function RakkaRendererThree(options) {
		this._bufferSize = options.bufferSize;
		this.$container = options.container;
		this.debug = options.debug;
		this.log = options.log;
		
		this.bus = options.bus;
		this.bus.proxy(this);
		
		this.initialized = false;
		this.sprites = {};
		this.spritesSplit = {};
		
		this.on('rakka.image.gc', this.onImageGc.bind(this));
	}
	
	RakkaRendererThree.prototype.resize = function(width, height) {
		this.width = width;
		this.height = height;
		this.circHeight = this.height * this._bufferSize;
		
		if( !this.initialized ) {
			this.initialized = true;
			this.init();
		}
		
		this.renderer.setSize(this.width, this.height);
	};
	
	RakkaRendererThree.prototype.init = function() {
		//this.camera = new THREE.OrthographicCamera(0, this.width, this.height, 0, 1, 1000);
		this.camera = new THREE.OrthographicCamera(- this.width * 0, this.width * 2, this.height, -this.height * this._bufferSize, 1, 10);
		//this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );
		this.camera.position.z = 5;
		
		this.renderer = new THREE.WebGLRenderer();
		//this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.$container.append(this.renderer.domElement);
		
		this.scene = new THREE.Scene();
		
		var animate = function() {
			requestAnimationFrame(animate);
			this.render();
		}.bind(this);
		animate();
	};
	
	RakkaRendererThree.prototype.render = function() {
		this.renderer.clear();
		this.renderer.clearDepth();
		this.renderer.render(this.scene, this.camera);
	};
	
	RakkaRendererThree.prototype.draw = function(cursor, redraws) {
		for( var x in redraws ) {
			var image = redraws[x];
			var needsSplit = ( image.nextCircCount > image.circCount );
			var fudge = Math.round(image.width / 2);
			
			var texture = new THREE.Texture(image.img);
			texture.needsUpdate = true;
			var material = new THREE.SpriteMaterial({
				map: texture
			});
			var sprite = new THREE.Sprite(material);
			console.log('SPRITE', image.offset + fudge, -image.cursor, 1);
			sprite.scale.set(image.width, image.height, 1);
			sprite.position.set(image.offset + fudge, -image.cursor, 1);
			this.scene.add(sprite);
			
			// Split
			var sprite2 = new THREE.Sprite(material);
			var y = image.cursor + this.circHeight / 2;
			if( y > this.circHeight ) {
				y -= this.circHeight;
			}
			console.log("SPRITE2", this.width + image.offset + fudge, -y, 1);
			sprite2.scale.set(image.width, image.height, 1);
			sprite2.position.set(this.width + image.offset + fudge, -y, 1);
			this.scene.add(sprite2);
			
			this.sprites[image.index] = sprite;
			this.spritesSplit[image.index] = sprite2;
		}
		
		var cx, cy;
		var h2 = this.height / 2;
		var qc = (this.circHeight / 4);
		if( cursor < (qc - h2) || cursor > (3 * qc - h2) ) {
			cx = this.width;
			cy = - ((cursor + this.circHeight / 2) % this.circHeight);
		} else {
			cx = 0;
			cy = -cursor;
		}
		console.log(cx, cy, cx + this.width, this.height + cy);
		if( true ) {
			this.camera.left = cx;
			this.camera.right = cx + this.width;
			this.camera.top = this.height + cy;
			this.camera.bottom = cy;
			this.camera.updateProjectionMatrix();
		}
	}
	
	RakkaRendererThree.prototype.onImageGc = function(image) {
		if( image.index in this.sprites ) {
			var sprite = this.sprites[image.index];
			this.scene.remove(sprite);
			this.scene.remove(this.spritesSplit[image.index]);
			delete this.sprites[image.index];
			delete this.spritesSplit[image.index];
		}
	}
	
	// Exports
	window.RakkaRendererThree = RakkaRendererThree;
	return RakkaRendererThree;
}));
