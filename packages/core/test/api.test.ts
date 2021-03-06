import { Hyperdrive, HyperdriveOptions, CheckoutOptions, CachedOption, EncodingOption, FileOptions, WaitOption } from '@sammacbeth/dat-types/lib/hyperdrive';
import ISwarm, { JoinSwarmOptions } from '@sammacbeth/dat-types/lib/swarm';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import 'mocha';
import ram = require('random-access-memory');
import HyperdriveAPI, { DatLoaderBase, DatOptions } from '../';
import { SuccessCallback, ResultCallback } from '@sammacbeth/dat-types/lib/common';
import { ReadOptions } from '@sammacbeth/dat-types/lib/hypercore';
import { ReplicationOptions } from '@sammacbeth/dat-types/lib/replicable';

class MockHyperdrive extends EventEmitter implements Hyperdrive {
  public version: number;
  public discoveryKey: Buffer;
  public writable = true;
  public metadata: import('@sammacbeth/dat-types/lib/hypercore').Hypercore;
  public content: import('@sammacbeth/dat-types/lib/hypercore').Hypercore;

  constructor(public key: Buffer, public opts: HyperdriveOptions) {
    super();
  }

  public ready(callback: SuccessCallback): void {
    callback(null);
  }
  public checkout(
    version: number,
    opts?: CheckoutOptions,
  ): Hyperdrive {
    throw new Error('Method not implemented.');
  }
  public download(
    path: string,
    callback?: SuccessCallback,
  ): void;
  public download(callback?:SuccessCallback): void;
  public download(path?: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public createReadStream(
    name: string,
    options?: ReadOptions &
      CachedOption,
  ): NodeJS.ReadableStream {
    throw new Error('Method not implemented.');
  }
  public readFile(
    name: string,
    options: EncodingOption &
      CachedOption,
    callback: ResultCallback<string | Buffer>,
  ): void;
  public readFile(
    name: string,
    callback: ResultCallback<string | Buffer>,
  ): void;
  public readFile(name: any, options: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public createWriteStream(
    name: string,
    options?: FileOptions,
  ): NodeJS.WritableStream {
    throw new Error('Method not implemented.');
  }
  public writeFile(
    name: string,
    buffer: Buffer,
    options?:
      | string
      | (FileOptions &
          EncodingOption),
    callback?: SuccessCallback,
  ): void;
  public writeFile(
    name: string,
    buffer: Buffer,
    callback?: SuccessCallback,
  ): void;
  public writeFile(name: any, buffer: any, options?: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public unlink(
    name: string,
    callback?: SuccessCallback,
  ): void {
    throw new Error('Method not implemented.');
  }
  public mkdir(
    name: string,
    options?: number | FileOptions,
    callback?: SuccessCallback,
  ): void {
    throw new Error('Method not implemented.');
  }
  public rmdir(
    name: string,
    callback?: SuccessCallback,
  ): void {
    throw new Error('Method not implemented.');
  }
  public readdir(
    name: string,
    options: CachedOption,
    callback?: ResultCallback<string[]>,
  ): void;
  public readdir(
    name: string,
    callback?: ResultCallback<string[]>,
  ): void;
  public readdir(name: any, options?: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public stat(
    name: string,
    options: CachedOption &
      WaitOption,
    callback: ResultCallback<import('fs').Stats>,
  ): void;
  public stat(
    name: string,
    callback: ResultCallback<import('fs').Stats>,
  ): void;
  public stat(name: any, options: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public lstat(
    name: string,
    options: CachedOption &
      WaitOption,
    callback: ResultCallback<import('fs').Stats>,
  ): void;
  public lstat(
    name: string,
    callback: ResultCallback<import('fs').Stats>,
  ): void;
  public lstat(name: any, options: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public access(
    name: string,
    options: CachedOption &
      WaitOption,
    callback: SuccessCallback,
  ): void {
    throw new Error('Method not implemented.');
  }
  public open(
    name: string,
    flags: string,
    mode: number,
    options: { download?: boolean },
    callback: ResultCallback<number>,
  ): void;
  public open(
    name: string,
    flags: string,
    mode: number,
    callback: ResultCallback<number>,
  ): void;
  public open(name: any, flags: any, mode: any, options: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public read(
    fd: number,
    buf: Buffer,
    offset: number,
    len: number,
    position: number,
    callback: (error: Error, length?: number, buffer?: Buffer) => void,
  ): void {
    throw new Error('Method not implemented.');
  }
  public close(
    fd: number,
    callback?: SuccessCallback,
  ): void;
  public close(callback?: SuccessCallback): void;
  public close(fd?: any, callback?: any) {
    throw new Error('Method not implemented.');
  }
  public history(options?: any) {
    throw new Error('Method not implemented.');
  }
  public extension(name: string, message: Buffer): void {
    throw new Error('Method not implemented.');
  }
  public createDiffStream(version: number, options?: any) {
    throw new Error('Method not implemented.');
  }
  public replicate(
    options?: ReplicationOptions,
  ): import('stream').Duplex {
    throw new Error('Method not implemented.');
  }
}

class MockSwarm extends EventEmitter implements ISwarm<Hyperdrive> {
  public added = new Map<string, JoinSwarmOptions>();

  public add(feed: Hyperdrive, options?: JoinSwarmOptions): void {
    this.added.set(feed.key.toString('hex'), options || null);
  }
  public remove(feed: Hyperdrive): void {
    throw new Error('Method not implemented.');
  }
  public close(): void {
    throw new Error('Method not implemented.');
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
      persistantStorageFactory: ram,
      swarmFactory: () => {
        this.mswarm = new MockSwarm();
        return this.mswarm;
      },
    });
  }
}

describe('HyperdriveAPI', () => {
  describe('options', () => {
    async function loadMockDriveWithOptions(
      defaultOpts: DatOptions | undefined,
      getOpts: DatOptions | undefined,
    ) {
      const loader = new MockLoader();
      const api = new HyperdriveAPI<MockHyperdrive>(loader, defaultOpts);
      const dat = await api.getDat('test', getOpts);
      const drive = dat.drive as MockHyperdrive;
      return {
        api,
        dat,
        drive,
        loader,
      };
    }

    async function onLoad(api: HyperdriveAPI<Hyperdrive>) {
      return new Promise((resolve) => {
        api.once('load', () => {
          resolve();
        });
      });
    }

    it('no default opts + no opts: non persistant', async () => {
      const key = 'test';
      const { dat, drive, loader } = await loadMockDriveWithOptions(undefined, undefined);
      expect(dat.isPersisted).to.equal(false);
      // drive options: non given
      expect(drive.opts).to.eql(undefined);
      await dat.ready;
      // swarm options: null
      expect(loader.mswarm.added.get(dat.drive.key.toString('hex'))).to.eql(null);
    });

    it('opts passing direct', async () => {
      const key = 'test';
      const { dat, drive, loader } = await loadMockDriveWithOptions(undefined, {
        autoSwarm: true,
        driveOptions: {
          sparse: true,
        },
        persist: true,
        swarmOptions: {
          announce: false,
        },
      });
      expect(dat.isPersisted).to.equal(true);
      // drive options
      expect(drive.opts).to.eql({
        sparse: true,
      });
      await dat.ready;
      // swarm options
      expect(loader.mswarm.added.get(dat.drive.key.toString('hex'))).to.eql({
        announce: false,
      });
    });

    it('opts passing defaults', async () => {
      const key = 'test';
      const { dat, drive, loader } = await loadMockDriveWithOptions(
        {
          autoSwarm: true,
          driveOptions: {
            sparse: true,
          },
          persist: true,
          swarmOptions: {
            announce: false,
          },
        },
        undefined,
      );
      expect(dat.isPersisted).to.equal(true);
      // drive options
      expect(drive.opts).to.eql({
        sparse: true,
      });
      await dat.ready;
      // swarm options
      expect(loader.mswarm.added.get(dat.drive.key.toString('hex'))).to.eql({
        announce: false,
      });
    });

    it('opts direct overrides default', async () => {
      const key = 'test';
      const { dat, drive, loader } = await loadMockDriveWithOptions(
        {
          autoSwarm: true,
          driveOptions: {
            contentStorageCacheSize: 500,
            sparse: true,
          },
          persist: true,
          swarmOptions: {
            announce: false,
            lookup: false,
          },
        },
        {
          autoSwarm: true,
          driveOptions: {
            contentStorageCacheSize: 1000,
            metadataStorageCacheSize: 1000,
          },
          persist: false,
          swarmOptions: {
            lookup: true,
            upload: true,
          },
        },
      );
      expect(dat.isPersisted).to.equal(false);
      // drive options
      expect(drive.opts).to.eql({
        contentStorageCacheSize: 1000,
        metadataStorageCacheSize: 1000,
        sparse: true,
      });
      await dat.ready;
      // swarm options
      expect(loader.mswarm.added.get(dat.drive.key.toString('hex'))).to.eql({
        announce: false,
        lookup: true,
        upload: true,
      });
    });
  });
});
