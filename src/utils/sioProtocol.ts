import { SIOPacket } from '../interfaces/sioPacket';

export const parseMessages = (str: string): SIOPacket[] => {
  const packets = [];
  while (str.length > 0) {
    const x = /~m~(\d+)~m~/.exec(str);
    if (!x || x.length < 2) {
      throw new Error('Invalid Socket.IO packet');
    }
    const packet = str.slice(x[0].length, x[0].length + parseInt(x[1], 10));
    if (packet.slice(0, 3) !== '~h~') {
      packets.push({ isKeepAlive: false, data: JSON.parse(packet) });
    } else {
      packets.push({ isKeepAlive: true, data: packet.slice(3) });
    }

    str.slice(0, x[0].length);
    str = str.slice(x[0].length + parseInt(x[1], 10));
  }
  return packets;
};

export const prependHeader = (str: string) => {
  return '~m~' + str.length + '~m~' + str;
};

export const createMessage = (func: string, paramList: any[]) => {
  return prependHeader(constructMessage(func, paramList));
};

const constructMessage = (func: string, paramList: any[]) => {
  return JSON.stringify({
    m: func,
    p: paramList
  });
};
