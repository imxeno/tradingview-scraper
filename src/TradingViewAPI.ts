import randomstring from "randomstring";
import WebSocket from "ws";

import * as SIO from "./IOProtocol";

export class TradingViewAPI {
  private ws!: WebSocket;
  private tickerData: { [key: string]: any } = {};
  private subscriptions: ProName[] = [];
  private session!: string;
  private sessionRegistered = false;

  constructor() {
    this._resetWebSocket();
  }

  public getTicker(tickerName: string): Promise<TickerData> {
    return new Promise((resolve, reject) => {
      const each = 10;
      const runs = 3000 / each; // time in ms divided by above

      if (this.ws.readyState === WebSocket.CLOSED) {
        this._resetWebSocket();
      }

      const interval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN && this.sessionRegistered) {
          this._getTicker(tickerName, resolve, reject);
          clearInterval(interval);
        } else if (!runs) {
          reject("WebSocket connection is closed.");
          clearInterval(interval);
        }
      }, each);
    });
  }

  // private

  private _getTicker(
    tickerName: string,
    resolve: (data: TickerData) => void,
    reject: (message: string) => void
  ) {
    // check if ticker is tracked, and if it is, return stored data

    if (this.tickerData[tickerName] && this.tickerData[tickerName].pro_name) {
      resolve(this.tickerData[tickerName]);
      this.tickerData[tickerName].last_retrieved = new Date();
      return;
    }

    // if not, register and wait for data

    this._registerTicker(tickerName);
    const each = 10; // how much ms between runs
    let runs = 3000 / each; // time in ms divided by above
    const interval = setInterval(() => {
      --runs;
      if (this.tickerData[tickerName] && this.tickerData[tickerName].pro_name) {
        resolve(this.tickerData[tickerName]);
        this.tickerData[tickerName].last_retrieved = new Date();
        clearInterval(interval);
      } else if (!runs) {
        this._deleteTicker(tickerName);
        reject("Timed out.");
        clearInterval(interval);
      }
    }, each);
  }

  private _generateSession() {
    return "qs_" + randomstring.generate(12);
  }

  private _sendRawMessage(message: string) {
    this.ws.send(SIO.prependHeader(message));
  }

  private _sendMessage(func: string, args: MessageArguments) {
    this.ws.send(SIO.createMessage(func, args));
  }

  private _registerTicker(ticker: ProName) {
    if (this.subscriptions.indexOf(ticker) !== -1) {
      return;
    }
    this.subscriptions.push(ticker);
    this.ws.send(
      SIO.createMessage("quote_add_symbols", [
        this.session,
        ticker,
        { flags: ["force_permission"] }
      ])
    );
  }

  private _unregisterTicker(ticker: ProName) {
    const index = this.subscriptions.indexOf(ticker);
    if (index === -1) {
      return;
    }
    this.subscriptions.splice(index, 1);
    this.ws.send(
      SIO.createMessage("quote_remove_symbols", [this.session, ticker])
    );
  }

  private _deleteTicker(ticker: ProName) {
    this._unregisterTicker(ticker);
    delete this.tickerData[ticker];
  }

  private _resetWebSocket() {
    this.tickerData = {};
    this.subscriptions = [];

    this.session = this._generateSession();
    this.sessionRegistered = false;
    this.ws = new WebSocket("wss://data.tradingview.com/socket.io/websocket", {
      origin: "https://data.tradingview.com"
    });
    this.ws.on("message", (data: string) => {
      const packets = SIO.parseMessages(data);
      packets.forEach((packet: any) => {
        // reply to keepalive packets
        if (packet["~protocol~keepalive~"]) {
          this._sendRawMessage("~h~" + packet["~protocol~keepalive~"]);
        } else if (packet.session_id) {
          // reply to successful connection packet

          // connecting as unauthorized user

          this._sendMessage("set_auth_token", ["unauthorized_user_token"]);

          // registering default ticker session

          this._sendMessage("quote_create_session", [this.session]);

          this._sendMessage("quote_set_fields", [
            this.session,
            "ch",
            "chp",
            "current_session",
            "description",
            "local_description",
            "language",
            "exchange",
            "fractional",
            "is_tradable",
            "lp",
            "minmov",
            "minmove2",
            "original_name",
            "pricescale",
            "pro_name",
            "short_name",
            "type",
            "update_mode",
            "volume",
            "ask",
            "bid",
            "fundamentals",
            "high_price",
            "is_tradable",
            "low_price",
            "open_price",
            "prev_close_price",
            "rch",
            "rchp",
            "rtc",
            "status",
            "basic_eps_net_income",
            "beta_1_year",
            "earnings_per_share_basic_ttm",
            "industry",
            "market_cap_basic",
            "price_earnings_ttm",
            "sector",
            "volume",
            "dividends_yield"
          ]);

          this.sessionRegistered = true;
        } else if (
          // parse ticker data packets
          packet.m &&
          packet.m === "qsd" &&
          typeof packet.p === "object" &&
          packet.p.length > 1 &&
          packet.p[0] === this.session
        ) {
          const tticker = packet.p[1];
          const tickerName = tticker.n;
          const tickerStatus = tticker.s;
          const tickerUpdate = tticker.v;

          // set ticker data, adding all object parameters together
          this.tickerData[tickerName] = Object.assign(
            this.tickerData[tickerName] || { last_retrieved: new Date() },
            tickerUpdate,
            { s: tickerStatus },
            { last_update: new Date() }
          );

          if (
            Date.now() - this.tickerData[tickerName].last_retrieved >
            1000 * 60
          ) {
            this._deleteTicker(tickerName);
          }
        }
      });
    });
  }
}
