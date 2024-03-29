import { EventEmitter } from 'events';
import randomstring from 'randomstring';
import TypedEmitter from 'typed-emitter';
import WebSocket from 'ws';

import { allQuoteFields } from './consts/QuoteFields';
import { SIOPacket } from './interfaces/SIOPacket';
import * as SIO from './utils/SIOProtocol';

type MessageEvents = {
  data: (simpleOrProName: string, status: string, data: any) => void;
};

export class TradingViewWebSocket extends (EventEmitter as new () => TypedEmitter<MessageEvents>) {
  public static UNAUTHORIZED_USER_TOKEN = 'unauthorized_user_token';
  private static DEFAULT_TIMEOUT = 3000;
  private static generateSession() {
    return 'qs_' + randomstring.generate({ length: 12, charset: 'alphabetic' });
  }

  private authToken = TradingViewWebSocket.UNAUTHORIZED_USER_TOKEN;

  private ws: WebSocket | null = null;
  private quoteSession: string | null = null;
  private subscriptions: Set<string> = new Set();

  public setAuthToken(token: string) {
    this.authToken = token;
  }

  public async connect() {
    this.quoteSession = null;
    this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
      origin: 'https://data.tradingview.com'
    });
    this.ws.on('message', message => this.wsOnMessage(message.toString()));
    await this.tvSessionReady();
  }

  public disconnect() {
    if (!this.ws) {
      return;
    }
    this.ws.close();
    this.ws = null;
    this.quoteSession = null;
    this.subscriptions = new Set();
  }

  public async registerSymbol(symbol: string) {
    if (this.subscriptions.has(symbol)) {
      return;
    }
    this.subscriptions.add(symbol);
    this.addQuoteSymbol(symbol);
  }

  public async unregisterSymbol(symbol: string) {
    if (!this.subscriptions.delete(symbol)) {
      return;
    }
    this.removeQuoteSymbol(symbol);
  }

  private onPacket(packet: SIOPacket) {
    if (packet.isKeepAlive) {
      // Handle protocol keepalive packets
      this.wsSendRaw('~h~' + (packet.data as string));
      return;
    }
    const data = packet.data;
    // Handle session packet
    if (data.session_id) {
      this.sendAuthToken();
      this.createQuoteSession();
      this.setQuoteFields(allQuoteFields);
      return;
    }
    if (
      data.m &&
      data.m === 'qsd' &&
      typeof data.p === 'object' &&
      data.p.length > 1 &&
      data.p[0] === this.quoteSession
    ) {
      const tickerData = data.p[1];
      this.emit('data', tickerData.n, tickerData.s, tickerData.v);
    }
  }

  private sendAuthToken() {
    this.wsSend('set_auth_token', [this.authToken]);
  }

  private createQuoteSession() {
    this.quoteSession = TradingViewWebSocket.generateSession();
    this.wsSend('quote_create_session', [this.quoteSession]);
  }

  private setQuoteFields(fields: string[]) {
    this.wsSend('quote_set_fields', [this.quoteSession, ...fields]);
  }

  private addQuoteSymbol(symbol: string) {
    this.ws?.send(SIO.createMessage('quote_add_symbols', [this.quoteSession, symbol]));
  }

  private removeQuoteSymbol(symbol: string) {
    this.ws?.send(SIO.createMessage('quote_remove_symbols', [this.quoteSession, symbol]));
  }

  private wsOnMessage(data: string) {
    const packets = SIO.parseMessages(data);
    packets.forEach((packet: SIOPacket) => this.onPacket(packet));
  }

  private wsSendRaw(message: string) {
    this.ws?.send(SIO.prependHeader(message));
  }

  private wsSend(func: string, args: any[]) {
    this.ws?.send(SIO.createMessage(func, args));
  }

  private async wsReady(timeout?: number) {
    if (!timeout) {
      timeout = TradingViewWebSocket.DEFAULT_TIMEOUT;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    return new Promise<void>((resolve, reject) => {
      let opened = false;
      const onOpen = () => {
        opened = true;
        resolve();
      };
      this.ws?.once('open', onOpen);
      setTimeout(() => {
        if (!opened) {
          this.ws?.removeListener('open', onOpen);
          reject();
        }
      }, timeout);
    });
  }

  private async tvSessionReady(timeout?: number) {
    if (!timeout) {
      timeout = TradingViewWebSocket.DEFAULT_TIMEOUT;
    }
    await this.wsReady(timeout);

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.quoteSession !== null) {
          resolve();
          clearInterval(interval);
        }
      }, 100);
      setTimeout(() => {
        if (interval) {
          clearInterval(interval);
          reject();
        }
      }, timeout);
    });
  }
}
