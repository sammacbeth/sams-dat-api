import Hyperdrive = require('hyperdrive');
import DatLoaderBase, { StorageOpts } from './loader';
import Hyperdiscovery, { DiscoveryOptions } from './network/hyperdiscovery';

export default class DatV1Loader extends DatLoaderBase {
  constructor(opts?: StorageOpts & DiscoveryOptions) {
    super({
      hyperdriveFactory: (storage, key, opts) => new Hyperdrive(storage, key, opts),
      swarmFactory: () => new Hyperdiscovery(opts),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}
