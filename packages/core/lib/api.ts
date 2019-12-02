import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import Dat from './dat';
import DatLoaderBase, { LoadOptions } from './loader';

export type SwarmOptions = {
  autoSwarm?: boolean;
};

export default class HyperdriveAPI<D extends IHyperdrive> {
  public dats = new Map<string, Dat<D>>();
  public loader: DatLoaderBase<D>;

  constructor(loader: DatLoaderBase<D>) {
    this.loader = loader;
  }

  public async getDat(address: string, options?: LoadOptions & SwarmOptions): Promise<Dat<D>> {
    const autoSwarm = !options || options.autoSwarm !== false;
    const handleAutoJoin = async (datInst: Dat<D>) => {
      if (!datInst.isSwarming && autoSwarm) {
        await datInst.joinSwarm();
      }
    };
    if (this.dats.has(address)) {
      const datFromCache = this.dats.get(address);
      handleAutoJoin(datFromCache);
      return datFromCache;
    }
    const dat = await this.loader.load(Buffer.from(address, 'hex'), options);
    this.dats.set(address, dat);
    handleAutoJoin(dat);
    dat.on('close', () => this.dats.delete(address));
    return dat;
  }

  public async createDat(options?: LoadOptions & SwarmOptions) {
    const autoSwarm = !options || options.autoSwarm !== false;
    const dat = await this.loader.create(options);
    if (autoSwarm) {
      await dat.joinSwarm();
    }
    const address = dat.drive.key.toString('hex');
    this.dats.set(address, dat);
    dat.on('close', () => this.dats.delete(address));
    return dat;
  }

  public deleteDatData(address: string) {
    if (this.dats.has(address)) {
      const dat = this.dats.get(address);
      dat.close();
    }
    return this.loader.delete(address);
  }

  public shutdown() {
    for (const dat of this.dats.values()) {
      dat.close();
    }
    this.loader.swarm.close();
  }
}
