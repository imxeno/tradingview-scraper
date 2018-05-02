/* _             .-.                 .-.                _                
  :_;           .' `.                : :               :_;               
  .-. .--.  .--.`. .'.--. ,-.,-.,-.  : `-.  .--.  .--. .-. .--. ,-.,-.,-.
  : :' '_.'`._-.': :' '_.': ,. ,. :  ' .; :' .; :' .; :: :' '_.': ,. ,. :
  : :`.__.'`.__.':_;`.__.':_;:_;:_;  `.__.'`.__.'`._. ;:_;`.__.':_;:_;:_;
.-. :                                             .-. :                  
`._.'                                             `._.'                */                  

const WebSocket = require('ws');
const util = require('util');
var fs = require('fs');
var express = require('express');
var randomstring = require("randomstring");

var app = express()
const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', { origin: "https://data.tradingview.com"});

// pair route
app.get('/api/v1/pair/:pair', function (req, res) {
    if(Data[req.params.pair])
        res.json(Data[req.params.pair]);
    else
    {
        ws.send(SIOMessage(
            "quote_add_symbols",
            [TradingSession, req.params.pair, {"flags": ["force_permission"]}]
        ));
        var each = 10;
        var runs = 3000 / each;
        var interval = setInterval(function() {
            --runs;
            if(Data[req.params.pair]) {
                res.json(Data[req.params.pair]);
                clearInterval(interval);
            }
            else if (!runs) {
                res.json({ s: "error" });
                clearInterval(interval);
            }
        }, each);
        
    }
})


function parseMessages(str) {
    var packets = [];
    while(str.length > 0)
    {
        var x = /~m~(\d+)~m~/.exec(str);
        var packet = str.slice(x[0].length, x[0].length + parseInt(x[1]));
        if(packet.substr(0, 3) != '~h~') {
            packets.push(JSON.parse(packet));
        } else
            packets.push({ "~keepalive~": packet.substr(3) });

        str.slice(0, x[0].length);
        str = str.slice(x[0].length + parseInt(x[1]));
    }
    return packets;
}

function SIOHeader(str) {
    return '~m~' + str.length + '~m~' + str;
}

function SIOMessage(func, param_list) {
    
    function constructMessage(func, param_list)
    {
        return JSON.stringify({
            "m": func,
            "p": param_list
        });
    }

    return SIOHeader(
        constructMessage(func, param_list)
    );
}

function generateTradingViewSessionId()
{
    return "qs_" + randomstring.generate(12);
}

var TradingSession = generateTradingViewSessionId();
//var Symbols = ['OANDA:USDPLN'];
var Data = [];

ws.on('message', function incoming(data) {
    var packets = parseMessages(data);
    packets.forEach(function(packet) {
        // reply to keepalive packets
        if(packet["~keepalive~"])
        {
            ws.send(SIOHeader('~h~' + packet["~keepalive~"]));
        }
        else if(packet.session_id)
        {
            // connecting as unauthorized user

            ws.send(SIOMessage(
                "set_auth_token",
                ["unauthorized_user_token"]
            ));

            // registering default ticker session
            
            ws.send(SIOMessage(
                "quote_create_session",
                [TradingSession]
            ));
            ws.send(SIOMessage(
                "quote_set_fields",
                [TradingSession,"ch","chp","current_session","description","local_description","language","exchange","fractional","is_tradable","lp","minmov","minmove2","original_name","pricescale","pro_name","short_name","type","update_mode","volume","ask","bid","fundamentals","high_price","is_tradable","low_price","open_price","prev_close_price","rch","rchp","rtc","status","basic_eps_net_income","beta_1_year","earnings_per_share_basic_ttm","industry","market_cap_basic","price_earnings_ttm","sector","volume","dividends_yield"]
            ));

            // registering symbols

            /*Symbols.forEach(function(symbol) {
                ws.send(SIOMessage(
                    "quote_add_symbols",
                    [TradingSession, symbol, {"flags": ["force_permission"]}]
                ));
            });*/

            // setting data quality to low (does nothing?)
            /*ws.send(SIOMessage(
                "set_data_quality",
                ["low"]
            ));*/
        }
	// data update packet parsing
        else if (packet.m && packet.m == "qsd"
        && typeof packet.p === 'object' && packet.p.length > 1 && packet.p[0] == TradingSession)
        {
            if(!Data[packet.p[1].n]) Data[packet.p[1].n] = {};
            Data[packet.p[1].n] = Object.assign(Data[packet.p[1].n], packet.p[1].v, {s:packet.p[1].s});
        }
        else
        {
        // log unknown packets
            console.log(util.inspect(packet, {depth: 10}));
        }
    });
  });

// log connection close reason
ws.on('close', function(code, reason) {
    console.log('close ' + code + ' ' + reason);
});

// listen
fs.unlink("api.sock", function() {
  app.listen("api.sock", function() {
    fs.chmod('api.sock', 0777, function() {});
  });
});
