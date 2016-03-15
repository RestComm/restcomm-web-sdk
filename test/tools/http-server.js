/* 
 * This is a unified server used in our testing for serving:
 * - html pages of this directory at /, like webrtc-client.html over http
 * - html pages of this directory at /, like webrtc-client.html over https
 * - RCML (REST) for Restcomm at /rcml. The logic for RCML is to return a Dial command towards Restcomm Client userX, where X is a increasing counter reaching up to client count and wrapping around so that continuous tests can be ran
 *
 * Command line:
 * $ node server.js [client count] [REST RCML port] [HTTP port for html] [HTTPS port for html]
 */

var nodeStatic = require('node-static');
var commandLineArgs = require('command-line-args');
var http = require('http');
var https = require('https');
var express = require('express');
var fs = require('fs');

var TAG = '[http-server] ';

// TODO: replace with node-getopt
var CLIENT_COUNT = 10;
var RCML_PORT = 10512;
var HTTP_PORT = 10510;
var HTTPS_PORT = 10511;

var cli = commandLineArgs([
  { name: 'client-count', alias: 'c', type: Number, defaultValue: 10 },
  { name: 'external-service-port', alias: 'p', type: Number, defaultValue: 10512 },
  { name: 'external-service-client-prefix', alias: 'x', type: String, defaultValue: 'user' },
  { name: 'web-app-port', alias: 'w', type: Number, defaultValue: 10510 },
  { name: 'web-app-dir', alias: 'd', type: String, defaultValue: '.' },
  { name: 'secure-web-app', alias: 's', type: Boolean, defaultValue: false },
  { name: 'help', alias: 'h' },
]);

var options = cli.parse();
if (options['help']) {
	cli.getUsage();
}
//console.log('[server.js] Options: ' + JSON.stringify(options));	

/*
if (process.argv.length <= 2) {
	console.log('[server.js] Usage: $ server.js [client count] [REST RCML port] [HTTP port for html] [HTTPS port for html]');	
	process.exit(1);
}
if (process.argv[2]) {
	CLIENT_COUNT = process.argv[2];
}
if (process.argv[3]) {
	RCML_PORT = process.argv[3];
}
if (process.argv[4]) {
	HTTP_PORT = process.argv[4];
}
if (process.argv[5]) {
	HTTPS_PORT = process.argv[5];
}
*/

//console.log('[server.js] Initializing http(s) server with ' + options[' + ' clients: \n\tRCML (REST) port: ' + RCML_PORT + ' \n\thttp (Webrtc App) port: ' + HTTP_PORT + ' \n\thttps (Webrtc App) port: ' + HTTPS_PORT);	
console.log(TAG + 'External service settings: \n\tclient count: ' + options['client-count'] + '\n\tport: ' + options['external-service-port'] + '\n\tclient prefix: ' + options['external-service-client-prefix']);
console.log(TAG + 'Web app server settings: \n\tport: ' + options['web-app-port'] + '\n\tsecure: ' + options['secure-web-app']);

// -- Serve html pages over http
var fileServer = new nodeStatic.Server(options['web-app-dir']);
var app = null;

if (!options['secure-web-app']) {
	app = http.createServer(function (req, res) {
	  fileServer.serve(req, res);
	}).listen(options['web-app-port']);
}
else {
	// Options for https
	var secureOptions = {
	  key: fs.readFileSync('cert/key.pem'),
	  cert: fs.readFileSync('cert/cert.pem')
	};

	// Serve html pages over https
	app = https.createServer(secureOptions, function (req, res) {
	  fileServer.serve(req, res);
	}).listen(options['web-app-port']);
}

// -- Serve RCML with REST
var app = express();
var id = 1; 

app.get('/rcml', function (req, res) {
	console.log('[server.js] Handing client ' + id);	
	var rcml = '<?xml version="1.0" encoding="UTF-8"?><Response> <Dial record="false"> <Client>user';
	rcml += id; 
	rcml += '</Client> </Dial> </Response>';

	if (id == options['client-count']) {
		console.log('[server.js] Reached ' + id + ', wrapping around');	
		id = 0;	
	}
	id++;

	res.set('Content-Type', 'text/xml');
	res.send(rcml);
})
 
app.listen(options['external-service-port']);
