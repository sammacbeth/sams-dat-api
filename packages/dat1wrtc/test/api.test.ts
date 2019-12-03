import { expect } from 'chai';
import 'mocha';
import apiFactory, { DatV1API } from '../';

describe('HyperdriveAPI', function () {
  this.timeout(10000);

  const datAddr = '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5';
  let api: DatV1API;
  
  beforeEach(() => {
    api = apiFactory();
  });

  afterEach(() => {
    api.shutdown();
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
})