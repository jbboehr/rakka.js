
requirejs.config({
	packages: [{
		name: 'rakka',
		location: '../assets',
		main: 'rakka'
	}],
	paths: {
		bootstrap: '../node_modules/bootstrap/dist/js/bootstrap.min',
		jquery: '../node_modules/jquery/dist/jquery.min'
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
	var mirrorUrl;
	if( 'nwDispatcher' in window ) {
		/*var*/ mirror = require('../bin/mirror');
		var portfinder = require('portfinder');
		portfinder.getPort(function(err, port) {
			if( !err ) {
				mirror.listen(port);
				mirrorUrl = 'http://localhost:' + port + '/mirror';
			}
		});
	}
	
	function start(generator) {
		$('.static-modal-wrapper').remove();
		$('#container').removeClass('hide');
		
		/*var*/ 
		/*var*/ rakka = new Rakka({
			columns : 3,
			container : $('#container'),
			generator : generator,
			speed : 100,
			debug : false
		});
		/* ui */ ui = new RakkaUI({
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
	}
	
	function startSource(source) {
		if( source == 'vidme' ) {
			/*var*/ generator = new RakkaVidmeGenerator({
				mirror: mirrorUrl
			});
		} else if( source == 'reddit' ) {
			/*var*/ generator = new RakkaRedditGenerator({
				mirror: mirrorUrl
			});
		} else {
			return;
		}
		start(generator);
	}
	
	function onReady() {
		$(document).one('click', '.js-example-start', function() {
			start();
		});
		$(document).on('click', '.js-source-select', function(event) {
			startSource($(event.target).attr('data-source'));
		});
	}
	
	$(onReady);
	
});

