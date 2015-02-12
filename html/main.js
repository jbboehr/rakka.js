
requirejs.config({
	packages: [{
		name: 'rakka',
		location: '../assets',
		main: 'rakka'
	}],
	paths: {
		bootstrap: '../node_modules/bootstrap/dist/js/bootstrap',
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
	'rakka/bus',
	'rakka/ui',
	'rakka/generator-reddit',
	'rakka/generator-vidme',
	'bootstrap'
], function(
	$,
	Rakka,
	RakkaBus,
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
	
	function start(generator) {
		$('.static-modal-wrapper').remove();
		$('#container').removeClass('hide');
		
		/*var*/ bus = new RakkaBus();
		/*var*/ ui = new RakkaUI({
			bus: bus,
			container: $('body'),
			controlBar: true,
			list: true,
			stats: true,
			theme: 'dark'
		});
		/*var*/ rakka = new Rakka({
			bus: bus,
			container : $('#container'),
			generator : generator,
			speed : 100,
			debug : false
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
			/*var*/ generator = new RakkaRedditGenerator({
				mirror: mirrorUrl,
				subreddit: $('#subreddit').val(),
				sort: $('#reddit-sort').val() || 'new'
			});
			start(generator);
		});
		
		$(document).one('click', '.js-vidme-configure .js-example-start', function() {
			/*var*/ generator = new RakkaVidmeGenerator({
				mirror: mirrorUrl
			});
			start(generator);
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

