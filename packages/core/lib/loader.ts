import { HyperdriveOptions, IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { IHyperLoader } from '@sammacbeth/dat-types/lib/hyperloader';
import { RandomAccessFactory } from '@sammacbeth/dat-types/lib/random-access';
import { IReplicableBase } from '@sammacbeth/dat-types/lib/replicable';
import ISwarm from '@sammacbeth/dat-types/lib/swarm';
import { keyPair } from 'hypercore-crypto';
import ram = require('random-access-memory');
import Dat from './dat';

export type StorageOpts = {
  /**
   * Factory to create persistant storage for the given dat archive address. Returns
   * a RandomAccess factory as used by the hyperdrive constructor.
   */
  persistantStorageFactory?: (key: string) => Promise<RandomAccessFactory>;
  /**
   * Function to delete the persistant storage for the specified dat address.
   */
  persistantStorageDeleter?: (key: string) => Promise<void>;
};

export type DatConfig<T extends IReplicableBase> = {
  hyperdriveFactory: (storage: RandomAccessFactory, key: Buffer, opts?: HyperdriveOptions) => T;
  swarmFactory: () => ISwarm<T>;
};

export type LoadOptions = {
  persist?: boolean;
  driveOptions?: HyperdriveOptions;
};

export default class DatLoaderBase<T extends IHyperdrive>
  implements IHyperLoader<IHyperdrive, Dat<IHyperdrive>> {
  protected pSwarm: ISwarm<T>;

  constructor(public config: DatConfig<T> & StorageOpts) {}

  get swarm(): ISwarm<T> {
    if (!this.pSwarm) {
      this.pSwarm = this.config.swarmFactory();
    }
    return this.pSwarm;
  }

  public async load(address: Buffer, options?: LoadOptions): Promise<Dat<T>> {
    const addressStr = address.toString('hex');
    const persist = options.persist && this.config.persistantStorageFactory;
    const storage = persist ? await this.config.persistantStorageFactory(addressStr) : ram;
    const drive = this.config.hyperdriveFactory(storage, address, options.driveOptions);
    // wait for drive to be ready
    await new Promise((resolve, reject) => {
      drive.ready((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    const dat = new Dat(drive, this.swarm, !!persist);
    return dat;
  }

  public async create(options: LoadOptions = { persist: true }): Promise<Dat<T>> {
    const kp = keyPair();
    options.driveOptions = {
      keyPair: kp,
      secretKey: kp.secretKey,
      ...options.driveOptions,
    };
    return this.load(kp.publicKey, options);
  }

  public async delete(address: string): Promise<void> {
    if (!this.config.persistantStorageDeleter) {
      throw new Error('No deletion function provided');
    }
    return this.config.persistantStorageDeleter(address);
  }

  /**
   * Shutdown swarm and suspend network activity
   */
  public suspend(): void {
    if (this.pSwarm) {
      this.pSwarm.close();
      this.pSwarm = null;
    }
  }
}
