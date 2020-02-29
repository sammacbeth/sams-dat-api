import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import { IHyperdrive } from './hyperdrive';
import { IReplicableBase } from './replicable';
import ISwarm, { JoinSwarmOptions } from './swarm';

interface IDatEvents {
  join: void;
  leave: void;
  close: void;
}

export interface ISwarmable extends StrictEventEmitter<EventEmitter, IDatEvents> {
  isSwarming: boolean;
  joinSwarm(options?: JoinSwarmOptions): Promise<void>;
  leaveSwarm(): void;
  close(): void;
}

export interface IDat extends ISwarmable {
  readonly drive: IHyperdrive;
  /** true iff the dat currently swarming in the network */
  isSwarming: boolean;
  /** true iff the dat's hyperdrive is open */
  isOpen: boolean;
  /** true iff the dat is writable */
  isOwner: boolean;
  /** true iff this dat is using a persistant store */
  isPersisted: boolean;
  /** Promise that resolves once the `drive` is ready to use */
  ready: Promise<void>;
}
