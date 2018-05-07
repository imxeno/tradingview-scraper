'use strict';

const util = require('util');
const WebSocket = require('ws');
const randomstring = require("randomstring");
const SIO = require('./socketio-protocol');

exports = module.exports = class TradingViewAPI {
    
    constructor() {
        var self = this;
        this.resetWebSocket();
    }
    
    // public
    
    resetWebSocket() {
        var self = this;
        this.ticker_data = {};
        this.subscriptions = [];

        this.session = this._generateSession();
        this.session_registered = false;
        this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', { origin: "https://data.tradingview.com"});
        this.ws.on('message', function(data)
        {
            var packets = SIO.parseMessages(data);
            packets.forEach(function(packet) {
                // reply to keepalive packets
                if(packet["~protocol~keepalive~"])
                {
                    self._sendRawMessage('~h~' + packet["~protocol~keepalive~"]);
                }
                // reply to successful connection packet
                else if(packet.session_id)
                {

                    // connecting as unauthorized user
                    
                    self._sendMessage(
                        "set_auth_token",
                        ["unauthorized_user_token"]
                    );
                    
                    // registering default ticker session
                    
                    self._sendMessage(
                        "quote_create_session",
                        [self.session]
                    );
                    
                    self._sendMessage(
                        "quote_set_fields",
                        [self.session,"ch","chp","current_session","description","local_description","language","exchange","fractional","is_tradable","lp","minmov","minmove2","original_name","pricescale","pro_name","short_name","type","update_mode","volume","ask","bid","fundamentals","high_price","is_tradable","low_price","open_price","prev_close_price","rch","rchp","rtc","status","basic_eps_net_income","beta_1_year","earnings_per_share_basic_ttm","industry","market_cap_basic","price_earnings_ttm","sector","volume","dividends_yield"]
                    );
                    
                    self.session_registered = true;

                    // setting data quality to low (commented out, because it does nothing?)
                    //ws.send(SIOMessage(
                    //    "set_data_quality",
                    //    ["low"]
                    //));
                }
                // parse ticker data packets
                else if (
                    packet.m && packet.m == "qsd"
                    && typeof packet.p === 'object'
                    && packet.p.length > 1
                    && packet.p[0] == self.session
                )
                {
                    var tticker = packet.p[1];
                    var ticker_name = tticker.n;
                    var ticker_status = tticker.s;
                    var ticker_update = tticker.v;
                    
                    // set ticker data, adding all object parameters together
                    self.ticker_data[ticker_name] = Object.assign(
                        self.ticker_data[ticker_name] || { last_retrieved: new Date() },
                        ticker_update,
                        { s: ticker_status },
                        { last_update: new Date() }
                    );

                    if(new Date() - self.ticker_data[ticker_name].last_retrieved > 1000 * 60)
                    {
                        self._deleteTicker(ticker_name);
                    }
                }
                else if (packet.m && packet.m == "quote_list_fields")
                {
                    // ignore
                }
                else
                {
                    // log unknown packets
                    console.log(util.inspect(packet, {depth: 10}));
                }
            });
        });
        
        this.ws.on('close', function(code, reason) {
            console.log('WebSocket close code: ' + code + ' reason: ' + reason);
        });
    }

    getTicker(ticker_name, callback) {
        var each = 10;
        var runs = 3000 / each; // time in ms divided by above
        var self = this;

        if(this.ws.readyState == WebSocket.CLOSED)
            this.resetWebSocket();
        
        var interval = setInterval(function() {
            if(self.ws.readyState == WebSocket.OPEN && self.session_registered)
            {
                self._getTicker(ticker_name, callback);
                clearInterval(interval);
            }
            else if (!runs) {
                callback(new Error("WebSocket connection is closed."), { s: "error" });
                clearInterval(interval);
            }
        }, each);
    }
    
    // private
    
    _getTicker(ticker_name, callback) {
        // check if ticker is tracked, and if it is, return stored data
        
        if(this.ticker_data[ticker_name] && this.ticker_data[ticker_name].pro_name)
        {
            callback(null, this.ticker_data[ticker_name]);
            this.ticker_data[ticker_name].last_retrieved = new Date();
            return;
        }
        
        // if not, register and wait for data
        
        this._registerTicker(ticker_name);
        const each = 10; // how much ms between runs
        var runs = 3000 / each; // time in ms divided by above
        var self = this;
        var interval = setInterval(function() {
            --runs;
            if(self.ticker_data[ticker_name] && self.ticker_data[ticker_name].pro_name) {
                callback(null, self.ticker_data[ticker_name]);
                self.ticker_data[ticker_name].last_retrieved = new Date();
                clearInterval(interval);
            }
            else if (!runs) {
                self._deleteTicker(ticker_name);
                callback(new Error("Timed out."), { s: "error" });
                clearInterval(interval);
            }
        }, each);
    }

    _generateSession()
    {
        return "qs_" + randomstring.generate(12);
    }
    
    _sendRawMessage(message)
    {
        this.ws.send(SIO.prependHeader(message));
    }
    
    _sendMessage(func, args)
    {
        this.ws.send(SIO.createMessage(func, args));
    }
    
    _registerTicker(ticker)
    {
        if(this.subscriptions.indexOf(ticker) != -1) return;
        this.subscriptions.push(ticker);
        this.ws.send(SIO.createMessage(
            "quote_add_symbols",
            [this.session, ticker, {"flags": ["force_permission"]}]
        ));
    }

    _unregisterTicker(ticker)
    {
        var index = this.subscriptions.indexOf(ticker);
        if(index == -1) return;
        this.subscriptions.splice(index, 1);
        this.ws.send(SIO.createMessage(
            "quote_remove_symbols",
            [this.session, ticker]
        ));
    }

    _deleteTicker(ticker)
    {
        this._unregisterTicker(ticker);
        delete this.ticker_data[ticker];
    }
}