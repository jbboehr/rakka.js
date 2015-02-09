
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
		//rakka.start();
		$('[data-action="start"]').trigger('click');
	}
	
	function startSource(source) {
		if( source == 'vidme' ) {
			/*var*/ generator = new RakkaVidmeGenerator({
				mirror: mirrorUrl
			});
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
		$(document).on('click', '.js-source-select', function(event) {
			var el = $(event.target);
			if( startSource(el.attr('data-source')) ) {
				$('#selector').remove();
			}
		});
	}
	
	$(onReady);
	
});

