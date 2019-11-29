import { EventEmitter } from 'events';
import { Stats } from 'fs';
import { Duplex } from 'stream';
import { Hypercore, HypercoreBase } from './hypercore';
import { Replicable, ReplicableBase } from './replicable';
import { RandomAccessFactory } from './random-access';

// Type definitions for hyperdrive 9.16.0
// Project: https://github.com/mafintosh/hyperdrive
// Definitions by: Sam Macbeth <https://github.com/sammacbeth>

type CheckoutOptions = {
  metadataStorageCacheSize?: number
  contentStorageCacheSize?: number
  treeCacheSize?: number
}

type HyperdriveOptions = CheckoutOptions & {
  sparse?: boolean
  sparseMetadata?: boolean
  latest?: boolean
  extensions?: any[]
  secretKey?: Buffer
  createIfMissing?: boolean
  metadata?: Hypercore
  content?: Hypercore
}

type ReadOptions = {
  start?: number
  end?: number
  length?: number
}

type FileOptions = {
  mode?: number
  uid?: number
  gid?: number
  mtime?: number | Date
  ctime?: number | Date
}

type CachedOption = {
  cached?: boolean
}

type EncodingOption = {
  encoding?: string
}

type WaitOption = {
  wait?: boolean
}

type ReplicationOptions = {
  live?: boolean
  download?: boolean
  upload?: boolean
}

type SuccessCallback = (error: Error) => void
type ResultCallback<T> = (error: Error, result?: T) => void

export interface HyperdriveCommon extends ReplicableBase {
/**
   * Get the current version of the archive (incrementing number).
   */
  version: number

  /**
   * The public key identifying the archive.
   */
  key: Buffer

  /**
   * A key derived from the public key that can be used to discovery other peers sharing this archive.
   */
  discoveryKey: Buffer

  writable: boolean

  metadata: HypercoreBase
  content: HypercoreBase

  ready(callback: SuccessCallback): void

  /**
   * Checkout a readonly copy of the archive at an old version. Options are used to configure the `oldDrive`:
   * @param version 
   * @param opts
   */
  checkout(version: number, opts?: CheckoutOptions): HyperdriveCommon

  /**
   * Download all files in path of current version. If no path is specified this will download all files.

    You can use this with `.checkout(version)` to download a specific version of the archive.
    * @param path 
    * @param callback 
    */
  download(path: string, callback?: SuccessCallback): void
  download(callback?: SuccessCallback): void


  createReadStream(name: string, options?: ReadOptions & CachedOption): NodeJS.ReadableStream
  readFile(name: string, options: EncodingOption & CachedOption, callback: ResultCallback<Buffer | string>): void
  readFile(name: string, callback: ResultCallback<Buffer | string>): void

  createWriteStream(name: string, options?: FileOptions): NodeJS.WritableStream
  writeFile(name: string, buffer: Buffer, options?: FileOptions & EncodingOption | string, callback?: SuccessCallback): void
  writeFile(name: string, buffer: Buffer, callback?: SuccessCallback): void

  unlink(name: string, callback?: SuccessCallback): void
  mkdir(name: string, options?: FileOptions | number, callback?: SuccessCallback): void
  rmdir(name: string, callback?: SuccessCallback): void

  readdir(name: string, options: CachedOption, callback?: ResultCallback<string[]>): void
  readdir(name: string, callback?: ResultCallback<string[]>): void

  stat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void
  stat(name: string, callback: ResultCallback<Stats>): void
  lstat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void
  lstat(name: string, callback: ResultCallback<Stats>): void

  access(name: string, options: CachedOption & WaitOption, callback: SuccessCallback): void

  open(name: string, flags: string, mode: number, options: { download?: boolean }, callback: ResultCallback<number>): void
  open(name: string, flags: string, mode: number, callback: ResultCallback<number>): void

  read(fd: number, buf: Buffer, offset: number, len: number, position: number, callback: (error: Error, length?: number, buffer?: Buffer) => void): void

  close(fd: number, callback?: SuccessCallback): void
  close(callback?: SuccessCallback): void

  // TODO: Find actual shapes
  history(options?: any): any
  extension(name: string, message: Buffer): void
  createDiffStream(version: number, options?: any): any
}

export default class Hyperdrive extends EventEmitter implements HyperdriveCommon, Replicable {
  constructor(storage: string, opts?: HyperdriveOptions)
  constructor(storage: string, key: Buffer, opts?: HyperdriveOptions)
  constructor(storage: RandomAccessFactory, opts?: HyperdriveOptions)
  constructor(storage: RandomAccessFactory, key: Buffer, opts?: HyperdriveOptions)

  version: number
  key: Buffer
  discoveryKey: Buffer
  writable: boolean
  metadata: Hypercore
  content: Hypercore

  ready(callback: SuccessCallback): void
  checkout(version: number, opts?: CheckoutOptions): Hyperdrive
  download(path: string, callback?: SuccessCallback): void
  download(callback?: SuccessCallback): void


  createReadStream(name: string, options?: ReadOptions & CachedOption): NodeJS.ReadableStream
  readFile(name: string, options: EncodingOption & CachedOption, callback: ResultCallback<Buffer | string>): void
  readFile(name: string, callback: ResultCallback<Buffer | string>): void

  createWriteStream(name: string, options?: FileOptions): NodeJS.WritableStream
  writeFile(name: string, buffer: Buffer, options?: FileOptions & EncodingOption | string, callback?: SuccessCallback): void
  writeFile(name: string, buffer: Buffer, callback?: SuccessCallback): void

  unlink(name: string, callback?: SuccessCallback): void
  mkdir(name: string, options?: FileOptions | number, callback?: SuccessCallback): void
  rmdir(name: string, callback?: SuccessCallback): void

  readdir(name: string, options: CachedOption, callback?: ResultCallback<string[]>): void
  readdir(name: string, callback?: ResultCallback<string[]>): void

  stat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void
  stat(name: string, callback: ResultCallback<Stats>): void
  lstat(name: string, options: CachedOption & WaitOption, callback: ResultCallback<Stats>): void
  lstat(name: string, callback: ResultCallback<Stats>): void

  access(name: string, options: CachedOption & WaitOption, callback: SuccessCallback): void

  open(name: string, flags: string, mode: number, options: { download?: boolean }, callback: ResultCallback<number>): void
  open(name: string, flags: string, mode: number, callback: ResultCallback<number>): void

  read(fd: number, buf: Buffer, offset: number, len: number, position: number, callback: (error: Error, length?: number, buffer?: Buffer) => void): void

  close(fd: number, callback?: SuccessCallback): void
  close(callback?: SuccessCallback): void

  // TODO: Find actual shapes
  history(options?: any): any
  extension(name: string, message: Buffer): void
  createDiffStream(version: number, options?: any): any

  replicate(options?: ReplicationOptions): Duplex
}
