import StrictEventEmitter from 'strict-event-emitter-types';
import { EventEmitter } from 'events';
import { ReplicableBase } from "./replicable";
import Swarm from "./swarm";
import Hyperdrive from './hyperdrive';

interface DatEvents {
  join: void
  leave: void
  close: void
}

export interface Swarmable<T extends ReplicableBase> extends StrictEventEmitter<EventEmitter, DatEvents> {
  readonly swarm: Swarm<T>

  joinSwarm(): Promise<void>
  leaveSwarm(): void
  close(): void
}

export interface IDat<D extends Hyperdrive> extends Swarmable<D>, StrictEventEmitter<EventEmitter, DatEvents> {
  readonly drive: D
}
