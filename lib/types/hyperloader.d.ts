import { Replicable, ReplicableBase } from "./replicable";
import Swarm from "./swarm";
import { IDat, Swarmable } from "./dat";

export interface HyperLoader<T extends ReplicableBase, D extends Swarmable<T>> {
  swarm: Swarm<T>
  load(address: Buffer, options: any): Promise<D>
  create(): Promise<D>
  delete(address: string): Promise<void>
}