var http = require('http');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var sprintf = require('sprintf-js').sprintf;
var url = require('url');

const _api = "https://api.at.govt.nz/v2/gtfs/";
const _tripID = "trips/tripId/";
const _routeID = "routes/routeId/";
const _stopId = "8515";
const _timeWindow = 30 * 60 * 1000; // 30 minutes in ms
const _routes = ['274', '277'];

_key = fs.readFileSync('key.txt', 'utf8').trim(); //Sync so it reads before the server starts

var client = new Client();
var args = {
  headers: {
    "Ocp-Apim-Subscription-Key": _key
  },
  path: {
    "tripID": "14277052711-20170420151239_v53.21"
  }
};
console.log(args);

client.registerMethod("departures", "https://api.at.govt.nz/v2/public-restricted/departures/" + _stopId, "GET");

function getAllData() {
  client.methods.departures(args, function(data, raw) {
    allData = data.response.movements;
    filteredRoutes = filterRoutes(allData)
    filteredTimes = filterTimes(filteredRoutes);
    for(key in filteredTimes){
      stop = filteredTimes[key];
      schedTime = new Date(stop.scheduledArrivalTime);
      schedH = schedTime.getHours();
      schedM = schedTime.getMinutes();
      expTime = new Date(stop.expectedArrivalTime);
      expH = expTime.getHours();
      expM = expTime.getMinutes();
      console.log("Route: ", stop.route_short_name, "Scheduled arrival time: ", schedH, schedM, "Expected arrival time:", expH, expM);
    }
  });
}

function filterTimes(times) {
  filteredTimes = {}
  actualTime = new Date().getTime();
  actualTimes = new Date();
  for (key in times) {
    current = times[key];
    scheduledTime = new Date(current.scheduledArrivalTime);
    if (current.expectedArrivalTime) {
      expectedTime = new Date(current.expectedArrivalTime);
    } else {
      expectedTime = scheduledTime;
    }
    scheduledTime = scheduledTime.getTime();
    expectedTime = expectedTime.getTime();
    if (scheduledTime >= actualTime && scheduledTime <= actualTime + _timeWindow) {
      filteredTimes[key]=current;
    }
  }
  return filteredTimes;
}

function filterRoutes(routes) {
  filteredRoutes = {}
  len = routes.length;
  for (i = 0; i < len; i++) {
    current = routes[i];
    if (_routes.indexOf(current.route_short_name) > -1) {
      filteredRoutes[i] = current;
    }
  }
  return filteredRoutes;
}

function convertArrivalTimeTo24hr(time) {
  hours = Math.floor(time / 60 / 60);
  minutes = Math.floor(time / 60 - hours * 60);
  seconds = Math.floor(time - hours * 60 * 60 - minutes * 60);
  outputString = sprintf("%02d:%02d:%02d", hours, minutes, seconds);
  return outputString;
}

getAllData();

var server = http.createServer(function(req, res) { //req is readable stream that emits data events for each incoming piece of data.
  queryObject = url.parse(req.url, true).query;
  console.log(queryObject);
  res.writeHead(200, {
    'Content-Type': 'application/json'
  }); //res is writeable stream that is used to send data back to client.
  res.write('{"text":"Hello Http"}');
  res.end();
});
server.listen(8080);
