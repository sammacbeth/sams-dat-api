import { EventEmitter } from 'events';
import { Stats } from 'fs';
import { Duplex } from 'stream';
import { Hypercore, IHypercore } from './hypercore';
import { RandomAccessFactory } from './random-access';
import { IReplicable, IReplicableBase, IReplicableNoise } from './replicable';
import { SuccessCallback, ResultCallback } from './common';

// Type definitions for hyperdrive 9.16.0
// Project: https://github.com/mafintosh/hyperdrive
// Definitions by: Sam Macbeth <https://github.com/sammacbeth>

export type CheckoutOptions = {
  metadataStorageCacheSize?: number;
  contentStorageCacheSize?: number;
  treeCacheSize?: number;
};

export type HyperdriveOptions = CheckoutOptions & {
  sparse?: boolean;
  sparseMetadata?: boolean;
  latest?: boolean;
  extensions?: any[];
  secretKey?: Buffer;
  createIfMissing?: boolean;
  metadata?: Hypercore;
  content?: Hypercore;
  keyPair?: [Buffer, Buffer];
};

export type ReadOptions = {
  start?: number;
  end?: number;
  length?: number;
};

export type FileOptions = {
  mode?: number;
  uid?: number;
  gid?: number;
  mtime?: number | Date;
  ctime?: number | Date;
};

export type CachedOption = {
  cached?: boolean;
};

export type EncodingOption = {
  encoding?: string;
};

export type WaitOption = {
  wait?: boolean;
};

export type ReplicationOptions = {
  live?: boolean;
  download?: boolean;
  upload?: boolean;
};

export interface IHyperdrive extends IReplicableBase {
  /**
   * Get the current version of the archive (incrementing number).
   */
  version: number;

  /**
   * The public key identifying the archive.
   */
  key: Buffer;

  /**
   * A key derived from the public key that can be used to discovery other peers sharing this archive.
   */
  discoveryKey: Buffer;

  writable: boolean;

  metadata: IHypercore;
  content: IHypercore;

  ready(callback: SuccessCallback): void;

  /**
   * Checkout a readonly copy of the archive at an old version. Options are used to configure the `oldDrive`:
   * @param version
   * @param opts
   */
  checkout(version: number, opts?: CheckoutOptions): IHyperdrive;

  /**
   * Download all files in path of current version. If no path is specified this will download all files.
   *
   * You can use this with `.checkout(version)` to download a specific version of the archive.
   * @param path
   * @param callback
   */
  download(path: string, callback?: SuccessCallback): void;
  download(callback?: SuccessCallback): void;

  createReadStream(name: string, options?: ReadOptions & CachedOption): NodeJS.ReadableStream;
  readFile(
    name: string,
    options: EncodingOption & CachedOption,
    callback: ResultCallback<Buffer | string>,
  ): void;
  readFile(name: string, callback: ResultCallback<Buffer | string>): void;

  createWriteStream(name: string, options?: FileOptions): NodeJS.WritableStream;
  writeFile(
    name: string,
    buffer: Buffer,
    options?: (FileOptions & EncodingOption) | string,
    callback?: SuccessCallback,
  ): void;
  writeFile(name: string, buffer: Buffer, callback?: SuccessCallback): void;

  unlink(name: string, callback?: SuccessCallback): void;
  mkdir(name: string, options?: FileOptions | number, callback?: SuccessCallback): void;
  rmdir(name: string, callback?: SuccessCallback): void;

  readdir(name: string, options: CachedOption, callback?: ResultCallback<string[]>): void;
  readdir(name: string, callback?: ResultCallback<string[]>): void;

  stat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void;
  stat(name: string, callback: ResultCallback<Stats>): void;
  lstat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void;
  lstat(name: string, callback: ResultCallback<Stats>): void;

  access(name: string, options: CachedOption & WaitOption, callback: SuccessCallback): void;

  open(
    name: string,
    flags: string,
    mode: number,
    options: { download?: boolean },
    callback: ResultCallback<number>,
  ): void;
  open(name: string, flags: string, mode: number, callback: ResultCallback<number>): void;

  read(
    fd: number,
    buf: Buffer,
    offset: number,
    len: number,
    position: number,
    callback: (error: Error, length?: number, buffer?: Buffer) => void,
  ): void;

  close(fd: number, callback?: SuccessCallback): void;
  close(callback?: SuccessCallback): void;

  // TODO: Find actual shapes
  history(options?: any): any;
  extension(name: string, message: Buffer): void;
  createDiffStream(version: number, options?: any): any;
}

export class Hyperdrive extends EventEmitter implements IHyperdrive, IReplicable {
  public version: number;
  public key: Buffer;
  public discoveryKey: Buffer;
  public writable: boolean;
  public metadata: Hypercore;
  public content: Hypercore;

  constructor(storage: string | RandomAccessFactory, opts?: HyperdriveOptions);
  constructor(storage: string | RandomAccessFactory, key: Buffer, opts?: HyperdriveOptions);

  public ready(callback: SuccessCallback): void;
  public checkout(version: number, opts?: CheckoutOptions): Hyperdrive;
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

  public replicate(options?: ReplicationOptions): Duplex;
}
