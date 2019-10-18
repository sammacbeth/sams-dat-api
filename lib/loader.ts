import { Hyperdrive } from '@sammacbeth/types/hyperdrive';
import ram = require('random-access-memory');
import { keyPair } from 'hypercore-crypto';
import Dat from './dat';
import Swarm from './swarm';

export type StorageOpts = {
  /**
   * Factory to create persistant storage for the given dat archive address. Returns
   * a RandomAccess factory as used by the hyperdrive constructor.
   */
  persistantStorageFactory?: (key: string) => Promise<Hyperdrive.RandomAccessFactory>
  /**
   * Function to delete the persistant storage for the specified dat address.
   */
  persistantStorageDeleter?: (key: string) => Promise<void>
}

export type DatConfig = {
  hyperdriveFactory: (storage: Hyperdrive.RandomAccessFactory, key: Buffer, opts?: Hyperdrive.HyperdriveOptions) => Hyperdrive.Hyperdrive
  swarmFactory: () => Swarm
}

export type LoadOptions = {
  persist: boolean
} & Hyperdrive.HyperdriveOptions

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

  async load(address: Buffer, options?: LoadOptions): Promise<Dat> {
    const addressStr = address.toString('hex');
    const persist = options.persist && this.config.persistantStorageFactory 
    const storage = persist ? await this.config.persistantStorageFactory(addressStr) : ram;
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

  async create(options: LoadOptions = { persist: true }): Promise<Dat> {
    const kp = keyPair();
    options.secretKey = kp.secretKey;
    return this.load(kp.publicKey, options);
  }

  async delete(address: string): Promise<void> {
    if (!this.config.persistantStorageDeleter) {
      throw new Error('No deletion function provided');
    }
    return this.config.persistantStorageDeleter(address);
  }
}