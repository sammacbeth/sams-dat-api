import HyperdriveAPI, { SwarmOptions } from '@sammacbeth/dat-api-core/lib/api';
import DatArchiveImpl = require('@sammacbeth/dat-node/lib/dat-archive');
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import pda from 'pauls-dat-api';

export type TimeoutOption = {
  timeout?: number;
};

export type DatArchiveCreationOptions = {
  title?: string;
  description?: string;
  type?: string[];
  links?: any;
  prompt?: boolean;
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
  readdir(path: string, opts?: TimeoutOption | any): Promise<any[]>;
  writeFile(path: string, data: string | ArrayBuffer, opts?: any): Promise<void>;
  mkdir(path: string): Promise<void>;
  unlink(path: string): Promise<void>;
  rmdir(path: string, opts?: any): Promise<void>;
  copy(path: string, dstPath: string, opts?: any): Promise<void>;
  rename(oldPath: string, newPath: string, opts?: any): Promise<void>;
  history(opts?: any): Promise<void>;
  checkout(version: number): void;
  download(path?: string, opts?: TimeoutOption): Promise<void>;
}

export async function create<D extends IHyperdrive>(
  node: HyperdriveAPI<D>,
  datOpts: { persist: boolean } & SwarmOptions,
  manifest: DatArchiveCreationOptions,
): Promise<IDatArchive> {
  const dat = await node.createDat(datOpts);
  await pda.writeManifest(dat.drive, manifest);
  return createDatArchive(dat.drive);
}

export async function fork<D extends IHyperdrive>(
  node: HyperdriveAPI<D>,
  srcDrive: IHyperdrive,
  datOpts: { persist: boolean } & SwarmOptions,
  manifest: DatArchiveCreationOptions,
): Promise<IDatArchive> {
  const srcManifest = await pda.readManifest(srcDrive).catch((_) => ({}));
  // create a new manifest with overrides
  const dstManifest = {
    description: manifest.description ? manifest.description : srcManifest.description,
    title: manifest.title ? manifest.title : srcManifest.title,
    type: manifest.type ? manifest.type : srcManifest.type,
  };
  ['web_root', 'fallback_page', 'links'].forEach((field) => {
    if (srcManifest[field]) {
      dstManifest[field] = srcManifest[field];
    }
  });
  const dstDat = await node.createDat(datOpts);
  await pda.writeManifest(dstDat.drive, dstManifest);
  await pda.exportArchiveToArchive({
    dstArchive: dstDat.drive,
    ignore: ['/.dat', '/.git', '/dat.json'],
    skipUndownloadedFiles: false,
    srcArchive: srcDrive,
  });
  return createDatArchive(dstDat.drive);
}

export default function createDatArchive(drive: IHyperdrive): IDatArchive {
  return new DatArchiveImpl({
    dataStructure: drive,
    key: drive.key.toString('hex'),
  });
}
