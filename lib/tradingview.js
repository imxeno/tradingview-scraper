const util = require('util');
const WebSocket = require('ws');
const randomstring = require("randomstring");
const SIO = require('./ioProtocol');

module.exports = class TradingViewAPI {
    
    constructor() {
        this._resetWebSocket();
    }
    
    // public

    getTicker(ticker_name) {
        return new Promise((resolve, reject) => {
            let each = 10;
            let runs = 3000 / each; // time in ms divided by above

            if(this.ws.readyState == WebSocket.CLOSED)
                this._resetWebSocket();
            
            let interval = setInterval(() =>  {
                if(this.ws.readyState == WebSocket.OPEN && this.session_registered)
                {
                    this._getTicker(ticker_name, resolve, reject);
                    clearInterval(interval);
                }
                else if (!runs) {
                    reject("WebSocket connection is closed.");
                    clearInterval(interval);
                }
            }, each);
        });
    }
    
    // private
    
    _getTicker(ticker_name, resolve, reject) {
        // check if ticker is tracked, and if it is, return stored data
        
        if(this.ticker_data[ticker_name] && this.ticker_data[ticker_name].pro_name)
        {
            resolve(this.ticker_data[ticker_name]);
            this.ticker_data[ticker_name].last_retrieved = new Date();
            return;
        }
        
        // if not, register and wait for data
        
        this._registerTicker(ticker_name);
        const each = 10; // how much ms between runs
        let runs = 3000 / each; // time in ms divided by above
        let interval = setInterval(() => {
            --runs;
            if(this.ticker_data[ticker_name] && this.ticker_data[ticker_name].pro_name) {
                resolve(this.ticker_data[ticker_name]);
                this.ticker_data[ticker_name].last_retrieved = new Date();
                clearInterval(interval);
            }
            else if (!runs) {
                this._deleteTicker(ticker_name);
                reject("Timed out.");
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
        let index = this.subscriptions.indexOf(ticker);
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

    _resetWebSocket() {
        this.ticker_data = {};
        this.subscriptions = [];

        this.session = this._generateSession();
        this.session_registered = false;
        this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', { origin: "https://data.tradingview.com"});
        this.ws.on('message', (data) => {

            let packets = SIO.parseMessages(data);
            packets.forEach((packet) => {
                // reply to keepalive packets
                if(packet["~protocol~keepalive~"])
                {
                    this._sendRawMessage('~h~' + packet["~protocol~keepalive~"]);
                }
                // reply to successful connection packet
                else if(packet.session_id)
                {

                    // connecting as unauthorized user
                    
                    this._sendMessage(
                        "set_auth_token",
                        ["unauthorized_user_token"]
                    );
                    
                    // registering default ticker session
                    
                    this._sendMessage(
                        "quote_create_session",
                        [this.session]
                    );
                    
                    this._sendMessage(
                        "quote_set_fields",
                        [this.session,"ch","chp","current_session","description","local_description","language","exchange","fractional","is_tradable","lp","minmov","minmove2","original_name","pricescale","pro_name","short_name","type","update_mode","volume","ask","bid","fundamentals","high_price","is_tradable","low_price","open_price","prev_close_price","rch","rchp","rtc","status","basic_eps_net_income","beta_1_year","earnings_per_share_basic_ttm","industry","market_cap_basic","price_earnings_ttm","sector","volume","dividends_yield"]
                    );
                    
                    this.session_registered = true;

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
                    && packet.p[0] == this.session
                )
                {
                    let tticker = packet.p[1];
                    let ticker_name = tticker.n;
                    let ticker_status = tticker.s;
                    let ticker_update = tticker.v;
                    
                    // set ticker data, adding all object parameters together
                    this.ticker_data[ticker_name] = Object.assign(
                        this.ticker_data[ticker_name] || { last_retrieved: new Date() },
                        ticker_update,
                        { s: ticker_status },
                        { last_update: new Date() }
                    );

                    if(new Date() - this.ticker_data[ticker_name].last_retrieved > 1000 * 60)
                    {
                        this._deleteTicker(ticker_name);
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
        
        this.ws.on('close', (code, reason) => {
            console.log('WebSocket close code: ' + code + ' reason: ' + reason);
        });
    }
    
}