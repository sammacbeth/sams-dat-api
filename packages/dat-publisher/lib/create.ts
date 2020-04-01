// tslint:disable: no-console
import { DatV1Loader } from '@sammacbeth/dat-api-v1';
import { exportSecretKey } from '@sammacbeth/dat-util';
import fs = require('fs-extra');
import raf = require('random-access-file');
import copy from './sync';

export default async function create(pubdir: string, datDir: string) {
  if (await fs.pathExists(datDir)) {
    throw new Error('datdir must not exist');
  }
  if (!(await fs.stat(pubdir)).isDirectory()) {
    throw new Error('pubdir must be a directory');
  }

  const loader = new DatV1Loader({
    discoveryOpts: {
      autoListen: false,
    },
    persistantStorageFactory: (_) => Promise.resolve((name) => raf(`${datDir}/${name}`)),
  });

  console.log('Creating dat');
  const dat = await loader.create({
    persist: true,
  });
  console.log('Copying contents');
  await copy(pubdir, dat, '', { overwrite: false, errorOnExist: true });

  console.log('Dat created');
  console.log(`Public address: ${dat.drive.key.toString('hex')}`);
  console.log(`Secret key: ${exportSecretKey(dat.drive).toString('hex')}`);
  dat.close();
  loader.suspend();
}
