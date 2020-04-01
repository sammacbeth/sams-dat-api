import { expect } from 'chai';
import 'mocha';
import apiFactory, { DatV1API } from '../';

describe('HyperdriveAPI', function() {
  this.timeout(10000);

  const datAddr = '60c525b5589a5099aa3610a8ee550dcd454c3e118f7ac93b7d41b6b850272330';
  let api: DatV1API;

  beforeEach(() => {
    api = apiFactory();
  });

  afterEach(() => {
    api.shutdown();
  });

  it('can checkout and list directory', async () => {
    const dat = await api.getDat(datAddr, {
      driveOptions: {
        sparse: true,
      },
      persist: false,
    });

    await dat.ready;
    await new Promise((resolve, reject) => {
      dat.drive.checkout(1302).readdir('/', (err, files) => {
        if (err) {
          reject(err);
          dat.close();
        } else {
          expect(files).to.have.length(20);
          dat.close();
          resolve();
        }
      });
    });
  });

  describe('Swarm options', () => {
    it('load dat without announcing', async () => {
      const dat = await api.getDat(datAddr, {
        autoSwarm: true,
        persist: false,
        swarmOptions: { announce: false },
      });
      await dat.ready;
      const swarm: any = api.loader.swarm;
      const addr: string = Object.keys(swarm.disc._swarm._discovery._announcing)[0];
      const port = addr.split(':')[1];
      expect(port).to.be.eql('0');
    });
  });
});
