import Hyperdrive from '@sammacbeth/types/hyperdrive';
import Swarm from './swarm';

export default class Dat {
  drive: Hyperdrive
  swarm: Swarm
  isSwarming: boolean
  ready: Promise<void>

  constructor(drive: Hyperdrive, swarm: Swarm) {
    this.drive = drive;
    this.swarm = swarm;
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

  async joinSwarm() {
    this.swarm.add(this.drive);
    this.isSwarming = true;

    // await initial metadata sync if not the owner
    await this.ready;

    if (!this.drive.writable) {
      // always download all metadata
      this.drive.metadata.download({start: 0, end: -1})
    }
  }

  leaveSwarm() {
    if (this.isSwarming) {
      this.swarm.remove(this.drive);
      this.isSwarming = false;
    }
  }

  close() {
    this.leaveSwarm();
    this.drive.close();
  }
}
