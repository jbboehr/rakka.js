
requirejs.config({
	packages: [{
		name: 'rakka',
		location: '../assets',
		main: 'rakka'
	}],
	paths: {
		bootstrap: '../node_modules/bootstrap/dist/js/bootstrap',
		eventEmitter: '../node_modules/wolfy87-eventemitter/EventEmitter',
		jquery: '../node_modules/jquery/dist/jquery'
	},
	shim: {
		bootstrap: {
			deps: ['jquery']
		}
	}
});

requirejs([
	'jquery',
	'rakka',
	'rakka/ui',
	'rakka/generator-reddit',
	'rakka/generator-vidme',
	'bootstrap'
], function(
	$,
	Rakka,
	RakkaUI,
	RakkaRedditGenerator,
	RakkaVidmeGenerator
) {
	// Check if we're in node-webkit and try to start the mirror
	var isNodeWebkit = typeof process === 'object' && 'versions' in process && 'node-webkit' in process.versions;
	var mirrorUrl;
	if( isNodeWebkit && !global.mirror ) {
		global.mirror = require('../bin/mirror');
		var portfinder = require('portfinder');
		portfinder.getPort(function(err, port) {
			if( !err ) {
				global.mirror.listen(port);
				mirrorUrl = 'http://localhost:' + port + '/mirror';
			}
		});
	} else if( ('' + window.location).match(/localhost:3000/) ) {
		mirrorUrl = 'http://localhost:3000/mirror';
	}
	
	var nColumns = 3;
	var bufferSize = 4;
	
	function start(generator) {
		$('.static-modal-wrapper').remove();
		$('#container').removeClass('hide');
		
		/*var*/ 
		/*var*/ rakka = new Rakka({
			bufferSize : bufferSize,
			columns : nColumns,
			container : $('#container'),
			generator : generator,
			speed : 100,
			debug : false
		});
		/* ui */ ui = new RakkaUI({
			bus: rakka.bus,
			rakka: rakka,
			container: $('body'),
			controlBar: true,
			list: true,
			stats: true,
			theme: 'dark'
		});
		$(window).on('resize', function() {
			rakka.resize();
		});
		rakka.start();
	}
	
	function startSource(source) {
		if( source == 'vidme' ) {
			$('.js-vidme-configure').removeClass('hide');
			return true;
		} else if( source == 'reddit' ) {
			$('.js-reddit-configure').removeClass('hide');
			return true;
			
		} else {
			return;
		}
		start(generator);
		return true;
	}
	
	function onReady() {
		$(document).one('click', '.js-reddit-configure .js-example-start', function() {
			nColumns = parseInt($('.js-reddit-configure input[name="columns"]').val()) || 3;
			bufferSize = parseInt($('.js-vidme-configure input[name="bufferSize"]').val()) || 4;
			/*var*/ generator = new RakkaRedditGenerator({
				mirror: mirrorUrl,
				subreddit: $('#subreddit').val(),
				sort: $('#reddit-sort').val() || 'new'
			});
			start(generator);
		});
		
		$(document).one('click', '.js-vidme-configure .js-example-start', function() {
			nColumns = parseInt($('.js-vidme-configure input[name="columns"]').val()) || 3;
			bufferSize = parseInt($('.js-vidme-configure input[name="bufferSize"]').val()) || 4;
			/*var*/ generator = new RakkaVidmeGenerator({
				mirror: mirrorUrl
			});
			start(generator);
		});
		
		$(document).on('input', 'input[name="columns"]', function(event) {
			var el = $(event.target);
			el.parent().find('.input-group-addon').text(el.val());
		});
		
		$(document).on('input', 'input[name="bufferSize"]', function(event) {
			var el = $(event.target);
			el.parent().find('.input-group-addon').text(el.val() + 'x');
		});
		
		$(document).on('click', '.js-source-select', function(event) {
			var el = $(event.target);
			if( startSource(el.attr('data-source')) ) {
				$('#selector').remove();
			}
		});
	}
	
	$(onReady);
	
});

