import { Hyperdrive } from '@sammacbeth/dat-types/lib/hyperdrive';
import { expect } from 'chai';
import hyperdrive = require('hyperdrive');
import 'mocha';
import ram = require('random-access-memory');
import rimraf = require('rimraf');
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';
import { exportSecretKey, importSecretKey } from '../';

async function createDrive(...args): Promise<Hyperdrive> {
  const drive = hyperdrive(ram, ...args);
  await new Promise((resolve) => drive.ready(resolve));
  return drive;
}

function replicate(drive1, drive2) {
  const stream = drive1.replicate();
  stream.pipe(drive2.replicate()).pipe(stream);
}

describe('Key import/export', () => {
  const foreignKey = Buffer.from(
    '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5',
    'hex',
  );

  describe('export', () => {
    it('returns the secret key buffer', async () => {
      const drive = await createDrive();
      expect(exportSecretKey(drive)).to.equal(drive.metadata.secretKey);
    });

    it('throws if drive is not writable', async () => {
      const drive = await createDrive(foreignKey);
      expect(() => exportSecretKey(drive)).to.throw();
    });
  });

  describe('import', () => {
    let drivePath = '';

    beforeEach(() => {
      drivePath = join(tmpdir(), `${Math.floor(Math.random() * 10000)}`);
    });

    afterEach((done) => {
      rimraf(drivePath, { glob: false, maxBusyTries: 1 }, (err) => {
        done();
      });
    });

    it('makes the drive writable', async () => {
      const drive1 = await createDrive();
      const drive2 = await createDrive(drive1.key);
      replicate(drive1, drive2);

      // ensure everything is downloaded - drive won't download after being
      // made writable.
      await promisify(drive2.download.bind(drive2))('/');
      drive1.close();

      // import key and check keys match
      const secretKey = exportSecretKey(drive1);
      await importSecretKey(drive2, secretKey);
      expect(drive1.metadata.secretKey).to.eql(drive2.metadata.secretKey);
      expect(drive1.content.secretKey).to.eql(drive2.content.secretKey);
      expect(drive2.writable).to.eql(true);

      // now it is writable, we can write a file
      await promisify(drive2.writeFile.bind(drive2))('hello', Buffer.from('workd', 'utf-8'));

      const drive3 = await createDrive(drive2.key);
      replicate(drive2, drive3);
      const contents = await promisify(drive3.readFile.bind(drive3))('hello', { encoding: 'utf-8' });
      expect(contents).to.eql('workd');

      drive2.close();
      drive3.close();
    });

    it('persists secretKey', async () => {
      const drive1 = await createDrive();
      const drive2 = hyperdrive(drivePath, drive1.key);

      replicate(drive1, drive2);
      await promisify(drive2.download.bind(drive2))('/');
      drive1.close();

      // import secretkey into drive that is persisted to disk
      const secretKey = exportSecretKey(drive1);
      await importSecretKey(drive2, secretKey);
      expect(drive2.writable).to.eql(true);
      drive2.close();

      // open a new hyperdrive referencing files on disk. This should be writable.
      const drive3 = hyperdrive(drivePath);
      await promisify(drive3.ready.bind(drive3))();
      expect(drive3.writable).to.eql(true);
      drive3.close();
    })
  });
});
