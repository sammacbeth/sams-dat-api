import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import Dat from './dat';
import DatLoaderBase, { LoadOptions } from './loader';

// Events emitted by the API
interface IAPIEvents {
  load: (dat: Dat<IHyperdrive>) => void;
  use: (dat: Dat<IHyperdrive>) => void;
  create: (dat: Dat<IHyperdrive>) => void;
  delete: (address: string) => void;
}

export type SwarmOptions = {
  autoSwarm?: boolean;
};

export default class HyperdriveAPI<
  D extends IHyperdrive
> extends (EventEmitter as new () => StrictEventEmitter<EventEmitter, IAPIEvents>) {
  public dats = new Map<string, Dat<D>>();
  public loader: DatLoaderBase<D>;

  constructor(loader: DatLoaderBase<D>) {
    super();
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
      this.emit('use', datFromCache);
      return datFromCache;
    }
    const dat = await this.loader.load(Buffer.from(address, 'hex'), options);
    this.dats.set(address, dat);
    handleAutoJoin(dat);
    dat.on('close', () => this.dats.delete(address));
    this.emit('load', dat);
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
    this.emit('create', dat);
    return dat;
  }

  public deleteDatData(address: string) {
    if (this.dats.has(address)) {
      const dat = this.dats.get(address);
      dat.close();
    }
    this.emit('delete', address);
    return this.loader.delete(address);
  }

  public shutdown() {
    for (const dat of this.dats.values()) {
      dat.close();
    }
    this.loader.swarm.close();
  }
}
