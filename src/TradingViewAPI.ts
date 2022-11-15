import { TickerSubscription } from './TickerSubscription';
import { TradingViewWebSocket } from './TradingViewWebSocket';

export class TradingViewAPI {
  private subscriptionMap: Map<string, Set<TickerSubscription>> = new Map();
  private ws: TradingViewWebSocket = new TradingViewWebSocket();

  public async setup() {
    this.ws.on('data', (simpleOrProName: string, status: string, data: any) => {
      if (status !== 'ok') {
        return;
      }
      const subs = this.subscriptionMap.get(simpleOrProName);
      if (!subs) {
        return;
      }
      subs.forEach((s: TickerSubscription) => {
        if (s.canBeDestroyed) {
          subs.delete(s);
          s.destroyed = true;
          if (subs.size === 0) {
            this.ws.unregisterSymbol(s.simpleOrProName);
            this.subscriptionMap.delete(s.simpleOrProName);
          }
          return;
        }
        s.updateData(data);
      });
    });
    await this.ws.connect();
  }

  public async cleanup() {
    this.ws.disconnect();
  }

  public async getTicker(simpleOrProName: string): Promise<TickerSubscription> {
    const tickers = this.subscriptionMap.get(simpleOrProName);
    if (tickers) {
      return tickers.entries().next().value;
    }

    const ticker = new TickerSubscription(this, simpleOrProName);
    await ticker.fetch();
    return ticker;
  }

  public async ensureRegistered(ticker: TickerSubscription): Promise<void> {
    const tickers = this.subscriptionMap.get(ticker.simpleOrProName);
    if (tickers && tickers.has(ticker)) {
      return;
    }
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      let updated = false;
      const onUpdate = (data: any) => {
        if (!data.pro_name) {
          return;
        }
        updated = true;
        ticker.removeListener('update', onUpdate);
        resolve();
      };
      ticker.on('update', onUpdate);
      if (!tickers) {
        await this.ws.registerSymbol(ticker.simpleOrProName);
        this.subscriptionMap.set(ticker.simpleOrProName, new Set([ticker]));
      } else if (!tickers.has(ticker)) {
        await this.ws.registerSymbol(ticker.simpleOrProName);
        this.subscriptionMap.set(ticker.simpleOrProName, tickers.add(ticker));
      }
      setTimeout(() => {
        if (!updated) {
          ticker.removeListener('update', onUpdate);
          reject('Timed out.');
        }
      }, 3000);
    });
  }
}
