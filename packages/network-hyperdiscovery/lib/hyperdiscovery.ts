import Discovery = require('hyperdiscovery');
import { EventEmitter } from 'events';
import Swarm from '@sammacbeth/dat-types/lib/swarm';
import { Replicable } from '@sammacbeth/dat-types/lib/replicable';

export type DiscoveryOptions = {
  id?: Buffer
  port?: number[] | number
  utp?: any
  tcp?: any
  dht?: any
  autoListen?: boolean
}

export default class HyperDiscovery<T extends Replicable> extends EventEmitter implements Swarm<T> {
  disc: Discovery
  events = ['listening', 'join', 'leave', 'peer', 'connecting', 'connect-failed', 'handshaking',
  'handshake-timeout', 'connection', 'connection-closed', 'error']

  constructor(opts: DiscoveryOptions) {
    super();
    this.disc = Discovery(opts);
    this.events.forEach((event) => {
      this.disc.on(event, (...args) => this.emit(event, ...args));
    });
  }

  add(feed: Replicable) {
    this.disc.add(feed);
  }

  remove(feed: Replicable) {
    this.disc.leave(feed.discoveryKey);
  }

  close() {
    this.disc.removeAllListeners();
    this.disc.close();
  }
}
