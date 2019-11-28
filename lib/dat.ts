import StrictEventEmitter from 'strict-event-emitter-types';
import { EventEmitter } from 'events';
import Hyperdrive, { HyperdriveCommon } from './types/hyperdrive';
import createDatArchive, { DatArchive } from './dat-archive';
import { IDat } from './types/dat';
import { ReplicableBase } from './types/replicable';
import Swarm from './types/swarm';

interface DatEvents {
  join: void
  leave: void
  close: void
}

export default class Dat<D extends HyperdriveCommon & ReplicableBase> extends EventEmitter implements IDat<D>  {
  _archive: DatArchive
  swarm: Swarm<D>
  ready: Promise<void>

  drive: D

  isSwarming = false
  isOpen = true
  locks = new Set<string>()

  constructor(data: D, swarm: Swarm<D>) {
    super();
    this.drive = data;
    this.swarm = swarm;
    this.ready = Promise.resolve();
    this.ready = new Promise((resolve, reject) => {
      if (!this.drive.writable && !this.drive.metadata.length) {
        this.drive.metadata.update(err => {
          if (err) reject(err)
          else resolve()
        })
      } else {
        resolve();
      }
    });
  }

  get isOwner() {
    return this.drive.writable;
  }

  get archive() {
    if (!this._archive) {
      this._archive = createDatArchive(this.drive);
    }
    return this._archive;
  }

  async joinSwarm() {
    this.swarm.add(this.drive);
    this.emit('join');
    this.isSwarming = true;

    // await initial metadata sync if not the owner
    await this.ready;

    if (!this.drive.writable) {
      // always download all metadata
      this.drive.metadata.download({start: 0, end: -1})
    }
  }

  leaveSwarm() {
    if (this.isSwarming && !this.locked) {
      this.swarm.remove(this.drive);
      this.isSwarming = false;
      this.emit('leave');
    }
  }

  close() {
    if (this.locked) {
      return;
    }
    this.leaveSwarm();
    this.drive.close();
    this.isOpen = false;
    this.emit('close');
  }

  get locked() {
    return this.locks.size > 0;
  }

  lock(key: string) {
    this.locks.add(key);
  }

  unlock(key: string) {
    this.locks.delete(key);
  }
}
