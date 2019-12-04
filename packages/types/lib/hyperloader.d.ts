import { IDat, ISwarmable } from "./dat";
import { IReplicable, IReplicableBase } from "./replicable";
import ISwarm from "./swarm";

export interface IHyperLoader<T extends IReplicableBase, D extends ISwarmable> {
  swarm: ISwarm<T>
  load(address: Buffer, options: any): Promise<D>
  create(): Promise<D>
  delete(address: string): Promise<void>
}