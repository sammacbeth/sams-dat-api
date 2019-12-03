import DatArchiveImpl = require('@sammacbeth/dat-node/lib/dat-archive');
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';

export type TimeoutOption = {
  timeout?: number;
};

/**
 * TODO: This is not a complete spec yet...
 */
export interface IDatArchive {
  url: string;
  getInfo(opts?: TimeoutOption): Promise<any>;
  configure(opts?: any): Promise<void>;
  stat(filepath: string, opts?: TimeoutOption): Promise<any>;
  readFile(path: string, opts?: TimeoutOption | any): Promise<string | ArrayBuffer>;
  readdir(path: string, opts?: TimeoutOption | any): Promise<string[]>;
  writeFile(path: string, data: string | ArrayBuffer, opts?: any): Promise<void>;
  mkdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  rmdir(path: string, opts?: any): Promise<void>;
  copy(path: string, dstPath: string, opts?: any): Promise<void>
  rename(oldPath: string, newPath: string, opts?: any): Promise<void>
  history(opts?: any): Promise<void>
  checkout(version: number): void
  download(path: string, opts?: TimeoutOption): Promise<void>
}

export default function createDatArchive(drive: IHyperdrive): IDatArchive {
  return DatArchiveImpl({
    _dataStructure: drive,
    key: drive.key.toString(),
  });
}
