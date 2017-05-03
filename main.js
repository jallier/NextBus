var http = require('http');
var fs = require('fs');
var Client = require('node-rest-client').Client;

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

// test = "";
// client.methods.tripID(args, function(data, response){
//   // This function run when the api returns some data.
//   test = data;
//   console.log("data", test);
// });

function getRouteName(times, tripID, callback){
  // console.log(times);
  // console.log(tripID);
  // console.log("this is a test");
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
    // console.log(d.response[0].route_id)
    console.log(shared_counter);
    shared_counter -= 1;
    times[tripID].route=d.response[0].route_id;
    if(shared_counter<=0){
      callback();
    }
    // console.log(times);
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
  shared_counter = data.length;
  for (i = 0; i < len; i++) {
    arrival_time = data[i]['arrival_time_seconds'];
    id = data[i]['trip_id'];
    if (arrival_time >= timeSinceMidnight && arrival_time <= (timeSinceMidnight + _timeWindow)) {
      times[id] = {"arrival_time": arrival_time, "route": ""};
      // args.path.tripID = id;
      // console.log(args);
      console.log(shared_counter);
      getRouteName(times, id, function(){
        console.log(times);
      });
    }
  }
  console.log("Loop complete", times);
});

var server = http.createServer(function(req, res) { //req is readable stream that emits data events for each incoming piece of data.
  res.writeHead(200, {
    'Content-Type': 'application/json'
  }); //res is writeable stream that is used to send data back to client.
  res.write('{"text":"Hello Http"}');
  res.end();
});
server.listen(8080);
