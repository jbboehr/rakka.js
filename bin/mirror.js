
var cluster = require('cluster');
var connect = require('connect');
//var bodyParser = require('body-parser');
var gm = require('gm');
var http = require('http');
var https = require('https');
var os = require('os');
var parseurl = require('parseurl');
var qs = require('qs');
var Url = require('url');
var responseTime = require('response-time');
var serveStatic = require('serve-static');

if( cluster.isMaster && true ) {
	for (var i = 0, n = os.cpus().length; i < n; i += 1) {
		cluster.fork();
	}
} else {
	var app = connect();

	app.use(responseTime())
	//app.use(bodyParser.urlencoded({ extended: false }));
	app.use(mirrorImageMiddleware);
	app.use(serveStatic('html', {'index': ['index.html']}));
	app.use('/assets', serveStatic('assets'));
	app.use('/node_modules', serveStatic('node_modules'));

	http.createServer(app).listen(3000);
}





function mirrorImageMiddleware(req, res, next) {
	var url = parseurl(req);
	if( url.pathname === '/mirror' ) {
		mirrorImage(url, req, res);
	} else {
		next();
	}
}

function mirrorImage(url, req, res) {
	var params = qs.parse(url.query);
	
	// Check URL parameter
	if( !params.url ) {
		res.statusCode = 400;
		res.end('mirror needs url parameter');
		return;
	}
	
	sendImage(params, res);
}

function sendImage(params, serverResponse) {
	console.log('Mirror: Start ' + params.url);
	
	if( (params.width && params.height) || params.type ) {
		sendImageComplex(params, serverResponse);
	} else {
		sendImageSimple(params, serverResponse);
	}
}

function sendImageSimple(params, serverResponse) {
	var client = getClientForUrl(params.url);
	var req = client.request(params.url, function(clientResponse) {
		if( checkClientResponse(clientResponse, serverResponse) ) {
			clientResponse.pipe(serverResponse);
		}
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		serverResponse.statusCode = 500;
		serverResponse.end(e.message);
	});

	req.end();
}

function sendImageComplex(params, serverResponse) {
	var client = getClientForUrl(params.url);
	var req = client.request(params.url, function(clientResponse) {
		if( checkClientResponse(clientResponse, serverResponse) ) {
			gm(clientResponse)
				.resize(params.width, params.height)
				.stream()
				.pipe(serverResponse);
		}
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		serverResponse.statusCode = 500;
		serverResponse.end(e.message);
	});

	req.end();
	
}

function getClientForUrl(url) {
	var pos = url.indexOf(':');
	var protocol;
	if( pos !== -1 ) {
		protocol = url.substr(0, pos);
	}
	if( protocol === 'https' ) {
		return https;
	} else {
		return http;
	}
}

function checkClientResponse(clientResponse, serverResponse) {
	function error(message) {
		serverResponse.statusCode = 500;
		serverResponse.end(message);
	}
	if( 'content-type' in clientResponse.headers ) {
		if( 0 !== clientResponse.headers['content-type'].indexOf('image/') ) {
			error('Invalid content-type ' + clientResponse.headers['content-type']);
			return false
		}
	}
	return true;
}
