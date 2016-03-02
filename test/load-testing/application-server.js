var express = require('express');
//var xml = require('xml');
var app = express();
var id = 1; 
var CLIENT_COUNT = 10;
if (process.argv[2]) {
	CLIENT_COUNT = process.argv[2];
}
console.log('Initializing with ' + CLIENT_COUNT + ' clients');	

app.get('/', function (req, res) {
	console.log('Handing client ' + id);	
	var rcml = '<?xml version="1.0" encoding="UTF-8"?><Response> <Dial record="false"> <Client>user';
	rcml += id; 
	rcml += '</Client> </Dial> </Response>';

	if (id == CLIENT_COUNT) {
		console.log('Reached ' + id + ', wrapping around');	
		id = 0;	
	}
	id++;

	res.set('Content-Type', 'text/xml');
	res.send(rcml);
})
 
app.listen(3000);
