import { EventEmitter } from 'events';
import { Stats } from 'fs';
import { Duplex } from 'stream';

import {
  IHyperdrive,
  HyperdriveOptions,
  CheckoutOptions,
  ReadOptions,
  CachedOption,
  EncodingOption,
  FileOptions,
  WaitOption,
  ReplicationOptions,
} from './hyperdrive';
import { Hypercore, IHypercore } from './hypercore';
import { RandomAccessFactory } from './random-access';
import { SuccessCallback, ResultCallback } from './common';
import { IReplicableNoise } from './replicable';

export interface IHyperdrive10 extends IHyperdrive {
  /**
   * Mounts another Hyperdrive at the specified mountpoint.
   *
   * If a `version` is specified in the options, then the mountpoint will reference a static checkout (it will never update).
   */

  mount(name: string, key: Buffer, opts?: { version?: number }, cb?: SuccessCallback): void;
  /**
   * Unmount a previously-mounted Hyperdrive.
   */
  unmount(name: string, cb?: SuccessCallback): void;

  /**
   * Create a stream containing content/metadata feeds for all mounted Hyperdrives.
   * TODO: specify return type
   */
  createMountStream(opts?: any): any;

  /**
   * Returns a Map of the content/metadata feeds for all mounted Hyperdrives, keyed by their mountpoints. The results will always include the top-level feeds (with key '/').
   * TODO: specify return type
   */
  getAllMounts(opts: { memory?: boolean }, cb: ResultCallback<{ [key: string]: any }>): void;

  /**
   * Create a symlink from `linkname` to `target`.
   */
  symlink(target: string, linkname: string, cb?: SuccessCallback): void;
}

export class Hyperdrive10 extends EventEmitter implements IHyperdrive10, IReplicableNoise {
  public version: number;
  public key: Buffer;
  public discoveryKey: Buffer;
  public writable: boolean;
  public metadata: Hypercore;
  public content: Hypercore;

  constructor(storage: string | RandomAccessFactory, opts?: HyperdriveOptions);
  constructor(storage: string | RandomAccessFactory, key: Buffer, opts?: HyperdriveOptions);

  public ready(callback: SuccessCallback): void;
  public checkout(version: number, opts?: CheckoutOptions): Hyperdrive10;
  public download(path: string, callback?: SuccessCallback): void;
  public download(callback?: SuccessCallback): void;

  public createReadStream(
    name: string,
    options?: ReadOptions & CachedOption,
  ): NodeJS.ReadableStream;
  public readFile(
    name: string,
    options: EncodingOption & CachedOption,
    callback: ResultCallback<Buffer | string>,
  ): void;
  public readFile(name: string, callback: ResultCallback<Buffer | string>): void;

  public createWriteStream(name: string, options?: FileOptions): NodeJS.WritableStream;
  public writeFile(
    name: string,
    buffer: Buffer,
    options?: (FileOptions & EncodingOption) | string,
    callback?: SuccessCallback,
  ): void;
  public writeFile(name: string, buffer: Buffer, callback?: SuccessCallback): void;

  public unlink(name: string, callback?: SuccessCallback): void;
  public mkdir(name: string, options?: FileOptions | number, callback?: SuccessCallback): void;
  public rmdir(name: string, callback?: SuccessCallback): void;

  public readdir(name: string, options: CachedOption, callback?: ResultCallback<string[]>): void;
  public readdir(name: string, callback?: ResultCallback<string[]>): void;

  public stat(
    name: string,
    options: CachedOption & WaitOption,
    callback: ResultCallback<Stats>,
  ): void;
  public stat(name: string, callback: ResultCallback<Stats>): void;
  public lstat(
    name: string,
    options: CachedOption & WaitOption,
    callback: ResultCallback<Stats>,
  ): void;
  public lstat(name: string, callback: ResultCallback<Stats>): void;

  public access(name: string, options: CachedOption & WaitOption, callback: SuccessCallback): void;

  public open(
    name: string,
    flags: string,
    mode: number,
    options: { download?: boolean },
    callback: ResultCallback<number>,
  ): void;
  public open(name: string, flags: string, mode: number, callback: ResultCallback<number>): void;

  public read(
    fd: number,
    buf: Buffer,
    offset: number,
    len: number,
    position: number,
    callback: (error: Error, length?: number, buffer?: Buffer) => void,
  ): void;

  public close(fd: number, callback?: SuccessCallback): void;
  public close(callback?: SuccessCallback): void;

  // TODO: Find actual shapes
  public history(options?: any): any;
  public extension(name: string, message: Buffer): void;
  public createDiffStream(version: number, options?: any): any;

  public replicate(isInitiator: boolean, options?: ReplicationOptions): Duplex;

  // new Hyperdrive10 methods
  public mount(name: string, key: Buffer, opts?: { version?: number }, cb?: SuccessCallback): void;
  public unmount(name: string, cb?: SuccessCallback): void;
  public createMountStream(opts?: any): any;
  public getAllMounts(opts: { memory?: boolean }, cb: ResultCallback<{ [key: string]: any }>): void;
  public symlink(target: string, linkname: string, cb?: SuccessCallback): void;
}
