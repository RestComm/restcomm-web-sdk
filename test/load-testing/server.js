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
var http = require('http');
var https = require('https');
var express = require('express');
var fs = require('fs');

// TODO: replace with node-getopt
var CLIENT_COUNT = 10;
var RCML_PORT = 10512;
var HTTP_PORT = 10510;
var HTTPS_PORT = 10511;
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

console.log('[server.js] Initializing http(s) server with ' + CLIENT_COUNT + ' clients, listening for RCML (REST) at: ' + RCML_PORT + ', listening for http (Webrtc App) at: ' + HTTP_PORT + ', listening for https (Webrtc App) at: ' + HTTPS_PORT);	

// Serve html pages over http
var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(HTTP_PORT);

// Options for https
var secureOptions = {
  key: fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem')
};

// Serve html pages over https
var appSecure = https.createServer(secureOptions, function (req, res) {
  fileServer.serve(req, res);
}).listen(HTTPS_PORT);



// Serve RCML with REST
var app = express();
var id = 1; 

app.get('/rcml', function (req, res) {
	console.log('[server.js] Handing client ' + id);	
	var rcml = '<?xml version="1.0" encoding="UTF-8"?><Response> <Dial record="false"> <Client>user';
	rcml += id; 
	rcml += '</Client> </Dial> </Response>';

	if (id == CLIENT_COUNT) {
		console.log('[server.js] Reached ' + id + ', wrapping around');	
		id = 0;	
	}
	id++;

	res.set('Content-Type', 'text/xml');
	res.send(rcml);
})
 
app.listen(RCML_PORT);
