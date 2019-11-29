import { EventEmitter } from "events";
import { Duplex } from "stream";
import { Replicable, ReplicationOptions } from "./replicable";
import { RandomAccessFactory } from "./random-access";

// Type definitions for hypercore 7.2
// Project: https://github.com/mafintosh/hypercore
// Definitions by: Sam Macbeth <https://github.com/sammacbeth>

type ValueEncoding =
  | 'json'
  | 'utf-8'
  | 'binary';

type HypercoreOptions = {
  createIfMissing?: boolean
  overwrite?: boolean
  valueEncoding?: ValueEncoding
  sparse?: boolean
  secretKey?: Buffer
  storeSecretKey?: boolean
  storageCacheSize?: number
  onwrite?: (index: number, data: any, peer: any, cb: () => void) => void
  stats?: boolean
  crypto?: {
    sign: (data: Buffer, secretKey: Buffer, cb: (err: Error, signature: Buffer) => void) => void
    verify: (signature: Buffer, data: Buffer, key: Buffer, cb: (err: Error, valid: boolean) => void) => void
  }
}

type UpDownStats = {
  uploadedBytes: number
  uploadedBlocks: number
  downloadedBytes: number
  downloadedBlocks: number
}

type Stats = {
  totals: UpDownStats
  peers: UpDownStats[]
}

type GetOptions = {
  wait: boolean
  timeout: number
  valueEncoding: ValueEncoding
}

type Range = {
  start?: number
  end?: number
  linear?: boolean
}

type Signature = {
  index: number
  signature: Buffer
}

type Node = {
  index: number
  size: number
  hash: Buffer
}

type ReadOptions = {
  start?: number
  end?: number
  snapshot?: boolean
  tail?: boolean
  live?: boolean
  timeout?: number
  wait?: boolean
}

type SuccessCallback = (error: Error) => void

interface HypercoreBase {
  /**
   * Can we append to this feed?
   * 
   * Populated after `ready` has been emitted. Will be `false` before the event.
   */
  writable: boolean

  /**
   * Can we read from this feed? After closing a feed this will be false.
   * 
   * Populated after `ready` has been emitted. Will be `false` before the event.
   */
  readable: boolean

  /**
   * How many blocks of data are available on this feed?
   * 
   * Populated after `ready` has been emitted. Will be `0` before the event.
   */
  length: number

  /**
   * How much data is available on this feed in bytes?
   * 
   * Populated after `ready` has been emitted. Will be `0` before the event.
   */
  byteLength: number

  /**
   * Return per-peer and total upload/download counts.
   */
  stats: Stats

  /**
   * Append a block of data to the feed.
   * 
   * Callback is called with (err, seq) when all data has been written at the returned seq or an error occurred.
   * @param data 
   * @param callback 
   */
  append(data: any, callback?: (err: Error, seq?: number) => void): void

  /**
   * Get a block of data. If the data is not available locally this method will prioritize and wait for the data to be downloaded before calling the callback.
   * @param index 
   * @param callback 
   */
  get(index: number, options: GetOptions, callback: (err: Error, data?: any) => void): void
  get(index: number, callback: (err: Error, data: any) => void): void

  /**
   * Get a range of blocks efficiently. 
   * @param start 
   * @param end 
   * @param options 
   * @param callback 
   */
  getBatch(start: number, end: number, options: GetOptions, callback: (err: Error, data?: any[]) => void): void
  getBatch(start: number, end: number, callback: (err: Error, data?: any[]) => void): void

  /**
   * Get the block of data at the tip of the feed. This will be the most recently appended block.
   * @param options 
   * @param callback 
   */
  head(options: GetOptions, callback: (err: Error, data?: any) => void): void
  head(callback: (err: Error, data?: any) => void): void

  /**
   * Download a range of data. Callback is called when all data has been downloaded.
   * 
   * If you do not mark a range the entire feed will be marked for download.
   * 
   * If you have not enabled sparse mode (`sparse: true` in the feed constructor) then the entire feed will be marked for download for you when the feed is created.
   * @param range 
   * @param callback 
   */
  download(range?: Range, callback?: SuccessCallback): void
  download(callback?: SuccessCallback): void

  /**
   * Cancel a previous download request.
   * @param range 
   */
  undownload(range: Range): void

  /**
   * Get a signature proving the correctness of the block at index, or the whole stream.
   * @param index 
   * @param callback 
   */
  signature(index: number, callback: (err: Error, signature?: Signature) => void): void
  signature(callback: (err: Error, signature?: Signature) => void): void

  /**
   * Verify a signature is correct for the data up to index, which must be the last signed block associated with the signature.
   * @param index 
   * @param signature 
   * @param callback 
   */
  verify(index: number, signature: Signature, callback: (err: Error, success?: boolean) => void): void

  /**
   * Retrieve the root hashes for given `index`.
   * @param index 
   * @param callback 
   */
  rootHashes(index: number, callback: (err: Error, roots?: Node[]) => void): void

  /**
   * Returns total number of downloaded blocks within range. If `end` is not specified it 
   * will default to the total number of blocks. If `start` is not specified it will default
   * to 0.
   * @param start 
   * @param end 
   */
  downloaded(start?: number, end?: number): number
  downloaded(end: number): number

  /**
   * Return true if a data block is available locally. False otherwise.
   */
  has(index: number): boolean

