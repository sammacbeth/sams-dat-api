import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import Hyperdrive, { IHyperdrive } from './hyperdrive';
import { IReplicableBase } from './replicable';
import ISwarm from './swarm';

interface IDatEvents {
  join: void;
  leave: void;
  close: void;
}

export interface ISwarmable<T extends IReplicableBase>
  extends StrictEventEmitter<EventEmitter, IDatEvents> {
  readonly swarm: ISwarm<T>;

  joinSwarm(): Promise<void>;
  leaveSwarm(): void;
  close(): void;
}

export interface IDat<D extends IHyperdrive> extends ISwarmable<D> {
  readonly drive: D;
}
