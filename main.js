var http = require('http');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var sprintf = require('sprintf-js').sprintf;
var url = require('url');

const _api = "https://api.at.govt.nz/v2/gtfs/";
const _timeWindow = 30 * 60 * 1000; // 30 minutes in ms

_key = fs.readFileSync('key.txt', 'utf8').trim(); //Sync so it reads before the server starts

var client = new Client();
var args = {
  headers: {
    "Ocp-Apim-Subscription-Key": _key
  },
  path: {
    "stopID": ""
  }
};
console.log(args);

client.registerMethod("departures", "https://api.at.govt.nz/v2/public-restricted/departures/${stopID}", "GET");


function getAllData(req, res, query) {
  response = {};
  stopID = query.stopID;
  routes = query.routes;
  updateTimesDict(req, res, stopID, routes, function(req, res, times){
    response = times;
    console.log(response);
    // Handle http response here so it is only returned when at api has given data
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    res.write(JSON.stringify(response));
    res.end();
  });
  return response;
}

function updateTimesDict(req, res, stopID, routes, callback){
  out = {"status":"ok", "time_requested":new Date(), "time_returned":"", "response":[]};
  args.path.stopID = stopID;
  client.methods.departures(args, function(data, raw) {
    allData = data.response.movements;
    filteredRoutes = filterRoutes(allData, routes)
    filteredTimes = filterTimes(filteredRoutes);
    for(key in filteredTimes){
      stop = filteredTimes[key];
      schedTime = new Date(stop.scheduledArrivalTime);
      schedH = schedTime.getHours();
      schedM = schedTime.getMinutes();
      expTime = new Date(stop.expectedArrivalTime);
      expH = expTime.getHours();
      expM = expTime.getMinutes();
      out.response.push({"route": stop.route_short_name, "scheduled_time":stop.scheduledArrivalTime, "expected_time":stop.expectedArrivalTime, "time_to_arrival": new Date(schedTime - expTime).getMinutes()});
      console.log("Route: ", stop.route_short_name, "Scheduled arrival time: ", schedH, schedM, "Expected arrival time:", expH, expM);
    }
    out.time_returned = new Date();
    return callback(req, res, out);
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

function filterRoutes(routes, filter) {
  filteredRoutes = {}
  len = routes.length;
  for (i = 0; i < len; i++) {
    current = routes[i];
    if (filter.indexOf(current.route_short_name) > -1) {
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

// getAllData();

var server = http.createServer(function(req, res) { //req is readable stream that emits data events for each incoming piece of data.
  queryObject = url.parse(req.url, true).query;
  console.log(queryObject);
  getAllData(req, res, queryObject);
});
server.listen(8080);
