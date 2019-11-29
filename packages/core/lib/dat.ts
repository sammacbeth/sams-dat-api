import { IDat } from '@sammacbeth/dat-types/lib/dat';
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { IReplicableBase } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
// import createDatArchive, { DatArchive } from './dat-archive';

export default class Dat<D extends IHyperdrive & IReplicableBase> extends EventEmitter
  implements IDat<D> {
  // _archive: DatArchive
  public swarm: ISwarm<D>;
  public ready: Promise<void>;

  public drive: D;

  public isSwarming = false;
  public isOpen = true;
  protected locks = new Set<string>();

  constructor(data: D, swarm: ISwarm<D>) {
    super();
    this.drive = data;
    this.swarm = swarm;
    this.ready = Promise.resolve();
    this.ready = new Promise((resolve, reject) => {
      if (!this.drive.writable && !this.drive.metadata.length) {
        this.drive.metadata.update((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  get isOwner() {
    return this.drive.writable;
  }

  // get archive() {
  //   if (!this._archive) {
  //     this._archive = createDatArchive(this.drive);
  //   }
  //   return this._archive;
  // }

  public async joinSwarm() {
    this.swarm.add(this.drive);
    this.emit('join');
    this.isSwarming = true;

    // await initial metadata sync if not the owner
    await this.ready;

    if (!this.drive.writable) {
      // always download all metadata
      this.drive.metadata.download({ start: 0, end: -1 });
    }
  }

  public leaveSwarm() {
    if (this.isSwarming && !this.locked) {
      this.swarm.remove(this.drive);
      this.isSwarming = false;
      this.emit('leave');
    }
  }

  public close() {
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

  public lock(key: string) {
    this.locks.add(key);
  }

  public unlock(key: string) {
    this.locks.delete(key);
  }
}