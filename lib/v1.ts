import HyperdriveImpl = require('hyperdrive');
import Hyperdrive from './types/hyperdrive';
import DatLoaderBase, { StorageOpts } from './loader';
import Hyperdiscovery, { DiscoveryOptions } from './network/hyperdiscovery';

export default class DatV1Loader extends DatLoaderBase<Hyperdrive> {
  constructor(opts?: StorageOpts & DiscoveryOptions) {
    super({
      hyperdriveFactory: (storage, key, opts) => new HyperdriveImpl(storage, key, opts),
      swarmFactory: () => new Hyperdiscovery(opts),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}
