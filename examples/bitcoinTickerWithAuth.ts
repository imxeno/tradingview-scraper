const { TradingViewAPI } = require("../dist");

const bitcoinSymbol = "BTCUSD";
const tv = new TradingViewAPI();

const token = "YOUR_AUTHENTICATED_TOKEN";

process.stdout.write("Loading...");

tv.setAuthToken(token);

tv.setup().then(() => {
  tv.getTicker(bitcoinSymbol).then(ticker => {
    let last = 0;
    ticker.on("update", data => {
      if (data.lp && data.lp !== last) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
          "[" +
            bitcoinSymbol +
            "] " +
            (last > data.lp ? "-" : "+") +
            " " +
            data.lp.toFixed(2) +
            " "
        );
        last = data.lp;
      }
    });
  });
});