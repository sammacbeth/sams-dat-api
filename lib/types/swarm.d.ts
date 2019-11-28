import { EventEmitter } from "events";
import { Replicable, ReplicableBase } from "./replicable";

/**
 * A Swarm is able to find peers and initiate replication with them via the provided
 * data structure's `replicate` method. 
 */
export default interface Swarm<T extends ReplicableBase> extends EventEmitter {
  events?: string[]
  add(feed: T): void
  remove(feed: T): void
  close(): void
}
