
var cluster = require('cluster');
var connect = require('connect');
var http = require('http');
var os = require('os');
var responseTime = require('response-time');
var serveStatic = require('serve-static');

var mirror = require('../lib/mirror');



function makeServer() {
	var app = connect();
	
	app.use(responseTime());
	//app.use(bodyParser.urlencoded({ extended: false }));
	app.use('/mirror', mirror());
	app.use(serveStatic('html', {'index': ['index.html']}));
	app.use('/assets', serveStatic('assets'));
	app.use('/node_modules', serveStatic('node_modules'));

	return http.createServer(app)
}

if( require.main === module ) {
	if( cluster.isMaster && true ) {
		for (var i = 0, n = os.cpus().length; i < n; i += 1) {
			cluster.fork();
		}
	} else {
		makeServer().listen(3000);
	}
} else {
	module.exports = makeServer();
}
