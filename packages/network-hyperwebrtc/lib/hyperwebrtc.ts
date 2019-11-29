import WRTCDiscovery = require('@geut/discovery-swarm-webrtc');
import { Replicable } from '@sammacbeth/dat-types/lib/replicable';
import HyperDiscovery, { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';

export type WRTCDiscoveryOptions = {
  id?: Buffer
  bootstrap?: string[]
  stream?: (info: any) => any,
  simplePeer?: any,
  maxPeers?: number,
  connectionTimeout?: number,
  requestTimeout?: number,
}

export default class HyperWebRTC<T extends Replicable> extends HyperDiscovery<T> {
  wrtc: WRTCDiscovery

  constructor(discOpts?: DiscoveryOptions, wrtcOpts?: WRTCDiscoveryOptions) {
    super(discOpts);
    this.wrtc = WRTCDiscovery({
      id: this.disc.id,
      bootstrap: ['https://signal.dat-web.eu'],
      stream: this.disc._createReplicationStream.bind(this.disc),
      ...wrtcOpts, // this options will override the above if they are provided
    });
    this.events.push('candidates');
    this.events.forEach((event) => {
      this.wrtc.on(event, (...args) => {
        this.emit(event, ...args)
      });
    });
  }

  add(feed: Replicable) {
    this.disc.add(feed);
    this.wrtc.join(feed.discoveryKey);
  }

  remove(feed: Replicable) {
    this.disc.leave(feed.discoveryKey);
    this.wrtc.leave(feed.discoveryKey);
  }

  close() {
    this.disc.removeAllListeners();
    this.wrtc.removeAllListeners();
    this.disc.close();
    this.wrtc.close();
  }
}
