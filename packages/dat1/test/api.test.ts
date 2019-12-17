import { expect } from 'chai';
import ram = require('random-access-memory');
import 'mocha';
import apiFactory, { DatV1API } from '../';
import { fail } from 'assert';

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
      autoListen: false,
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

  describe('Swarm options', () => {
    it('load dat without announcing', async () => {
      const dat = await api.getDat(datAddr, { autoSwarm: true, persist: false, announce: false });
      await dat.ready;
      const swarm: any = api.loader.swarm;
      const addr: string = Object.keys(swarm.disc._swarm._discovery._announcing)[0];
      const port = addr.split(':')[1];
      expect(port).to.be.eql('0');
    });

    it('swarm defaults no announce', async () => {
      api = apiFactory({}, { persist: false, announce: false });
      const dat = await api.getDat(datAddr, { autoSwarm: true, persist: false });
      await dat.ready;
      const swarm: any = api.loader.swarm;
      const addr: string = Object.keys(swarm.disc._swarm._discovery._announcing)[0];
      const port = addr.split(':')[1];
      expect(port).to.be.eql('0');
    });

    it('swarm defaults can be overridden', async () => {
      api = apiFactory({}, { persist: false, announce: false });
      const dat = await api.getDat(datAddr, { autoSwarm: true, persist: false, announce: true });
      await dat.ready;
      const swarm: any = api.loader.swarm;
      const addr: string = Object.keys(swarm.disc._swarm._discovery._announcing)[0];
      const port = addr.split(':')[1];
      expect(port).to.not.be.eql('0');
    });
  });

  describe('upload and download options', () => {
    let apiNoUpload: DatV1API;

    beforeEach(() => {
      apiNoUpload = apiFactory();
    });

    afterEach(() => {
      apiNoUpload.shutdown();
    });

    // While the option exists in the documentation, support in the code in hypercore 7
    // seems to not be there.
    it('upload: does not disable data upload', async () => {
      const datOriginal = await apiNoUpload.createDat({ persist: false, upload: false });
      await datOriginal.ready;
      datOriginal.drive.writeFile('test', Buffer.from('hello world', 'utf8'));

      const datRemote = await api.getDat(datOriginal.drive.key.toString('hex'), {
        persist: false,
      });
      await datRemote.ready;
      const dir = await new Promise((resolve, reject) => {
        datRemote.drive.readdir('/', (err, files) => {
          if (err) return reject(err);
          resolve(files);
        });
      });
      expect(dir).to.have.length(1);
      expect(dir).to.contain('test');
      datRemote.close();
    });

    it('download: disables data download', async () => {
      const datOriginal = await apiNoUpload.createDat({ persist: false, upload: false });
      await datOriginal.ready;
      datOriginal.drive.writeFile('test', Buffer.from('hello world', 'utf8'));

      const datRemote = await api.getDat(datOriginal.drive.key.toString('hex'), {
        persist: false,
        download: false,
      });
      await new Promise((resolve, reject) => {
        datRemote.ready.then(() => reject('should not be ready'));
        setTimeout(() => {
          resolve();
          datRemote.close();
        }, 300);
      });
    });
  });
});
