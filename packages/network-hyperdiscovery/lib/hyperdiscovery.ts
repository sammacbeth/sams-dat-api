import { IReplicable } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
import Discovery = require('hyperdiscovery');

export type DiscoveryOptions = {
  id?: Buffer;
  port?: number[] | number;
  utp?: any;
  tcp?: any;
  dht?: any;
  autoListen?: boolean;
};

export default class HyperDiscovery<T extends IReplicable> extends EventEmitter
  implements ISwarm<T> {
  public disc: Discovery;
  public events = [
    'listening',
    'join',
    'leave',
    'peer',
    'connecting',
    'connect-failed',
    'handshaking',
    'handshake-timeout',
    'connection',
    'connection-closed',
    'error',
  ];

  constructor(opts: DiscoveryOptions) {
    super();
    this.disc = Discovery(opts);
    this.events.forEach((event) => {
      this.disc.on(event, (...args) => this.emit(event, ...args));
    });
  }

  public add(feed: IReplicable) {
    this.disc.add(feed);
  }

  public remove(feed: IReplicable) {
    this.disc.leave(feed.discoveryKey);
  }

  public close() {
    this.disc.removeAllListeners();
    this.disc.close();
  }
}
