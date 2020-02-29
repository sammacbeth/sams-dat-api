import { HyperdriveClient, loadMetadata } from 'hyperdrive-daemon-client';
import { EventEmitter } from 'events';

import HyperdriveAPI, { DatOptions, LoadOptions } from '@sammacbeth/dat-api-core/';
import { IDat } from '@sammacbeth/dat-types/lib/dat';
import { Hyperdrive10 } from '@sammacbeth/dat-types/lib/hyperdrive10';
import { IHyperLoader } from '@sammacbeth/dat-types/lib/hyperloader';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';

type DaemonConfig = {
  endpoint: string;
  token: string;
};

export async function loadDaemonConfig(): Promise<DaemonConfig> {
  return new Promise((resolve, reject) => {
    loadMetadata((err, conf) => {
      if (err) {
        reject(err);
      }
      resolve(conf);
    });
  });
}

interface RemoteHyperdrive extends Hyperdrive10 {
  configureNetwork(opts?: {
    announce?: boolean;
    lookup?: boolean;
    remember?: boolean;
  }): Promise<void>;
  stats(): Promise<any>;
}

class Dat extends EventEmitter implements IDat {
  public isSwarming = false;
  public isOpen = true;
  public isOwner = false;
  public isPersisted = false;
  public ready = Promise.resolve();

  constructor(public readonly drive: RemoteHyperdrive) {
    super();
  }

  async joinSwarm(options?: JoinSwarmOptions): Promise<void> {
    if (!this.isSwarming) {
      await this.drive.configureNetwork(options);
      this.isSwarming = true;
      this.emit('join');
    }
  }

  leaveSwarm(): void {
    if (this.isSwarming) {
      this.drive.configureNetwork({
        announce: false,
        lookup: false,
      });
      this.isSwarming = false;
      this.emit('leave');
    }
  }

  close(): void {
    if (this.isOpen) {
      this.drive.close();
      this.isOpen = false;
      this.emit('close');
    }
  }
}

export class HyperdriveDaemonLoader implements IHyperLoader<RemoteHyperdrive, IDat> {
  public client: HyperdriveClient;
  swarm: ISwarm<RemoteHyperdrive> = null;
  private ready: Promise<void>;

  constructor(public endpoint: string, public token: string) {
    this.client = new HyperdriveClient(this.endpoint, this.token);
    this.ready = new Promise((resolve, reject) => {
      this.client.ready((err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  async load(address: Buffer, options: LoadOptions): Promise<IDat> {
    if (options.driveOptions.secretKey) {
      throw new Error('secretKey option not supported by daemon client');
    }
    await this.ready;
    const drive: RemoteHyperdrive = await this.client.drive.get({
      key: address,
    });
    drive.configureNetwork({
      remember: !!options.persist,
    });
    const dat = new Dat(drive);
    dat.isPersisted = !!options.persist;
    return dat;
  }
  async create(): Promise<IDat> {
    await this.ready;
    const drive = await this.client.drive.get({});
    drive.configureNetwork({
      remember: true,
    });
    const dat = new Dat(drive);
    dat.isPersisted = true;
    return dat;
  }
  delete(address: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  suspend(): void {
    this.client.closeClient();
  }
}

export default function apiFactory(
  { endpoint, token }: DaemonConfig,
  defaultDatOpts?: DatOptions,
): HyperdriveAPI<RemoteHyperdrive> {
  return new HyperdriveAPI(new HyperdriveDaemonLoader(endpoint, token), defaultDatOpts);
}
