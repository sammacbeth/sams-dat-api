import HyperdriveAPI, { DatLoaderBase, DatOptions, StorageOpts } from '@sammacbeth/dat-api-core/';
import { Hyperdrive10 } from '@sammacbeth/dat-types/lib/hyperdrive10';
import { IReplicableNoise } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
import hyperdrive10Impl = require('hyperdrive');
import Corestore = require('corestore');
import ram = require('random-access-memory');
import SwarmNetworker = require('corestore-swarm-networking');

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
  private ready: Promise<void>

  constructor(loader: CorestoreLoader, opts?: HyperswarmOpts) {
    super();
    this.ready = new Promise(async (resolve) => {
      await loader.ready;
      this.swarm = new SwarmNetworker(loader.corestore, opts);
      resolve();
    })
  }

  public async add(feed: IReplicableNoise, options: JoinSwarmOptions = {}) {
    const { announce = false, lookup = true, upload = true, download = true } = options;
    const opts = { announce, lookup, upload, download };
    await this.ready;
    await this.swarm.join(feed.discoveryKey, opts);
  }

  public remove(feed: IReplicableNoise) {
    this.swarm.leave(feed.discoveryKey);
  }

  public close() {
    return this.swarm.close();
  }
}

class CorestoreLoader extends DatLoaderBase<Hyperdrive10> {
  public corestore: any;
  public ready: Promise<void>

  constructor(opts: StorageOpts & HyperswarmOpts) {
    super({
      hyperdriveFactory: (storage, key, driveOpts) => {
        return hyperdrive10Impl(this.corestore, key, driveOpts);
      },
      swarmFactory: () => new HyperSwarm(this, opts),
      ...opts,
    });
    this.ready = new Promise(async (resolve) => {
      if (opts.persistantStorageFactory) {
        const storage = await opts.persistantStorageFactory('default');
        this.corestore = new Corestore(storage, opts);
      } else {
        this.corestore = new Corestore(ram, opts);
      }
      resolve();
    })
  }
}

export type DatV2API = HyperdriveAPI<Hyperdrive10>;

export default function apiFactory(
  opts?: StorageOpts & HyperswarmOpts,
  defaultDatOpts?: DatOptions,
): HyperdriveAPI<Hyperdrive10> {
  return new HyperdriveAPI(new CorestoreLoader(opts), defaultDatOpts);
}
