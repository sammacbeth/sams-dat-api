import DatArchiveImpl = require('@sammacbeth/dat-node/lib/dat-archive')
import DatAPI from './';
import Hyperdrive from './types/hyperdrive';

/**
 * TODO: This is not a complete spec yet...
 */
export interface DatArchive {
  url: string
  _dataStructure: Hyperdrive
  _checkout: Hyperdrive
  _version: number
  getInfo(opts?): Promise<any>
  stat(filepath: string, opts?): Promise<any>
  readdir(path: string, opts?): Promise<string[]>
  configure(opts?): Promise<void>
}

export default function createDatArchive(drive: Hyperdrive): DatArchive {
  return DatArchiveImpl({
    key: drive.key.toString(),
    _dataStructure: drive,
  })
}