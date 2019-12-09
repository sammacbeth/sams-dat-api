import HyperdriveAPI, { DatLoaderBase, StorageOpts } from '@sammacbeth/dat-api-core';
import { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';
import HyperWebRTC, { WRTCDiscoveryOptions } from '@sammacbeth/dat-network-hyperwebrtc';
import { Hyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import HyperdriveImpl = require('hyperdrive');

export type CombinedOptions = {
  hyperdiscoveryOpts?: DiscoveryOptions;
  wrtcOpts?: WRTCDiscoveryOptions;
} & StorageOpts;

/**
 * DatV1 with additional help from discovery-swarm-wrtc
 */
export class DatV1WebRTCLoader extends DatLoaderBase<Hyperdrive> {
  constructor(opts: CombinedOptions = {}) {
    super({
      hyperdriveFactory: (storage, key, driveOpts) => new HyperdriveImpl(storage, key, driveOpts),
      swarmFactory: () => new HyperWebRTC(opts.hyperdiscoveryOpts || {}, opts.wrtcOpts || {}),
      ...opts,
    });
  }
}

export type DatV1API = HyperdriveAPI<Hyperdrive>;

export default function apiFactory(opts?: CombinedOptions): HyperdriveAPI<Hyperdrive> {
  return new HyperdriveAPI(new DatV1WebRTCLoader(opts));
}