  /**
   * Return true if all data blocks within a range are available locally. False otherwise.
   * @param start 
   * @param end 
   */
  has(start: number, end: number): boolean

  /**
   * Clear a range of data from the local cache. Will clear the data from the bitfield and 
   * make a call to the underlying storage provider to delete the byte range the range
   * occupies.
   * 
   * `end` defaults to `start + 1`.
   * @param start 
   * @param end 
   * @param callback 
   */
  clear(start: number, end: number, callback?: SuccessCallback): void
  clear(start: number, callback?: SuccessCallback): void

  /**
   * Seek to a byte offset.
   * 
   * Calls the callback with `(err, index, relativeOffset)`, where `index` is the data block
   * the byteOffset is contained in and `relativeOffset` is the relative byte offset in the data block.
   * @param byteOffset 
   * @param callback 
   */
  seek(byteOffset: number, callback: (err: Error, index?: number, relativeOffset?: number) => void): void

  /**
   * Wait for the feed to contain at least `minLength` elements. If you do not provide 
   * `minLength` it will be set to current length + 1.
   * 
   * Does not download any data from peers except for a proof of the new feed length.
   * @param minLength 
   * @param callback 
   */
  update(minLength: number, callback?: SuccessCallback): void
  update(callback?: SuccessCallback): void

  /**
   * Create a readable stream of data.
   * @param options 
   */
  createReadStream(options?: ReadOptions): NodeJS.ReadableStream

  /**
   * Create a writable stream.
   */
  createWriteStream(): NodeJS.WritableStream

  /**
   * Fully close this feed.
   * 
   * Calls the callback with (err) when all storage has been closed.
   */
  close(callback?: SuccessCallback): void

  /**
   * Audit all data in the feed. Will check that all current data stored matches the hashes
   * in the merkle tree and clear the bitfield if not.
   * @param callback 
   */
  audit(callback?: (result: { valid: number, invalid: number }) => void): void

  /**
   * Send an extension message to all connected peers. name should be in the list of
   * extensions from the constructor. message should be a Buffer.
   * @param name 
   * @param message 
   */
  extension(name: string, message: Buffer): void
}

export class Hypercore extends EventEmitter implements HypercoreBase, Replicable {
  /**
   * Create a new hypercore feed stored at the specified path. Key is loaded from storage,
   * or generated if it does not exist.
   * @param storage Path to store data
   * @param opts hypercore creation options
   */
  constructor(storage: string, opts?: HypercoreOptions)

  /**
   * Create a new hypercore feed stored at the specified path, using the provided key
   * @param storage Path to store data
   * @param key hypercore public key
   * @param opts hypercore creation options
   */
  constructor(storage: string, key: Buffer, opts?: HypercoreOptions)

  /**
   * Create a new hypercore feed using a factory for random-access instances to store data.
   * Key is loaded from storage, or generated if it does not exist.
   * @param storage 
   * @param opts hypercore creation options
   */
  constructor(storage: RandomAccessFactory, opts?: HypercoreOptions)

  /**
   * Create a new hypercore feed using a factory for random-access instances to store data,
   * and using the provided key
   * @param storage 
   * @param key hypercore public key
   * @param opts hypercore creation options
   */
  constructor(storage: RandomAccessFactory, key: Buffer, opts?: HypercoreOptions)

  writable: boolean
  readable: boolean
  key: Buffer
  discoveryKey: Buffer
  length: number
  byteLength: number
  stats: Stats

  append(data: any, callback?: (err: Error, seq?: number) => void): void
  get(index: number, options: GetOptions, callback: (err: Error, data?: any) => void): void
  get(index: number, callback: (err: Error, data: any) => void): void
  getBatch(start: number, end: number, options: GetOptions, callback: (err: Error, data?: any[]) => void): void
  getBatch(start: number, end: number, callback: (err: Error, data?: any[]) => void): void
  head(options: GetOptions, callback: (err: Error, data?: any) => void): void
  head(callback: (err: Error, data?: any) => void): void
  download(range?: Range, callback?: SuccessCallback): void
  download(callback?: SuccessCallback): void
  undownload(range: Range): void
  signature(index: number, callback: (err: Error, signature?: Signature) => void): void
  signature(callback: (err: Error, signature?: Signature) => void): void
  verify(index: number, signature: Signature, callback: (err: Error, success?: boolean) => void): void
  rootHashes(index: number, callback: (err: Error, roots?: Node[]) => void): void
  downloaded(start?: number, end?: number): number
  downloaded(end: number): number
  has(index: number): boolean
  has(start: number, end: number): boolean
  clear(start: number, end: number, callback?: SuccessCallback): void
  clear(start: number, callback?: SuccessCallback): void
  seek(byteOffset: number, callback: (err: Error, index?: number, relativeOffset?: number) => void): void
  update(minLength: number, callback?: SuccessCallback): void
  update(callback?: SuccessCallback): void
  createReadStream(options?: ReadOptions): NodeJS.ReadableStream
  createWriteStream(): NodeJS.WritableStream
  close(callback?: SuccessCallback): void
  audit(callback?: (result: { valid: number, invalid: number }) => void): void
  extension(name: string, message: Buffer): void
  ready(cb: () => void): void
  replicate(opts: ReplicationOptions): Duplex
}
