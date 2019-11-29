import ram = require('random-access-memory');
import { keyPair } from 'hypercore-crypto';
import ISwarm from '@sammacbeth/dat-types/lib/swarm';
import { ReplicableBase } from '@sammacbeth/dat-types/lib/replicable';
import { IHyperLoader } from '@sammacbeth/dat-types/lib/hyperloader';
import { HyperdriveOptions, IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { RandomAccessFactory } from '@sammacbeth/dat-types/lib/random-access';
import Dat from './dat';

export type StorageOpts = {
  /**
   * Factory to create persistant storage for the given dat archive address. Returns
   * a RandomAccess factory as used by the hyperdrive constructor.
   */
  persistantStorageFactory?: (key: string) => Promise<RandomAccessFactory>
  /**
   * Function to delete the persistant storage for the specified dat address.
   */
  persistantStorageDeleter?: (key: string) => Promise<void>
}

export type DatConfig<T extends ReplicableBase> = {
  hyperdriveFactory: (storage: RandomAccessFactory, key: Buffer, opts?: HyperdriveOptions) => T
  swarmFactory: () => ISwarm<T>
}

export type LoadOptions = {
  persist: boolean
} & HyperdriveOptions

export default class DatLoaderBase<T extends IHyperdrive> implements IHyperLoader<T, Dat<T>> {

  config: DatConfig<T> & StorageOpts
  _swarm: ISwarm<T>

  constructor(config: DatConfig<T> & StorageOpts) {
    this.config = config;
  }

  get swarm(): ISwarm<T> {
    if (!this._swarm) {
      this._swarm = this.config.swarmFactory();
    }
    return this._swarm;
  }

  async load(address: Buffer, options?: LoadOptions): Promise<Dat<T>> {
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

  async create(options: LoadOptions = { persist: true }): Promise<Dat<T>> {
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
