import HyperdriveAPI, { LoadOptions, SwarmOptions } from '@sammacbeth/dat-api-core/';
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { Stats } from 'fs';
import { Readable } from 'stream';
import parseUrl = require('parse-dat-url');
import { join as joinPaths } from 'path';
import pda = require('pauls-dat-api');

export type DriveLoadingOptions = SwarmOptions & LoadOptions;

export class NotFoundError extends Error {
  constructor(url) {
    super(`Could not find content at address: ${url}`);
  }
}

export class IsADirectoryError extends Error {
  constructor(url) {
    super(`${url} is a Directory with no index`);
  }
}

export class NetworkTimeoutError extends Error {
  constructor(url, timeout) {
    super(`Timed out while loading ${url} after ${timeout}ms`);
  }
}

function timeoutWithError(ms, errorCtr) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(errorCtr());
    }, ms);
  });
}

export async function resolvePath(drive: IHyperdrive, pathname: string, version?: number) {
  const checkout = version ? drive.checkout(version) : drive;
  const manifest = await pda.readManifest(checkout).catch((_) => ({}));
  const root = manifest.web_root || '';
  const path = decodeURIComponent(pathname);

  const result = {
    directory: false,
    drive: checkout,
    path: '',
  };

  async function tryStat(testPath: string) {
    result.path = testPath;
    return new Promise<Stats | false>((resolve) => {
      checkout.stat(testPath, (err, file) => {
        if (err) {
          return resolve(false);
        }
        resolve(file);
      });
    });
  }

  const f = await tryStat(joinPaths(root, path));

  if (f && f.isFile()) {
    return result;
  }
  if (await tryStat(joinPaths(root, `${path}.html`))) {
    return result;
  }
  // for directories try to find an index file
  if (f && f.isDirectory()) {
    if (await tryStat(joinPaths(root, path, 'index.html'))) {
      return result;
    }
    if (await tryStat(joinPaths(root, path, 'index.htm'))) {
      return result;
    }
    // error list directory
    result.directory = true;
    result.path = joinPaths(root, path);
    return result;
  }

  if (manifest.fallback_page) {
    if (await tryStat(joinPaths(root, manifest.fallback_page))) {
      return result;
    }
  }

  throw new NotFoundError(`dat://${checkout.key.toString('hex')}${pathname}`);
}

export default function createHandler<D extends IHyperdrive>(
  node: HyperdriveAPI<D>,
  resolveDns: (host: string) => Promise<string>,
  loadingOptions: DriveLoadingOptions = {
    autoSwarm: true,
    driveOptions: { sparse: true },
    persist: true,
  },
) {
  return async function handleRequest(
    url: string,
    timeout: number = 30000,
  ): Promise<Readable> {
    const { host, pathname, version } = parseUrl(url);
    if (!host) {
      throw new Error(`Not a dat URL: ${url}`);
    }
    // resolve host to a dat hex address
    const address = await resolveDns(host);
    // load the dat at the given address
    const timer: Promise<any> = timeoutWithError(
      timeout,
      () => new NetworkTimeoutError(url, timeout),
    );
    const loadStream = new Promise<NodeJS.ReadableStream>(async (resolve, reject) => {
      try {
        const dat = await node.getDat(address, loadingOptions);
        await dat.ready;
        const { drive, directory, path } = await resolvePath(dat.drive, pathname, parseInt(version, 10));
        if (directory) {
          throw new IsADirectoryError(url);
        }
        resolve(drive.createReadStream(path, { start: 0 }));
      } catch (e) {
        reject(e);
      }
    });
    return Promise.race([loadStream, timer]);
  };
}
