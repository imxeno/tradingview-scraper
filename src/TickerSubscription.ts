import { EventEmitter } from "events";
import { TradingViewAPI } from "./TradingViewAPI";

type TickerData = any;

export class TickerSubscription extends EventEmitter {
  public simpleOrProName: string;
  public due!: number;
  private api: TradingViewAPI;
  private tickerData: TickerData;
  private destroyed = false;

  constructor(api: TradingViewAPI, simpleOrProName: string) {
    super();
    this.api = api;
    this.simpleOrProName = simpleOrProName;
    this.refreshDue();
    this.on("newListener", () => {
      if (this.destroyed) {
        this.destroyed = false;
        this.api.ensureRegistered(this);
      }
    });
  }

  public updateData(tickerDataPatch: TickerData) {
    this.tickerData = {
      ...this.tickerData,
      ...tickerDataPatch,
      last_updated: new Date()
    };
    this.emit("update", this.tickerData);
  }

  public async fetch(): Promise<TickerData> {
    this.refreshDue();
    await this.api.ensureRegistered(this);
    return this.tickerData;
  }

  public canBeDestroyed(): boolean {
    if (this.due < Date.now() && this.listenerCount("update") === 0) {
      return true;
    }
    return false;
  }

  public onDestroy() {
    this.destroyed = true;
  }

  private refreshDue() {
    this.due = Date.now() + 5000;
  }
}
