import { expect } from 'chai';
import 'mocha';
import HyperdriveAPI, { DatLoaderBase, LoadOptions, DatOptions } from '../';
import { Hyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { EventEmitter } from 'events';
import { IDat } from '@sammacbeth/dat-types/lib/dat';

class MockHyperdrive extends EventEmitter implements Hyperdrive {
  public version: number;
  public discoveryKey: Buffer;
  public writable = true;
  public metadata: import("@sammacbeth/dat-types/lib/hypercore").Hypercore;
  public content: import("@sammacbeth/dat-types/lib/hypercore").Hypercore;

  constructor(public key: Buffer, public opts: LoadOptions) {
    super();
  }

  public ready(callback: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void {
    callback(null);
  }
  public checkout(version: number, opts?: import("@sammacbeth/dat-types/lib/hyperdrive").CheckoutOptions): Hyperdrive {
    throw new Error("Method not implemented.");
  }
  public download(path: string, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public download(callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public download(path?: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public createReadStream(name: string, options?: import("@sammacbeth/dat-types/lib/hyperdrive").ReadOptions & import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption): NodeJS.ReadableStream {
    throw new Error("Method not implemented.");
  }
  public readFile(name: string, options: import("@sammacbeth/dat-types/lib/hyperdrive").EncodingOption & import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<string | Buffer>): void;
  public readFile(name: string, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<string | Buffer>): void;
  public readFile(name: any, options: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public createWriteStream(name: string, options?: import("@sammacbeth/dat-types/lib/hyperdrive").FileOptions): NodeJS.WritableStream {
    throw new Error("Method not implemented.");
  }
  public writeFile(name: string, buffer: Buffer, options?: string | (import("@sammacbeth/dat-types/lib/hyperdrive").FileOptions & import("@sammacbeth/dat-types/lib/hyperdrive").EncodingOption), callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public writeFile(name: string, buffer: Buffer, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public writeFile(name: any, buffer: any, options?: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public unlink(name: string, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void {
    throw new Error("Method not implemented.");
  }
  public mkdir(name: string, options?: number | import("@sammacbeth/dat-types/lib/hyperdrive").FileOptions, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void {
    throw new Error("Method not implemented.");
  }
  public rmdir(name: string, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void {
    throw new Error("Method not implemented.");
  }
  public readdir(name: string, options: import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<string[]>): void;
  public readdir(name: string, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<string[]>): void;
  public readdir(name: any, options?: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public stat(name: string, options: import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption & import("@sammacbeth/dat-types/lib/hyperdrive").WaitOption, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<import("fs").Stats>): void;
  public stat(name: string, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<import("fs").Stats>): void;
  public stat(name: any, options: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public lstat(name: string, options: import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption & import("@sammacbeth/dat-types/lib/hyperdrive").WaitOption, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<import("fs").Stats>): void;
  public lstat(name: string, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<import("fs").Stats>): void;
  public lstat(name: any, options: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public access(name: string, options: import("@sammacbeth/dat-types/lib/hyperdrive").CachedOption & import("@sammacbeth/dat-types/lib/hyperdrive").WaitOption, callback: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void {
    throw new Error("Method not implemented.");
  }
  public open(name: string, flags: string, mode: number, options: { download?: boolean; }, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<number>): void;
  public open(name: string, flags: string, mode: number, callback: import("@sammacbeth/dat-types/lib/hyperdrive").ResultCallback<number>): void;
  public open(name: any, flags: any, mode: any, options: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public read(fd: number, buf: Buffer, offset: number, len: number, position: number, callback: (error: Error, length?: number, buffer?: Buffer) => void): void {
    throw new Error("Method not implemented.");
  }
  public close(fd: number, callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public close(callback?: import("@sammacbeth/dat-types/lib/hyperdrive").SuccessCallback): void;
  public close(fd?: any, callback?: any) {
    throw new Error("Method not implemented.");
  }
  public history(options?: any) {
    throw new Error("Method not implemented.");
  }
  public extension(name: string, message: Buffer): void {
    throw new Error("Method not implemented.");
  }
  public createDiffStream(version: number, options?: any) {
    throw new Error("Method not implemented.");
  }
  public replicate(options?: import("@sammacbeth/dat-types/lib/hyperdrive").ReplicationOptions): import("stream").Duplex {
    throw new Error("Method not implemented.");
  }
}

class MockSwarm extends EventEmitter implements ISwarm<Hyperdrive> {

  public added = new Map<string, JoinSwarmOptions>();

  add(feed: Hyperdrive, options?: JoinSwarmOptions): void {
    this.added.set(feed.key.toString('hex'), options);
  }
  remove(feed: Hyperdrive): void {
    throw new Error("Method not implemented.");
  }
  close(): void {
    throw new Error("Method not implemented.");
  }
}

class MockLoader extends DatLoaderBase<MockHyperdrive> {
  public mswarm: MockSwarm = null;
  constructor() {
    super({
      hyperdriveFactory: (storage, key, opts) => {
        const drive = new MockHyperdrive(key, opts);
        return drive;
      },
      swarmFactory: () => {
        this.mswarm = new MockSwarm();
        return this.mswarm;
      },
    })
  }
}

describe('HyperdriveAPI', function () {

  describe('options', () => {

    async function loadMockDriveWithOptions(defaultOpts: DatOptions | undefined, getOpts: DatOptions | undefined) {
      const loader = new MockLoader();
      const api = new HyperdriveAPI<MockHyperdrive>(loader, defaultOpts);
      const dat = await api.getDat('test', getOpts);
      const drive = dat.drive as MockHyperdrive;
      return {
        api,
        dat,
        loader,
        drive,
      }
    }

    async function onJoin(dat: IDat) {
      return new Promise((resolve) => {
        dat.once('join', () => {
          resolve();
        })
      })
    }

    it('no default opts + no opts: non persistant', async () => {
      const key = 'test'
      const { dat, drive, loader } = await loadMockDriveWithOptions(undefined, undefined);
      // drive options
      expect(drive.opts).to.eql({
        persist: false,
      });
      await dat.ready;
      // swarm options
      expect(loader.mswarm.added.get(key)).to.eql(undefined);
    });

    it('opts passing direct', async () => {
      const key = 'test'
      const { dat, drive, loader } = await loadMockDriveWithOptions(undefined, {
        persist: true,
        announce: false,
        autoSwarm: true,
      });
      // drive options
      expect(drive.opts).to.include({
        persist: true,
      });
      await dat.ready;
      // swarm options
      expect(loader.mswarm.added.get(key)).to.eql(undefined);
    });
  });
});
