import HyperdriveAPI, { DatLoaderBase, DatOptions, StorageOpts } from '@sammacbeth/dat-api-core/';
import { Hyperdrive10 } from '@sammacbeth/dat-types/lib/hyperdrive';
import { IReplicableNoise } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
import HypercoreProtocol = require('hypercore-protocol');
import hyperdrive10Impl = require('hyperdrive');
import hyperswarm = require('hyperswarm');
import pump = require('pump');

export type HyperswarmOpts = {
  bootstrap?: string[];
  ephemeral?: boolean;
  maxServerSockets?: number;
  maxClientSockets?: number;
  maxPeers?: number;
  announceLocalAddress?: boolean;
};

export type CoreStoreOpts = {
  sparse?: boolean;
  stats?: boolean;
  cacheSize?: number;
};

class HyperSwarm<T extends IReplicableNoise> extends EventEmitter implements ISwarm<T> {
  private swarm: any;
  private feeds = new Map<string, [IReplicableNoise, JoinSwarmOptions]>();

  constructor(opts?: HyperswarmOpts) {
    super();
    this.swarm = hyperswarm(opts);
    this.swarm.on('connection', (connection, info) => {
      if (info.peer && this.feeds.has(info.peer.topic.toString('hex'))) {
        // if peer is provided we can replicate directly
        const [feed, feedOpts] = this.feeds.get(info.peer.topic.toString('hex'));
        const stream = feed.replicate(!!info.client, feedOpts);
        pump(connection, stream, connection);
      } else {
        const stream = new HypercoreProtocol(!!info.client, { live: true, encrypt: true });
        stream.on('handshake', () => {
          const deduped = info.deduplicate(stream.publicKey, stream.remotePublicKey);
          if (deduped) {
            return;
          }
          stream.on('discovery-key', (dbuf: Buffer) => {
            const dkey = dbuf.toString('hex');
            if (this.feeds.has(dkey)) {
              const [feed, feedOpts] = this.feeds.get(dkey);
              // TODO: can we do this with a public API?
              (feed as any)._corestore.replicate(!!info.client, {
                ...feedOpts,
                stream,
              });
            }
          });
        });
        pump(connection, stream, connection);
      }
    });
  }

  public async add(feed: IReplicableNoise, options: JoinSwarmOptions = {}) {
    const { announce = false, lookup = true, upload = true, download = true } = options;
    const opts = { announce, lookup, upload, download };
    feed.ready(() => {
      this.swarm.join(feed.discoveryKey, opts);
    });
    this.feeds.set(feed.discoveryKey.toString('hex'), [feed, opts]);
  }

  public remove(feed: IReplicableNoise) {
    this.swarm.leave(feed.discoveryKey);
    this.feeds.delete(feed.discoveryKey.toString('hex'));
  }

  public close() {
    return this.swarm.destroy();
  }
}

class CorestoreLoader extends DatLoaderBase<Hyperdrive10> {
  public corestore: any;
  public tmpstore: any;

  constructor(opts: StorageOpts & HyperswarmOpts) {
    super({
      hyperdriveFactory: (storage, key, driveOpts) => {
        return hyperdrive10Impl(storage, key, driveOpts);
      },
      swarmFactory: () => new HyperSwarm(opts),
      ...opts,
    });
  }

  public suspend(): void {
    super.suspend();
  }
}

export type DatV2API = HyperdriveAPI<Hyperdrive10>;

export default function apiFactory(
  opts?: StorageOpts & HyperswarmOpts,
  defaultDatOpts?: DatOptions,
): HyperdriveAPI<Hyperdrive10> {
  return new HyperdriveAPI(new CorestoreLoader(opts), defaultDatOpts);
}
