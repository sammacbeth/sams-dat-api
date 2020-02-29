// tslint:disable: no-console
import program = require('commander');
import fs = require('fs');
import raf = require('random-access-file');
import datDns = require('dat-dns');
import Listr = require('listr');

import { join } from 'path';
import apiFactory from '@sammacbeth/dat-api-v1';
import { IDat } from '@sammacbeth/dat-types/lib/dat';

const addresses = new Set<string>()
program
  .name('dat-seeder')
  .option('-f --file <dats>', 'File containing a list of dats to seed')
  .option('-d --cachedir <cachedir>', 'Folder to store dats', './dat')
  .option('-p --port <port>', 'Swarm listen port')
  .arguments('[addresses...]')
  .action((addrs) => {
    if (addrs) {
      addrs.forEach((address) => {
        addresses.add(address)
      })
    }
  });

program.parse(process.argv)

if (program.file) {
  const data = fs.readFileSync(program.file);
  // extract addresses from file
  data
    .toString('utf-8')
    .split('\n')
    .map(l => l.split('#'))
    .filter(l => l[0].trim().length > 0)
    .forEach((address) => {
      addresses.add(address[0].trim());
    })
}

if (addresses.size === 0) {
  console.error('No dat addresses provided');
}
if (!fs.existsSync(program.cachedir)) {
  fs.mkdirSync(program.cachedir);
}

const api = apiFactory({
  persistantStorageFactory: (key) => Promise.resolve((name) => raf(join(program.cachedir, key, name))),
  autoListen: false,
}, {
  persist: true,
  driveOptions: {
    sparse: false,
  },
  autoSwarm: true,
  swarmOptions: {
    announce: true,
  },
});

if (program.port) {
  // force listening on specified port
  (api.loader.swarm as any).disc.listen(parseInt(program.port, 10));
}

const dns = datDns();
const resolved = new Map<string, string>();
const dats = new Map<string, IDat>();
const tasks = new Listr([
  {
    title: 'lookup addresses',
    task: () => {
      return new Listr([...addresses].map((addr) => ({
        title: addr,
        task: async (ctx, task) => {
          const key = await dns.resolveName(addr);
          resolved.set(key, addr);
          task.output = `${addr} -> ${key}`;
          return true;
        },
      })))
    }
  },
  {
    title: 'load',
    task: () => {
      return new Listr([...resolved.keys()].map((addr) => ({
        title: `${resolved.get(addr)} (${addr})`,
        task: async () => {
          const dat = await api.getDat(addr);
          await dat.ready
          return true;
        },
      })), { concurrent: true })
    }
  },
  {
    title: 'download and seed',
    task: () => {
      return new Listr([...dats.keys()].map((addr) => ({
        title: `${resolved.get(addr)} (${addr})`,
        task: async () => {
          const dat = await api.dats.get(addr);
          return new Promise((resolve, reject) => {
            dat.drive.download('/', (err) => {
              if (err) {
                return reject(err);
              }
              resolve();
            });
          });
        },
      })), { concurrent: true })
    }
  }
])

tasks.run().catch(err => {
  console.error(err);
  api.shutdown();
})

process.on('SIGINT', () => {
  console.log('Shutting down');
  api.shutdown();
});