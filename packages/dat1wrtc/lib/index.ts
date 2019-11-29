import HyperdriveImpl = require('hyperdrive');
import Hyperdrive from '@sammacbeth/dat-types/lib/hyperdrive';
import DatLoaderBase, { StorageOpts } from '@sammacbeth/dat-api-core/lib/loader';
import HyperdriveAPI from '@sammacbeth/dat-api-core/lib/api';
import { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';
import HyperWebRTC, { WRTCDiscoveryOptions } from '@sammacbeth/dat-network-hyperwebrtc';

export type CombinedOptions = {
  hyperdiscoveryOpts?: DiscoveryOptions,
  wrtcOpts?: WRTCDiscoveryOptions,
} & StorageOpts;

/**
 * DatV1 with additional help from discovery-swarm-wrtc
 */
export class DatV1WebRTCLoader extends DatLoaderBase<Hyperdrive> {
  constructor(opts: CombinedOptions = {}) {
    super({
      hyperdriveFactory: (storage, key, opts) => new HyperdriveImpl(storage, key, opts),
      swarmFactory: () => new HyperWebRTC(opts.hyperdiscoveryOpts || {}, opts.wrtcOpts || {}),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}

export type DatV1API = HyperdriveAPI<Hyperdrive>;

export default function apiFactory(opts?: CombinedOptions): HyperdriveAPI<Hyperdrive> {
  return new HyperdriveAPI(new DatV1WebRTCLoader(opts));
}
