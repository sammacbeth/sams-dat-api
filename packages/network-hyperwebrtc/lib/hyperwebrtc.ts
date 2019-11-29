import WRTCDiscovery = require('@geut/discovery-swarm-webrtc');
import HyperDiscovery, { DiscoveryOptions } from '@sammacbeth/dat-network-hyperdiscovery';
import { IReplicable } from '@sammacbeth/dat-types/lib/replicable';

export type WRTCDiscoveryOptions = {
  id?: Buffer;
  bootstrap?: string[];
  stream?: (info: any) => any;
  simplePeer?: any;
  maxPeers?: number;
  connectionTimeout?: number;
  requestTimeout?: number;
};

export default class HyperWebRTC<T extends IReplicable> extends HyperDiscovery<T> {
  public wrtc: WRTCDiscovery;

  constructor(discOpts?: DiscoveryOptions, wrtcOpts?: WRTCDiscoveryOptions) {
    super(discOpts);
    this.wrtc = WRTCDiscovery({
      bootstrap: ['https://signal.dat-web.eu'],
      id: this.disc.id,
      stream: this.disc._createReplicationStream.bind(this.disc),
      ...wrtcOpts, // this options will override the above if they are provided
    });
    this.events.push('candidates');
    this.events.forEach((event) => {
      this.wrtc.on(event, (...args) => {
        this.emit(event, ...args);
      });
    });
  }

  public add(feed: IReplicable) {
    this.disc.add(feed);
    this.wrtc.join(feed.discoveryKey);
  }

  public remove(feed: IReplicable) {
    this.disc.leave(feed.discoveryKey);
    this.wrtc.leave(feed.discoveryKey);
  }

  public close() {
    this.disc.removeAllListeners();
    this.wrtc.removeAllListeners();
    this.disc.close();
    this.wrtc.close();
  }
}
