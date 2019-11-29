import apiFactory, { DatV1API } from '@sammacbeth/dat-api-v1';
import { expect } from 'chai';
import 'mocha';
import { resolvePath } from '../';

describe('Protocol Handler', function () {
  this.timeout(10000);

  const datAddr = '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5';
  let api: DatV1API;

  before(() => {
    api = apiFactory();
  });

  after(() => {
    api.shutdown();
  });

  describe('#resolvePath', () => {
    it('resolves paths correctly', async () => {
      const dat = await api.getDat(datAddr, {
        persist: false,
        sparse: true,
      });

      await dat.ready;
      expect((await resolvePath(dat, '/', 33)).path).to.equal('/index.html');
      expect((await resolvePath(dat, '/posts', 33)).path).to.equal('/posts/index.html');
      expect((await resolvePath(dat, '/posts', 32)).path).to.equal('/posts.html');

      try {
        await resolvePath(dat, '/posts.html', 33);
        fail('Should throw not found for posts.html');
      } catch (e) {
        expect(e.message).to.equal('NOT FOUND');
      }
    });
  });
});
