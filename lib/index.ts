import Dat from "./dat";
import DatLoaderBase, { LoadOptions } from "./loader";

export default class API {
  dats = new Map<string, Dat>();
  loader: DatLoaderBase

  constructor(loader: DatLoaderBase) {
    this.loader = loader;
  }

  async getDat(address: string, autoSwarm = true, options?: LoadOptions ): Promise<Dat> {
    const handleAutoJoin = async (dat: Dat) => {
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

  async createDat(autoSwarm = true, options?: LoadOptions) {
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