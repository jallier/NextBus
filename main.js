var http = require('http');
var fs = require('fs');
var Client = require('node-rest-client').Client;
var sprintf = require('sprintf-js').sprintf;
var url = require('url');

const _api = "https://api.at.govt.nz/v2/gtfs/";
var _timeWindow = 30 * 60 * 1000; // 30 minutes in ms
var hitCounter = 0;
var prevTime = new Date();
var currTime = '';
var prevData = '';

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


function getAllData(req, res, query, stopID) {
    response = {};
    routes = query.routes;
    if (query.window != null && query.window != '') {
        _timeWindow = query.window * 60 * 1000;
    } else {
        _timeWindow = 30 * 60 * 1000;
    }
    updateTimesDict(req, res, stopID, routes, function(req, res, times) {
        if (times == null) {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.write('{"status":"error", "response":"No data returned from AT api"}');
            res.end();
        }
        response = times;
        //console.log(response);
        // Handle http response here so it is only returned when at api has given data
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.write(JSON.stringify(response));
        res.end();
    });
    return response;
}

function updateTimesDict(req, res, stopID, routes, callback) {
    currTime = new Date();
    if (currTime.getTime() - prevTime.getTime() < 1 * 60 * 1000 && hitCounter > 0) {
        console.log("Less then 1 min since last request, returning cached data");
        return callback(req, res, prevData);
    }
    out = {
        "status": "ok",
        "time_requested": new Date(),
        "time_returned": "",
        "response": []
    };
    args.path.stopID = stopID;
    client.methods.departures(args, function(data, raw) {
        allData = data.response.movements;
        if (allData == null) {
            return callback(req, res, null);
        }
        filteredRoutes = filterRoutes(allData, routes)
        filteredTimes = filterTimes(filteredRoutes);
        for (key in filteredTimes) {
            stop = filteredTimes[key];
            timeTo = "";
            if (stop.expectedArrivalTime != null) {
                currentTime = new Date();
                expTime = new Date(stop.expectedArrivalTime);
                timeTo = "" + Math.floor((expTime.getTime() - currentTime.getTime()) / 1000 / 60);
            } else {
                currentTime = new Date();
                schedTime = new Date(stop.scheduledArrivalTime);
                timeTo = Math.floor((schedTime.getTime() - currentTime.getTime()) / 1000 / 60);
                timeTo += "*";
            }
            out.response.push({
                "route": stop.route_short_name,
                "scheduled_time": stop.scheduledArrivalTime,
                "expected_time": stop.expectedArrivalTime,
                "time_to_arrival": timeTo
            });
        }
        out.time_returned = new Date();
        prevData = out;
        hitCounter++;
        prevTime = new Date();
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
            filteredTimes[key] = current;
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

var server = http.createServer(function(req, res) {
    if (req.url === '/favicon.ico') {
        res.writeHead(200, {
            'Content-Type': 'image/x-icon'
        });
        res.end();
        console.log('favicon requested');
        return;
    } else if (req.url === '/') {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.write('{"status":"error", "response":"incorrect arguments"}')
        res.end();
        console.log('stop id not given');
        return;
    }
    queryObject = url.parse(req.url, true).query;
    console.log("request url", req.url);
    console.log("query string", queryObject);
    result = url.parse(req.url, true).pathname.split("/");
    stopID = result[result.length - 2];
    console.log("StopID: ", stopID);
    getAllData(req, res, queryObject, stopID);
});
server.on('error', function(e) {
    console.log(e);
});
server.listen(8000);