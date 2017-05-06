var http = require('http');
var fs = require('fs');
var Promise = require('bluebird');
var Client = require('node-rest-client').Client;
Promise.promisifyAll(Client);

var _api = "https://api.at.govt.nz/v2/gtfs/";
var _tripID = "trips/tripId/";
var _routeID = "routes/routeId/";
var _key = '';
var _stopId = "8515";
var _timeWindow = 10 * 60; // 30 minutes

_key = fs.readFileSync('key.txt', 'utf8').trim(); //Sync so it reads before the server starts

var client = new Client();
var args = {
  headers: {
    "Ocp-Apim-Subscription-Key": _key
  },
  path:{
    "tripID": "14277052711-20170420151239_v53.21"
  }
};
console.log(args);

client.registerMethod("stopTimes", _api + "stopTimes/stopId/" + _stopId, "GET");
client.registerMethod("tripID", _api + _tripID + "${tripID}", "GET");

function getRouteName(tripID, callback){
  args = {
    headers: {
      "Ocp-Apim-Subscription-Key": _key
    },
    path:{
      "tripID": tripID
    }
  };
  client.methods.tripID(args, function(d, r){
    //call this function when route data returned
    // console.log(d['response']);
    callback(d['response'][0]['route_id']);
  });
}
var shared_counter = 0;
client.methods.stopTimes(args, function(data, response) {
  // parsed response body as js object
  // console.log(data['response'][0]);
  console.log("Received all data; running loop");
  data = data['response'];
  times = {};
  timeSinceMidnight = 0;
  date = new Date();
  timeSinceMidnight = (date.getHours() * 60 * 60) + (date.getMinutes() * 60) + (date.getSeconds()); //in seconds
  // console.log(timeSinceMidnight);
  len = data.length;
  shared_counter = 0;
  for (i = 0; i < len; i++) {
    arrival_time = data[i]['arrival_time_seconds'];
    id = data[i]['trip_id'];
    if (arrival_time >= timeSinceMidnight && arrival_time <= (timeSinceMidnight + _timeWindow)) {
      shared_counter++;
      times[id] = {"arrival_time": arrival_time, "route": ""};
      console.log(times[id]);
      // args.path.tripID = id;
    }
  }
  for (var key in times){
    // getRouteName()
  }
  // console.log("Loop complete", times);
});

var server = http.createServer(function(req, res) { //req is readable stream that emits data events for each incoming piece of data.
  res.writeHead(200, {
    'Content-Type': 'application/json'
  }); //res is writeable stream that is used to send data back to client.
  res.write('{"text":"Hello Http"}');
  res.end();
});
server.listen(8080);
