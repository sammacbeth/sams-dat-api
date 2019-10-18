import { Hyperdrive } from '@sammacbeth/types/hyperdrive';
import ram = require('random-access-memory');
import { keyPair } from 'hypercore-crypto';
import Dat from './dat';
import Swarm from './swarm';

export type StorageOpts = {
  persistantStorageFactory?: (key: string) => Promise<Hyperdrive.RandomAccessFactory>
}

export type DatConfig = {
  hyperdriveFactory: (storage: Hyperdrive.RandomAccessFactory, key: Buffer, opts?: Hyperdrive.HyperdriveOptions) => Hyperdrive.Hyperdrive
  swarmFactory: () => Swarm
}

type LoadOptions = {
  persist: boolean
}

export default class DatLoaderBase {

  config: DatConfig & StorageOpts
  _swarm: Swarm

  constructor(config: DatConfig & StorageOpts) {
    this.config = config;
  }

  get swarm(): Swarm {
    if (!this._swarm) {
      this._swarm = this.config.swarmFactory();
    }
    return this._swarm;
  }

  async load(address: Buffer, options?: LoadOptions & Hyperdrive.HyperdriveOptions): Promise<Dat> {
    const addressStr = address.toString('hex');
    const storage = options.persist && this.config.persistantStorageFactory ? await this.config.persistantStorageFactory(addressStr) : ram;
    const drive = this.config.hyperdriveFactory(storage, address, options);
    // wait for drive to be ready
    await new Promise((resolve, reject) => {
      drive.ready(err => {
        if (err) reject(err)
        else resolve()
      })
    });
    const dat = new Dat(drive, this.swarm);
    return dat;
  }

  async create(options: LoadOptions & Hyperdrive.HyperdriveOptions = { persist: true }): Promise<Dat> {
    const kp = keyPair();
    options.secretKey = kp.secretKey;
    return this.load(kp.publicKey, options);
  }
}