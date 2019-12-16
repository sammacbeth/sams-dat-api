import { EventEmitter } from 'events';
import { IReplicable, IReplicableBase } from './replicable';

export type JoinSwarmOptions = {
  announce?: boolean;
  lookup?: boolean;
  upload?: boolean;
  download?: boolean;
};
/**
 * A Swarm is able to find peers and initiate replication with them via the provided
 * data structure's `replicate` method.
 */
export default interface ISwarm<T extends IReplicableBase> extends EventEmitter {
  events?: string[];
  add(feed: T, options?: JoinSwarmOptions): void;
  remove(feed: T): void;
  close(): void;
}
