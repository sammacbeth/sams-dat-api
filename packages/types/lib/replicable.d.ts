import { Duplex } from 'stream';

interface IReplicableBase {
  /**
   * Buffer containing the public key identifying this feed.
   *
   * Populated after `ready` has been emitted. Will be `null` before the event.
   */
  key: Buffer;
  /**
   * Buffer containing a key derived from the feed.key. In contrast to feed.key this key does not allow you to verify the data but can be used to announce or look for peers that are sharing the same feed, without leaking the feed key.
   *
   * Populated after `ready` has been emitted. Will be `null` before the event.
   */
  discoveryKey: Buffer;
  ready(cb: (err?: Error | string) => void): void;
  close(): void;
}

export type ReplicationOptions = {
  live?: boolean;
  ack?: boolean;
  download?: boolean;
  encrypt?: boolean;
  upload?: boolean;
  stream?: any;
};

export type NoiseOptions = {
  keyPair?: {
    publicKey: Buffer;
    secretKey: Buffer;
  };
};

export interface IReplicable extends IReplicableBase {
  replicate(opts: ReplicationOptions): Duplex;
}

export interface IReplicableNoise extends IReplicableBase {
  replicate(isInitiator: boolean, opts: ReplicationOptions & NoiseOptions): Duplex;
}
