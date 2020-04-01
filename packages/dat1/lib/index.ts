import HyperdriveAPI, { DatLoaderBase, DatOptions, StorageOpts } from '@sammacbeth/dat-api-core/';
import Hyperdiscovery, { DiscoveryOptions, HyperswarmOpts } from '@sammacbeth/dat-network-hyperdiscovery';
import { Hyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import HyperdriveImpl = require('hyperdrive');

export type ApiOpts = StorageOpts & {
  discoveryOpts?: DiscoveryOptions,
  hyperswarmOpts?: HyperswarmOpts,
};

export class DatV1Loader extends DatLoaderBase<Hyperdrive> {
  constructor(opts?: ApiOpts) {
    super({
      hyperdriveFactory: (storage, key, driveOpts) => new HyperdriveImpl(storage, key, driveOpts),
      swarmFactory: () => new Hyperdiscovery(opts?.discoveryOpts, opts?.hyperswarmOpts),
      ...opts,
    });
  }
}

export type DatV1API = HyperdriveAPI<Hyperdrive>;

export default function apiFactory(
  opts?: ApiOpts,
  defaultDatOpts?: DatOptions,
): HyperdriveAPI<Hyperdrive> {
  return new HyperdriveAPI(new DatV1Loader(opts), defaultDatOpts);
}
