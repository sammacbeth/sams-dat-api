import Hyperdrive = require('hyperdrive');
import API, { StorageOpts } from './api';
import Hyperdiscovery, { DiscoveryOptions } from './network/hyperdiscovery';

export default class DatV1 extends API {
  constructor(opts?: StorageOpts & DiscoveryOptions) {
    super({
      hyperdriveFactory: (storage, key, opts) => new Hyperdrive(storage, key, opts),
      swarmFactory: () => new Hyperdiscovery(opts),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}
