var http = require('http');
var fs = require('fs');
var Client = require('node-rest-client').Client;

var _api = "https://api.at.govt.nz/v2/gtfs/";
var _key = '';

_key = fs.readFileSync('key.txt', 'utf8').trim(); //Sync so it reads before the server starts

var client = new Client();
var args = {
  headers: {
    "Ocp-Apim-Subscription-Key": _key
  }
};
console.log(args);

client.registerMethod("stopTimes", _api + "stopTimes/stopId/8515", "GET");

client.methods.stopTimes(args, function (data, response) {
	// parsed response body as js object
	console.log(data[0]);
});

var server = http.createServer(function(req, res) { //req is readable stream that emits data events for each incoming piece of data.
  res.writeHead(200, {
    'Content-Type': 'application/json'
  }); //res is writeable stream that is used to send data back to client.
  res.write('{"text":"Hello Http"}');
  res.end();
});
server.listen(8080);
