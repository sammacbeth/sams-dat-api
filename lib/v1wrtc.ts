import HyperdriveImpl = require('hyperdrive');
import DatLoaderBase, { StorageOpts } from './loader';
import { DiscoveryOptions } from './network/hyperdiscovery';
import HyperWebRTC, { WRTCDiscoveryOptions } from './network/hyperwebrtc';
import Hyperdrive from './types/hyperdrive';

export type CombinedOptions = {
  hyperdiscoveryOpts?: DiscoveryOptions,
  wrtcOpts?: WRTCDiscoveryOptions,
} & StorageOpts

/**
 * DatV1 with additional help from discovery-swarm-wrtc
 */
export default class DatV1WebRTCLoader extends DatLoaderBase<Hyperdrive> {
  constructor(opts?: CombinedOptions) {
    super({
      hyperdriveFactory: (storage, key, opts) => new HyperdriveImpl(storage, key, opts),
      swarmFactory: () => new HyperWebRTC(opts.hyperdiscoveryOpts || {}, opts.wrtcOpts || {}),
      persistantStorageFactory: opts && opts.persistantStorageFactory
    });
  }
}