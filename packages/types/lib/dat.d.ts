import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import { IHyperdrive } from './hyperdrive';
import { IReplicableBase } from './replicable';
import ISwarm from './swarm';

interface IDatEvents {
  join: void;
  leave: void;
  close: void;
}

export interface ISwarmable extends StrictEventEmitter<EventEmitter, IDatEvents> {
  isSwarming: boolean;
  joinSwarm(): Promise<void>;
  leaveSwarm(): void;
  close(): void;
}

export interface IDat extends ISwarmable {
  readonly drive: IHyperdrive;
  isSwarming: boolean;
  isOpen: boolean;
  isOwner: boolean;
  ready: Promise<void>;
}
