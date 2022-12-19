import { TradingViewAPI } from '../dist';

const bitcoinSymbol = 'BTCUSD';
const tv = new TradingViewAPI();

const token = 'YOUR_AUTHENTICATED_TOKEN';

console.log('Loading...');

tv.setAuthToken(token);

tv.setup().then(() => {
  tv.getTicker(bitcoinSymbol).then(ticker => {
    let last = 0;
    ticker.on('update', data => {
      if (data.lp && data.lp !== last) {
        console.log(
          '[' + bitcoinSymbol + '] ' + (last > data.lp ? '-' : '+') + ' ' + data.lp.toFixed(2) + ' '
        );
        last = data.lp;
      }
    });
  });
});
