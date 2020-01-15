import { expect } from 'chai';
import 'mocha';
import raf = require('random-access-file');
import rimraf = require('rimraf');
import apiFactory, { DatV2API } from '../';

describe('HyperdriveAPI', function() {
  this.timeout(10000);

  async function testLocalSync(node1: DatV2API, node2: DatV2API) {
    try {
      const dat1 = await node1.createDat();
      await dat1.ready;
      await new Promise((resolve) =>
        dat1.drive.writeFile('test', Buffer.from('hello world', 'utf-8'), resolve),
      );

      const dat2 = await node2.getDat(dat1.drive.key.toString('hex'), {
        autoSwarm: true,
        driveOptions: {
          sparse: true,
        },
        persist: false,
        swarmOptions: {
          announce: false,
          lookup: true,
        },
      });
      await dat2.ready;
      const files = await new Promise((resolve, reject) => {
        dat2.drive.readdir('/', (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
      });
      expect(files).to.eql(['test']);
      const contents = await new Promise((resolve, reject) => {
        dat2.drive.readFile('/test', { encoding: 'utf-8' }, (err, data) => {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });
      expect(contents).to.eql('hello world');
    } finally {
      node1.shutdown();
      node2.shutdown();
    }
  }

  it('syncs dat locally (no persist)', () => {
    const node1 = apiFactory(
      {
        ephemeral: true,
      },
      { autoSwarm: true, persist: false, swarmOptions: { announce: true } },
    );
    const node2 = apiFactory({
      ephemeral: true,
    });
    return testLocalSync(node1, node2);
  });

  it('syncs dat locally (persist)', async () => {
    const node1 = apiFactory(
      {
        ephemeral: true,
        persistantStorageFactory: (key) => {
          return Promise.resolve((n) => raf(`./tmpdats/${key}/${n}`));
        },
      },
      { persist: true, swarmOptions: { announce: true } },
    );
    const node2 = apiFactory({
      ephemeral: true,
    });
    try {
      await testLocalSync(node1, node2);
    } finally {
      await new Promise((resolve) => rimraf('./tmpdats', resolve));
    }
  });
});
