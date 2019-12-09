import { expect } from 'chai';
import ram = require('random-access-memory');
import 'mocha';
import apiFactory, { DatV1API } from '../';

describe('HyperdriveAPI', function() {
  this.timeout(10000);

  const datAddr = '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5';
  let api: DatV1API;
  const persistedSet = new Set();
  const deletedSet = new Set();

  beforeEach(() => {
    api = apiFactory({
      persistantStorageFactory: (key) => {
        persistedSet.add(key);
        return ram;
      },
      persistantStorageDeleter: (key) => {
        deletedSet.add(key);
        return Promise.resolve();
      },
    });
  });

  afterEach(() => {
    api.shutdown();
    persistedSet.clear();
    deletedSet.clear();
  });

  it('can checkout and list directory', async () => {
    const dat = await api.getDat(datAddr, {
      persist: false,
      sparse: true,
    });

    await dat.ready;
    await new Promise((resolve, reject) => {
      dat.drive.checkout(32).readdir('/', (err, files) => {
        if (err) {
          reject(err);
          dat.close();
        } else {
          expect(files).to.have.length(11);
          dat.close();
          resolve();
        }
      });
    });
  });

  describe('persist', () => {
    it('uses provided storage factory', async () => {
      const dat = await api.createDat({ persist: true, autoSwarm: false });
      await dat.ready;
      expect(persistedSet).to.have.length(1);
      expect(persistedSet).to.contain(dat.drive.key.toString('hex'));
    });
  });

  describe('#deleteDatData', () => {
    it('calls deletion function for key', async () => {
      const dat = await api.createDat({ persist: true, autoSwarm: false });
      await dat.ready;
      const addr = dat.drive.key.toString('hex');
      dat.close();
      await api.deleteDatData(addr);
      expect(deletedSet).to.have.length(1);
      expect(deletedSet).to.contain(addr);
    });
  });
});
