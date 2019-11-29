import HyperdriveAPI, { SwarmOptions } from '@sammacbeth/dat-api-core/lib/api';
import { LoadOptions } from '@sammacbeth/dat-api-core/lib/loader';
import { IDat } from '@sammacbeth/dat-types/lib/dat';
import { IHyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { Stats } from 'fs';
import mime = require('mime');
import parseUrl = require('parse-dat-url');
import { join as joinPaths } from 'path';
import pda = require('pauls-dat-api');

export type DriveLoadingOptions = SwarmOptions & LoadOptions;

const ERRORS = {
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NOT_FOUND: 'NOT FOUND',
};

function timeoutWithError(ms, errorCtr) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(errorCtr());
    }, ms);
  });
}

export async function resolvePath(dat: IDat<IHyperdrive>, pathname: string, version?: number) {
  const drive = version ? dat.drive.checkout(version) : dat.drive;
  const manifest = await pda.readManifest(drive).catch((_) => ({}));
  const root = manifest.web_root || '';
  const path = decodeURIComponent(pathname);

  const result = {
    directory: false,
    drive,
    path: '',
  };

  async function tryStat(testPath: string) {
    result.path = testPath;
    return new Promise<Stats | false>((resolve, reject) => {
      drive.stat(testPath, (err, file) => {
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

  throw new Error(ERRORS.NOT_FOUND);
}

export default function createHandler(
  loader: HyperdriveAPI<IHyperdrive>,
  resolveDns: (host: string) => Promise<string>,
  loadingOptions: DriveLoadingOptions = { autoSwarm: true, persist: true, sparse: true },
) {
  return function handleRequest(url: string, timeout: number = 30000) {
    const { host, pathname, version } = parseUrl(url);
    const body = new ReadableStream({
      async start(controller) {
        let address: string;
        // resolve host to a dat hex address
        try {
          address = await resolveDns(host);
        } catch (e) {
          controller.error('DNS Lookup failed');
          return;
        }
        // load the dat at the given address
        const timer = timeoutWithError(timeout, () => 'Request timed out');
        let stream: NodeJS.ReadableStream;
        try {
          const loadStream = loader
            .getDat(address, loadingOptions)
            .then(async (dat) => {
              await dat.ready;
              return resolvePath(dat, pathname, version);
            })
            .then(({ drive, directory, path }) => {
              if (directory) {
                controller.enqueue('Directory listing');
                return;
              }
              stream = drive.createReadStream(path, { start: 0 });
            });
          await Promise.race([loadStream, timer]);
        } catch (e) {
          controller.error(e);
          return;
        }

        let streamComplete;
        let gotFirstChunk = false;
        // timeout in case we don't get the first chunk within 30s
        const streamTimeout = new Promise<void>((resolve, reject) => {
          const streamTimer = setTimeout(() => {
            if (!gotFirstChunk) {
              return reject(new Error(ERRORS.NETWORK_TIMEOUT));
            }
            return resolve();
          }, 30000);
          streamComplete = () => {
            clearTimeout(streamTimer);
            resolve();
          };
        });

        stream.on('close', () => {
          controller.close();
        });
        stream.on('end', () => {
          controller.close();
          streamComplete();
        });
        stream.on('error', (e) => {
          controller.error(e);
        });
        stream.on('data', (chunk) => {
          gotFirstChunk = true;
          controller.enqueue(chunk);
        });
        try {
          await streamTimeout;
        } catch (e) {
          controller.enqueue('Timed out while loading file from the network');
        }
      },
    });
    return new Response(body, {
      headers: {
        'content-type': mime.getType(decodeURIComponent(pathname)) || 'text/html',
      },
    });
  };
}
