# TradingView Scraper for Node.js

[![npm version](https://img.shields.io/npm/v/tradingview-scraper.svg)](https://npmjs.com/package/tradingview-scraper)
[![dependencies](https://img.shields.io/david/imxeno/tradingview-scraper.svg)](https://david-dm.org/imxeno/tradingview-scraper)
![types](https://img.shields.io/npm/types/tradingview-scraper)
![license](https://img.shields.io/npm/l/tradingview-scraper.svg)

Really basic TradingView data scraper for Node.js.  
_warning: the implementation is a little bit dirty, but hey, it works!_

## Installation

```javascript
yarn add tradingview-scraper
```

## Featuring

- brand-shiny-new typescript typings
- real-time data freshly ~~stolen~~ borrowed from TradingView's socket.io interface
- almost 100% success rate of ~~stealing~~ borrowing data
- 1:1 accuracy of ~~stolen~~ borrowed data _#confirmed_
- HTTP Origin header spoofing so nobody will notice anything suspicious
- okay, let's finally go into the _serious mode_, shall we?

## Constructor

```javascript
import { TradingViewAPI } from "tradingview-scraper";
const tv = new TradingViewAPI();
```

### new TradingViewAPI()

In order to request data from TradingView using this library, you need to instantiate a new object of TradingViewAPI. The constructor does not accept any parameters, and starts handling connection to TradingView's servers out of the box.

## Methods

List of all available methods for TradingViewAPI.

### getTicker(ticker)

Loads the data about `ticker` from TradingView.

Parameters:

- `ticker` is a ticker name, either 'pro' or 'short'

Returns a `Promise` which when resolved returns an object representing the current data for `ticker` on TradingView, for example:

```javascript
{ last_retrieved: 2020-11-30T21:04:33.099Z,
  ch: -236.23,
  chp: -3.05,
  current_session: 'market',
  description: 'Bitcoin / U.S. dollar',
  exchange: 'BITSTAMP',
  fractional: false,
  high_price: 781523,
  is_tradable: true,
  low_price: 745221.08,
  lp: 751727.46,
  minmov: 1,
  minmove2: 0,
  open_price: 775321.69,
  original_name: 'BITSTAMP:BTCUSD',
  prev_close_price: 775321.69,
  pricescale: 100,
  pro_name: 'BITSTAMP:BTCUSD',
  short_name: 'BTCUSD',
  type: 'bitcoin',
  update_mode: 'streaming',
  volume: 5167.07349537,
  s: 'ok',
  last_update: 2020-11-30T21:04:21.842Z,
  ask: 752026.56,
  bid: 751628.22 }
```

The Promise may be rejected if the request was timed out.  
_warning: The request will timeout if the `ticker` does not exist on TradingView. That is an expected behavior._

## License

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
