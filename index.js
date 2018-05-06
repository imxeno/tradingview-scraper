'use strict';

var fs = require('fs');
var express = require('express');
var TradingView = require('./lib/tradingview');

var app = express();
var tradingView = new TradingView();

// pair route
app.get('/api/v1/pair/:pair', function (req, res) {
    var ticker_name = req.params.pair;
    
    tradingView.getTicker(ticker_name, function(api_err, data) {
        req.json(data);
    });
})

// listen
fs.unlink("api.sock", function() {
  app.listen("api.sock", function() {
    fs.chmod('api.sock', 0o777, function() {});
  });
});
