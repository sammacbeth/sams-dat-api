// tslint:disable: no-console
import { DatV1Loader } from '@sammacbeth/dat-api-v1';
import { importSecretKey } from '@sammacbeth/dat-util';
import fs = require('fs-extra');
import { tmpdir } from 'os';
import { join } from 'path';
import raf = require('random-access-file');
import { promisify } from 'util';
import copy from './sync';

const DEFAULT_OPTIONS = {
  loadTimeout: 60,
  seedTime: 300,
  verbose: false,
};

export default async function update(
  address: Buffer,
  secretKey: Buffer,
  pubdir: string,
  options: {
    verbose?: boolean;
    saveDir?: string;
    seedTime?: number;
    loadTimeout?: number;
  } = DEFAULT_OPTIONS,
) {
  if (address.length !== 32) {
    throw new Error(`Dat address should be 64 bytes, got ${address.length}`);
  }
  if (secretKey.length !== 64) {
    throw new Error(`Secret key should be 128 bytes, got ${secretKey.length}`);
  }
  if (!(await fs.stat(pubdir)).isDirectory()) {
    throw new Error('pubdir must be a directory');
  }

  const loader = new DatV1Loader({
    autoListen: false,
    persistantStorageFactory: (addr) =>
      Promise.resolve((name) => {
        if (options.saveDir) {
          return raf(join(options.saveDir, name));
        }
        return raf(join(tmpdir(), addr, name));
      }),
  });
  console.log('Fetching latest version of dat');
  let dat = await loader.load(address, {
    driveOptions: { sparse: false },
    persist: true,
  });
  dat.joinSwarm({
    announce: true,
  });
  const loadTimer = new Promise((_, reject) =>
    setTimeout(reject.bind(`Timeout after ${options.loadTimeout}s`), 1000 * options.loadTimeout),
  );
  try {
    await Promise.race([dat.ready, loadTimer]);
  } catch (e) {
    console.error(e);
    throw new Error('Could not load the dat. Someone must be seeding it to update!');
  }

  dat.drive.readFile('/index.html', (err, result) => {
    console.log('1. i read index and it is', result.length);
  });

  // Download everything
  await promisify(dat.drive.download.bind(dat.drive))('/');
  console.log(`Loaded dat ${dat.drive.key.toString('hex')} at version ${dat.drive.version}`);

  // make dat writeable
  dat.leaveSwarm();
  await importSecretKey(dat.drive, secretKey);
  // we have to reload the dat to make sure its writable
  dat.close();
  dat = await loader.load(address, {
    driveOptions: { sparse: false },
    persist: true,
  });
  await dat.ready;

  // copy in new content
  console.log('Syncing files with local');
  await copy(pubdir, dat, '/', { overwrite: true, verbose: true });

  console.log(`Synced with local, now as version ${dat.drive.version}`);

  // start seeding again
  dat.joinSwarm({
    announce: true,
  });
}
