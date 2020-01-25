import { IDat } from '@sammacbeth/dat-types/lib/dat';
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';
import { LoadOptions } from './loader';
import { IHyperLoader } from '@sammacbeth/dat-types/lib/hyperloader';

// Events emitted by the API
interface IAPIEvents {
  load: (dat: IDat) => void;
  use: (dat: IDat) => void;
  create: (dat: IDat) => void;
  close: (address: string) => void;
  delete: (address: string) => void;
}

export type SwarmOptions = {
  autoSwarm?: boolean;
};
export type DatOptions = LoadOptions &
  SwarmOptions & {
    swarmOptions?: JoinSwarmOptions;
  };

function mergeOptions(defaults: DatOptions, options?: DatOptions): DatOptions {
  if (!options) {
    return defaults;
  }
  options.driveOptions = {
    ...defaults.driveOptions,
    ...options.driveOptions,
  };
  options.swarmOptions = {
    ...defaults.swarmOptions,
    ...options.swarmOptions,
  };
  return {
    ...defaults,
    ...options,
  };
}

export default class HyperdriveAPI<
  D extends IHyperdrive
> extends (EventEmitter as new () => StrictEventEmitter<EventEmitter, IAPIEvents>) {
  public dats = new Map<string, IDat>();
  public loader: IHyperLoader<D, IDat>;

  constructor(
    loader: IHyperLoader<D, IDat>,
    protected defaultDatOptions: DatOptions = { persist: false },
  ) {
    super();
    this.loader = loader;
  }

  public async getDat(address: string, options?: DatOptions): Promise<IDat> {
    // merge options
    const datOptions = mergeOptions(this.defaultDatOptions, options);
    const autoSwarm = datOptions.autoSwarm !== false;
    const handleAutoJoin = async (datInst: IDat) => {
      if (!datInst.isSwarming && autoSwarm) {
        await datInst.joinSwarm(datOptions.swarmOptions);
      }
    };
    if (this.dats.has(address)) {
      const datFromCache = this.dats.get(address);
      handleAutoJoin(datFromCache);
      this.emit('use', datFromCache);
      return datFromCache;
    }
    const dat = await this.loader.load(Buffer.from(address, 'hex'), datOptions);
    this.dats.set(address, dat);
    handleAutoJoin(dat);
    dat.on('close', this.onClose.bind(this, address));
    this.emit('load', dat);
    return dat;
  }

  public async createDat(options?: DatOptions): Promise<IDat> {
    const datOptions = mergeOptions(this.defaultDatOptions, options);
    const autoSwarm = datOptions.autoSwarm !== false;
    const dat = await this.loader.create(options);
    if (autoSwarm) {
      await dat.joinSwarm(datOptions.swarmOptions);
    }
    const address = dat.drive.key.toString('hex');
    this.dats.set(address, dat);
    dat.on('close', this.onClose.bind(this, address));
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

  /**
   * Closes all Dats and the swarm.
   *
   * The API can be used again after a shutdown. The swarm will be lazily recreated if needed by an
   * API call.
   */
  public shutdown() {
    for (const dat of this.dats.values()) {
      dat.close();
    }
    this.loader.suspend();
  }

  private onClose(address: string) {
    this.dats.delete(address);
    this.emit('close', address);
  }
}
