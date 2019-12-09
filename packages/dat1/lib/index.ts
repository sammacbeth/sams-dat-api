import HyperdriveAPI, { DatLoaderBase, StorageOpts } from '@sammacbeth/dat-api-core/';
import Hyperdiscovery, { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';
import { Hyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import HyperdriveImpl = require('hyperdrive');

export class DatV1Loader extends DatLoaderBase<Hyperdrive> {
  constructor(opts?: StorageOpts & DiscoveryOptions) {
    super({
      hyperdriveFactory: (storage, key, driveOpts) => new HyperdriveImpl(storage, key, driveOpts),
      swarmFactory: () => new Hyperdiscovery(opts),
      ...opts,
    });
  }
}

export type DatV1API = HyperdriveAPI<Hyperdrive>;

export default function apiFactory(
  opts?: StorageOpts & DiscoveryOptions,
): HyperdriveAPI<Hyperdrive> {
  return new HyperdriveAPI(new DatV1Loader(opts));
}
