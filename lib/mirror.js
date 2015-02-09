
var gm = require('gm');
var http = require('http');
var https = require('https');
var parseurl = require('parseurl');
var qs = require('qs');

function mirrorImage(req, res, next) {
	var params = qs.parse(parseurl(req).query);
	
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

module.exports = function(/*options*/) {
	return mirrorImage;
};
