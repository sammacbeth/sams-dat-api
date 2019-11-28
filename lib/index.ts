import Dat from "./dat";
import DatLoaderBase, { LoadOptions } from "./loader";
import { HyperdriveCommon } from './types/hyperdrive';

export type SwarmOptions = {
  autoSwarm?: boolean,
};

export default class API<D extends HyperdriveCommon> {
  dats = new Map<string, Dat<D>>();
  loader: DatLoaderBase<D>

  constructor(loader: DatLoaderBase<D>) {
    this.loader = loader;
  }

  async getDat(address: string, options?: LoadOptions & SwarmOptions): Promise<Dat<D>> {
    const autoSwarm = !options || options.autoSwarm !== false;
    const handleAutoJoin = async (dat: Dat<D>) => {
      if (!dat.isSwarming && autoSwarm) {
        await dat.joinSwarm();
      }
    }
    if (this.dats.has(address)) {
      const dat = this.dats.get(address);
      handleAutoJoin(dat);
      return dat;
    }
    const dat = await this.loader.load(Buffer.from(address, 'hex'), options);
    this.dats.set(address, dat);
    handleAutoJoin(dat);
    dat.on('close', () => this.dats.delete(address));
    return dat;
  }

  async createDat(options?: LoadOptions & SwarmOptions) {
    const autoSwarm = !options || options.autoSwarm === false;
    const dat = await this.loader.create(options);
    if (autoSwarm) {
      await dat.joinSwarm();
    }
    const address = dat.drive.key.toString('hex')
    this.dats.set(address, dat);
    dat.on('close', () => this.dats.delete(address));
    return dat;
  }

  deleteDatData(address: string) {
    if (this.dats.has(address)) {
      const dat = this.dats.get(address);
      dat.close();
    }
    return this.loader.delete(address);
  }

  shutdown() {
    for (const dat of this.dats.values()) {
      dat.close();
    }
    this.loader.swarm.close();
  }
}
