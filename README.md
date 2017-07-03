# NextBus

## What

A NodeJS app to get the times of the next buses at a bus stop and filter them for the lines of your choosing within a time window.
This is specific to Auckland, New Zealand and uses the AT api for data.

## Why

I got sick of leaving the house only for the next bus to be scheduled for 15 minutes later and having to wait at the bus stop. Using NextBus means you can quickly see when the next buses within a time window are due so you can leave a little later and still catch it.

## How it works

The app accepts input through the url and query string. 

` localhost:8000/stop/1234?routes=[123,124,125] `

You can optionally specify a time window as well with the window key in the query string. The default is 30 minutes. e.g. For an hour window

` localhost:8000/stop/1234?routes=[123,124,125]&window=60 `

The app returns JSON with the next buses:

```
{
   "status":"ok",
   "time_requested":"2017-07-03T06:25:13.526Z",
   "time_returned":"2017-07-03T06:25:15.658Z",
   "response":[
      {
         "route":"123",
         "scheduled_time":"2017-07-03T06:32:11.000Z",
         "expected_time":"2017-07-03T06:31:18Z",
         "time_to_arrival":"6"
      },
      {
         "route":"124",
         "scheduled_time":"2017-07-03T06:42:11.000Z",
         "expected_time":null,
         "time_to_arrival":"16*"
      },
      {
         "route":"123",
         "scheduled_time":"2017-07-03T06:52:12.000Z",
         "expected_time":null,
         "time_to_arrival":"26*"
      }
   ]
}
```

If a time is appended with a '\*' it indicates that the arrival time was not returned by the AT api and the app has guessed based on the scheduled arrival time, and is therefore not 100% accurate.

The JSON can be used on a webpage for a display, however it must be proxied so that it appears on the same domain as the webpage using apache or nginx due to issues with CORS.

## How to install

``` 
git clone https://github.com/jallier/NextBus.git
cd NextBus
```
Then open key.example and read the instructions to get the key needed for the AT api. 

Assuming Node and npm are installed already, run:

```
npm install
node main.js
```

Then visit localhost:8000 using your stop id and routes. You can find the stop IDs on the AT website
