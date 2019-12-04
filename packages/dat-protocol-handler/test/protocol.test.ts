import apiFactory, { DatV1API } from '@sammacbeth/dat-api-v1';
import { IDat } from '@sammacbeth/dat-types/lib/dat';
import { expect } from 'chai';
import 'mocha';
import pda = require('pauls-dat-api');
import createHandler, { IsADirectoryError, NotFoundError, resolvePath } from '../';

const MOCK_HTML = '<html></html>';

describe('Protocol Handler', function() {
  let datAddr = '';
  let api: DatV1API;
  let dat: IDat;

  before(async () => {
    api = apiFactory();
  });

  beforeEach(async () => {
    dat = await api.createDat({ persist: false, autoSwarm: false });
    await dat.ready;
    datAddr = dat.drive.key.toString('hex');
  });

  afterEach(async () => {
    dat.close();
  });

  after(() => {
    api.shutdown();
  });

  describe('#resolvePath', () => {
    it('file in root', async () => {
      await pda.writeFile(dat.drive, '/file.html', MOCK_HTML);
      expect((await resolvePath(dat.drive, '/file.html')).path).to.equal('/file.html');
    });

    it('index from root directory', async () => {
      await pda.writeFile(dat.drive, '/index.html', MOCK_HTML);
      expect((await resolvePath(dat.drive, '/')).path).to.equal('/index.html');
    });

    it('index in subdirectory', async () => {
      await pda.mkdir(dat.drive, 'test');
      await pda.writeFile(dat.drive, '/test/index.html', 'MOCK_HTML');
      expect((await resolvePath(dat.drive, '/test/')).path).to.equal('/test/index.html');
      expect((await resolvePath(dat.drive, '/test')).path).to.equal('/test/index.html');
    });

    it('html referenced without extension', async () => {
      await pda.writeFile(dat.drive, '/test.html', MOCK_HTML);
      expect((await resolvePath(dat.drive, '/test')).path).to.equal('/test.html');
    });

    it('uses version option', async () => {
      await pda.writeFile(dat.drive, '/test.html', MOCK_HTML);
      await pda.mkdir(dat.drive, 'test');
      await pda.writeFile(dat.drive, '/test/index.html', MOCK_HTML);
      await pda.unlink(dat.drive, '/test.html');
      expect((await resolvePath(dat.drive, '/test')).path).to.equal('/test/index.html');
      expect((await resolvePath(dat.drive, '/test', 1)).path).to.equal('/test.html');
      // note that without trailing test, the .html extension detection takes precidence over dir index
      expect((await resolvePath(dat.drive, '/test', 3)).path).to.equal('/test.html');
      expect((await resolvePath(dat.drive, '/test/', 3)).path).to.equal('/test/index.html');
    });

    it('not found throws', async () => {
      try {
        await resolvePath(dat.drive, '/test.html');
        expect.fail('Should throw not found for not found');
      } catch (e) {
        expect(e).to.be.an.instanceOf(NotFoundError);
      }
    });

    describe('manifest web_root', () => {
      it('changes the root folder', async () => {
        await pda.mkdir(dat.drive, 'test');
        await pda.writeFile(dat.drive, '/test/index.html', MOCK_HTML);
        await pda.writeManifest(dat.drive, { web_root: '/test/' });
        expect((await resolvePath(dat.drive, '/')).path).to.equal('/test/index.html');
      });
    });

    describe('manifest fallback_page', () => {
      it('prevents not found error', async () => {
        await pda.writeFile(dat.drive, '/test.html', MOCK_HTML);
        await pda.writeManifest(dat.drive, { fallback_page: '/test.html' });
        expect((await resolvePath(dat.drive, '/something')).path).to.equal('/test.html');
      });

      it('not found when fallback page does not exist', async () => {
        await pda.writeManifest(dat.drive, { fallback_page: '/test.html' });
        try {
          await resolvePath(dat.drive, '/something');
          expect.fail('Should throw not found for not found');
        } catch (e) {
          expect(e).to.be.an.instanceOf(NotFoundError);
        }
      });

      it('existing pages are resolved', async () => {
        await pda.writeFile(dat.drive, '/test.html', MOCK_HTML);
        await pda.writeFile(dat.drive, '/index.html', MOCK_HTML);
        await pda.writeManifest(dat.drive, { fallback_page: '/test.html' });
        expect((await resolvePath(dat.drive, '/')).path).to.equal('/index.html');
      });
    });
  });

  describe('factory', () => {
    const handlerOpts = { autoSwarm: false, persist: false, sparse: true };
    const mockDNS = (s: string) => Promise.resolve(s);

    beforeEach(async () => {
      await pda.writeFile(dat.drive, '/file.html', MOCK_HTML);
    });

    it('returns a stream with the content', async () => {
      const datHandler = createHandler(api, mockDNS, handlerOpts);
      const stream = await datHandler(`dat://${datAddr}/file.html`);
      let chunks = [];
      const contents: string = await new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
      expect(contents).to.eql(MOCK_HTML);
    });

    it('throws an error on DNS failure', async () => {
      const datHandler = createHandler(api, () => Promise.reject('DNSError'), handlerOpts);
      try {
        await datHandler(`dat://${datAddr}/file.html`);
        expect.fail('Expected to throw');
      } catch (e) {}
    });

    it('throws an error if url is not valid', async () => {
      const datHandler = createHandler(api, mockDNS, handlerOpts);
      try {
        await datHandler('something', 5000);
        expect.fail('Expected to throw');
      } catch (e) {}
    });

    it('throws a NotFoundError error if path does not exist', async () => {
      const datHandler = createHandler(api, mockDNS, handlerOpts);
      try {
        await datHandler(`dat://${datAddr}/test.html`, 5000);
        expect.fail('Expected to throw');
      } catch (e) {
        expect(e).to.be.an.instanceOf(NotFoundError);
      }
    });

    it('throws a IsADirectoryError for directories without an index', async () => {
      const datHandler = createHandler(api, mockDNS, handlerOpts);
      await pda.mkdir(dat.drive, 'test');
      try {
        await datHandler(`dat://${datAddr}/test/`, 5000);
        expect.fail('Expected to throw');
      } catch (e) {
        expect(e).to.be.an.instanceOf(IsADirectoryError);
      }
    });
  });
});
