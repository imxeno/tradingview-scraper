const { TradingViewAPI } = require("../dist");

const bitcoinSymbol = "BTCUSD";
const tv = new TradingViewAPI();

tv.setup().then(() =>
  tv.getTicker(bitcoinSymbol).then(ticker =>
    ticker
      .fetch()
      .then(console.log)
      .then(() => {
        tv.cleanup();
      })
  )
);
