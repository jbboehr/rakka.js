
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
	'rakka/generator-files',
	'rakka/generator-reddit',
	'rakka/generator-vidme',
	'./suggest',
	'bootstrap'
], function(
	$,
	Rakka,
	RakkaBus,
	RakkaUI,
	RakkaFilesGenerator,
	RakkaRedditGenerator,
	RakkaVidmeGenerator,
	ultraSimpleAutosuggest
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
	
	// Main
	var fileList;
	var vidmeChannels;
	var bus = new RakkaBus();
	
	function start(generator) {
		$('.static-modal-wrapper').remove();
		$('#container').removeClass('hide');
		
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
	
	function startReddit() {
		/*var*/ generator = new RakkaRedditGenerator({
			bus: bus,
			mirror: mirrorUrl,
			subreddit: $('#subreddit').val(),
			sort: $('#redditOrder').val() || 'new'
		});
		start(generator);
	}
	
	function startVidme() {
		/*var*/ generator = new RakkaVidmeGenerator({
			bus: bus,
			mirror: mirrorUrl,
			feed: $('input[name="feed"]:checked').val(),
			channel: $('#vidmeNetwork').val(),
			order: $('#vidmeOrder').val()
		});
		start(generator);
	}
	
	function startFiles() {
		/*var*/ generator = new RakkaFilesGenerator({
			bus: bus,
			files: fileList
		});
		start(generator);
	}
	
	function startSource(source) {
		switch( source ) {
			case 'reddit': startReddit(); break;
			case 'vidme': startVidme(); break;
			case 'files': startFiles(); break;
		}
	}
	
	function selectSource(source) {
		$('.js-rakka-configure[data-source="' + source + '"]').removeClass('hide');
		return true;
	}
	
	
	function onReady() {
		var subredditOpts = ['EarthPorn', 'SkyPorn', 'MotorcyclePorn', 'StarshipPorn', 'FractalPorn', 'FuturePorn', 'HistoryPorn'];
		ultraSimpleAutosuggest('#subreddit', $.map(subredditOpts, function(el) {
			return {id: el, title: el, show_empty: true};
		}), {allowArbitrary: true});
		
		$(document).on('click', '.js-rakka-configure .js-example-start', function(event) {
			startSource($(event.target).parents('.js-rakka-configure').attr('data-source'));
		});
		
		$(document).on('change', '#files', function(event) {
			fileList = event.target.files;
			$('.js-btn-file-value').text(fileList.length + ' files');
		});
		
		$(document).on('change', '#vidmeFeed', function(event) {
			if( $(event.target).val() === 'channel' ) {
				$('#vidmeNetwork').parent().removeClass('hide');
				if( vidmeChannels ) {
					return;
				}
				$.get('https://api.vid.me/channels', function(data) {
					vidmeChannels = data.data;
					for( var x in vidmeChannels ) {
						vidmeChannels[x].id = vidmeChannels[x].channel_id;
						vidmeChannels[x].show_empty = vidmeChannels[x].is_default;
					}
					ultraSimpleAutosuggest('#vidmeNetwork', vidmeChannels);
					setTimeout(function() {
						document.getElementById('vidmeNetwork').focus();
					}, 10);
				});
			} else {
				$('#vidmeNetwork').parent().addClass('hide');
			}
		});
		
		$(document).on('change', '#redditFeed', function(event) {
			if( $(event.target).val() === 'subreddit' ) {
				$('#subreddit').parent().removeClass('hide');
			} else {
				$('#subreddit').parent().addClass('hide');
			}
		});
		
		
		$(document).one('click', '.js-vidme-configure .js-example-start', startVidme);
		
		$(document).on('click', '.js-source-select', function(event) {
			selectSource($(event.target).attr('data-source'));
			$('#selector').remove();
		});
	}
	
	$(onReady);
	
});

