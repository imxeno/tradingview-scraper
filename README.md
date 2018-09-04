TradingView Scraper for Node.js
================================
[![npm version](https://img.shields.io/npm/v/tradingview-scraper.svg)](https://npmjs.com/package/tradingview-scraper)
[![dependencies](https://img.shields.io/david/imxeno/tradingview-scraper.svg)](https://david-dm.org/imxeno/tradingview-scraper)
![license](https://img.shields.io/npm/l/tradingview-scraper.svg)

Really basic TradingView data scraper for Node.js.  
*warning: the implementation is a little bit dirty, but hey, it works!*

Installation
--------------------

```javascript
npm i tradingview-scraper --save
```

Featuring
--------------------
* real-time data freshly ~~stolen~~ borrowed from TradingView's socket.io interface
* almost 100% success rate of ~~stealing~~ borrowing data
* 1:1 accuracy of ~~stolen~~ borrowed data *#confirmed*
* HTTP Origin header spoofing so nobody will notice anything suspicious
* okay, let's finally go into the *serious mode*, shall we?

Constructor
--------------------
```javascript
const TradingViewAPI = require('tradingview-api');
const tv = new TradingViewAPI();
```
### new TradingViewAPI()

In order to request data from TradingView using this library, you need to instantiate a new object of TradingViewAPI. The constructor does not accept any parameters, and starts handling connection to TradingView's servers out of the box.

Methods
--------------------

List of all available methods for TradingViewAPI.


### getTicker(ticker)
Loads the data about `ticker` from TradingView.

Parameters:
* `ticker` is a ticker name, either 'pro' or 'short'

Returns a `Promise` which when resolved returns an object representing the current data for `ticker` on TradingView, for example:
```javascript
{ last_retrieved: 2018-09-04T14:07:06.909Z,
  ask: 0.8671,
  bid: 0.8666,
  s: 'ok',
  last_update: 2018-09-04T14:07:06.902Z,
  ch: 0.0058,
  chp: 0.67,
  current_session: 'market',
  description: 'U.S. DOLLAR / EURO',
  exchange: 'FX_IDC',
  fractional: false,
  high_price: 0.867,
  is_tradable: true,
  low_price: 0.8607,
  lp: 0.8666,
  minmov: 1,
  minmove2: 1,
  open_price: 0.8607,
  original_name: 'FX_IDC:USDEUR',
  prev_close_price: 0.8608,
  pricescale: 10000,
  pro_name: 'FX_IDC:USDEUR',
  short_name: 'USDEUR',
  type: 'forex',
  update_mode: 'streaming',
  volume: 0 }
```
The Promise may be rejected if the request was timed out.  
*warning: The request will timeout if the `ticker` does not exist on TradingView. That is an expected behavior.*

License
--------------------

ISC License

Copyright (c) 2018, Piotr Adamczyk

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.