var express = require('express');
//var xml = require('xml');
var app = express();
var id = 1; 

app.get('/', function (req, res) {
	var rcml = '<?xml version="1.0" encoding="UTF-8"?><Response> <Dial record="false"> <Client>user';
	rcml += id; 
	rcml += '</Client> </Dial> </Response>';
	id++;
	res.set('Content-Type', 'text/xml');
	res.send(rcml);
})
 
app.listen(3000);
