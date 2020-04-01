import { EventEmitter } from 'events';

import { IReplicable } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import Discovery = require('@sammacbeth/hyperdiscovery');

import hyperswarm = require('hyperswarm');
import pump = require('pump');

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

export type HyperswarmOpts = {
  bootstrap?: string[];
  ephemeral?: boolean;
  maxServerSockets?: number;
  maxClientSockets?: number;
  maxPeers?: number;
  announceLocalAddress?: boolean;
};

export default class HyperDiscovery<T extends IReplicable> extends EventEmitter
  implements ISwarm<T> {
  public disc: Discovery;
  public hyperswarm: any;
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

  constructor(opts: DiscoveryOptions, hyperswarmOpts?: HyperswarmOpts) {
    super();
    const autoListen = opts && opts.autoListen;
    this.disc = Discovery({
      ...opts,
      autoListen: false,
    });
    this.hyperswarm = hyperswarm(hyperswarmOpts)
    
    this.events.forEach((event) => {
      this.disc.on(event, (...args) => this.emit(event, ...args));
      this.hyperswarm.on(event, (...args) => this.emit(event, ...args));
    });

    this.disc._port = opts && opts.port;
    if (autoListen) {
      this.disc.listen();
    }

    this.hyperswarm.on('connection', (connection, info) => {
      const stream = this.disc._createReplicationStream(info.peer || {})
      pump(connection, stream, connection);
    });
  }

  get port() {
    return this.disc._port
  }

  public add(feed: IReplicable, options: JoinSwarmOptions = {}) {
    const { announce = true, lookup = true, upload = true, download = true } = options;
    const opts = { announce, lookup, upload, download };
    this.disc.add(feed, opts);
    this.hyperswarm.join(feed.discoveryKey, opts);
  }

  public remove(feed: IReplicable) {
    this.disc.leave(feed.discoveryKey);
    this.hyperswarm.leave(feed.discoveryKey);
  }

  public close() {
    this.disc.removeAllListeners();
    this.disc.close();
    this.hyperswarm.destroy();
  }
}
