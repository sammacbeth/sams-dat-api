import { IDat, ISwarmable } from '@sammacbeth/dat-types/lib/dat';
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { IReplicableBase } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';

export default class Dat<D extends IHyperdrive & IReplicableBase> extends EventEmitter
  implements IDat, ISwarmable {
  public swarm: ISwarm<D>;
  public ready: Promise<void>;

  public drive: D;

  public isSwarming = false;
  public isOpen = true;

  constructor(data: D, swarm: ISwarm<D>, public isPersisted: boolean) {
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

  public async joinSwarm(options?: JoinSwarmOptions) {
    this.swarm.add(this.drive, options);
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
    if (this.isSwarming) {
      this.swarm.remove(this.drive);
      this.isSwarming = false;
      this.emit('leave');
    }
  }

  public close() {
    this.leaveSwarm();
    this.drive.close();
    this.isOpen = false;
    this.emit('close');
  }
}
