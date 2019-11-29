import HyperdriveImpl = require('hyperdrive');
import Hyperdrive from '@sammacbeth/dat-types/lib/hyperdrive';
import DatLoaderBase, { StorageOpts } from '@sammacbeth/dat-api-core/lib/loader';
import HyperdriveAPI from '@sammacbeth/dat-api-core/lib/api';
import Hyperdiscovery, { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';

export class DatV1Loader extends DatLoaderBase<Hyperdrive> {
  constructor(opts?: StorageOpts & DiscoveryOptions) {
    super({
      hyperdriveFactory: (storage, key, opts) => new HyperdriveImpl(storage, key, opts),
      swarmFactory: () => new Hyperdiscovery(opts),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}

export type DatV1API = HyperdriveAPI<Hyperdrive>;

export default function apiFactory(opts?: StorageOpts & DiscoveryOptions): HyperdriveAPI<Hyperdrive> {
  return new HyperdriveAPI(new DatV1Loader(opts));
}
