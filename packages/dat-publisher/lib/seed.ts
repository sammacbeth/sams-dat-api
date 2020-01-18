import { DatV1Loader } from '@sammacbeth/dat-api-v1';
import fs = require('fs-extra');
import { join } from 'path';
import raf = require('random-access-file');

export default async function seed(datdir: string) {
  const address = await fs.readFile(join(datdir, 'metadata', 'key'));
  console.log(`Loading dat ${address.toString('hex')} from ${datdir}`);
  const loader = new DatV1Loader({
    autoListen: true,
    persistantStorageFactory: (_) => Promise.resolve((name) => raf(`${datdir}/${name}`)),
  });
  loader.swarm.on('connection', () => {
    console.log('connected to a peer');
  })
  const dat = await loader.load(address, { persist: true, driveOptions: { sparse: false } });
  dat.joinSwarm({
    announce: true,
  });
  await dat.ready;
  console.log(`Dat loaded and seeding`);
}
