import { EventEmitter } from 'events';

import { IReplicable } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import Discovery = require('@sammacbeth/hyperdiscovery');

export type DiscoveryOptions = {
  id?: Buffer;
  port?: number[] | number;
  utp?: any;
  tcp?: any;
  dht?: any;
  autoListen?: boolean;
  upload?: boolean;
  download?: boolean;
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
    const autoListen = opts && opts.autoListen;
    this.disc = Discovery({
      ...opts,
      autoListen: false,
    });
    
    this.events.forEach((event) => {
      this.disc.on(event, (...args) => this.emit(event, ...args));
    });

    this.disc._port = opts && opts.port;
    if (autoListen) {
      this.disc.listen();
    }
  }

  public add(feed: IReplicable, options?: JoinSwarmOptions) {
    this.disc.add(feed, options);
  }

  public remove(feed: IReplicable) {
    this.disc.leave(feed.discoveryKey);
  }

  public close() {
    this.disc.removeAllListeners();
    this.disc.close();
  }
}
