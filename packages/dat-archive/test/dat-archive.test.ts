import apiFactory, { DatV1API } from '@sammacbeth/dat-api-v1';
import { expect } from 'chai';
import 'mocha';
import createDatArchive, { create, fork, IDatArchive } from '../';
import { IDat } from '@sammacbeth/dat-types/lib/dat';

async function expectPromiseRejected(asyncFunc) {
  return new Promise((resolve, reject) => {
    asyncFunc.then(reject, resolve);
  });
}

describe('DatArchive', function() {
  const testDatAddr = 'c2598003fcdbf6c3a342c228012d8489f0f07d83bb7fc7c71197482ea1013ad1';
  let api: DatV1API;

  before(async () => {
    api = apiFactory();
  });

  after(() => {
    api.shutdown();
  });

  describe('createDatArchive for readonly archive', () => {
    let dat: IDat;
    let archive: IDatArchive;
    const archiveUrl = `dat://${testDatAddr}`;
    const testFile = 'test.txt';
    const testFileContents = 'Test getting content from file, äü\r\n';

    before(async () => {
      dat = await api.getDat(testDatAddr, {
        autoSwarm: true,
        driveOptions: {
          sparse: true,
        },
        persist: false,
      });
      await dat.ready;
      archive = await createDatArchive(dat.drive);
    });

    it('url contains the archive url', () => {
      expect(archive.url).to.equal(`dat://${testDatAddr}`);
    });

    describe('getInfo()', () => {
      it('fetches information about the archive', async () => {
        const info = await archive.getInfo();
        expect(info.key).to.equal(archiveUrl.substring(6));
        expect(info.url).to.equal(archiveUrl);
        expect(info.title).to.equal('DatArchive Tests');
        expect(info.description).to.equal('Tests for DatArchive API');
        // other properties
        ['version', 'peers', 'isOwner', 'mtime'].forEach((p) => {
          expect(info).to.have.property(p);
        });
      });
    });

    describe('configure()', () => {
      it('rejects with error', () => {
        return expectPromiseRejected(archive.configure({ title: 'new title' }));
      });
    });

    describe('stat()', () => {
      it('fetches information about a file', async () => {
        const stat = await archive.stat(testFile);
        expect(stat.isFile()).to.be.true;
        expect(stat.isDirectory()).to.be.false;
        ['size', 'blocks', 'downloaded', 'mtime', 'ctime'].forEach((p) => {
          expect(stat).to.have.property(p);
        });
        expect(stat.size).to.equal(38);
      });

      it('fetches information about a directory', async () => {
        const stat = await archive.stat('node_modules');
        expect(stat.isFile()).to.be.false;
        expect(stat.isDirectory()).to.be.true;
        ['size', 'blocks', 'downloaded', 'mtime', 'ctime'].forEach((p) => {
          expect(stat).to.have.property(p);
        });
      });

      it('rejects promise if file does not exist', () => {
        expect(() => archive.stat('nonexistant')).to.throw;
      });
    });

    describe('readFile()', () => {
      it('reads file contents (default)', async () => {
        const contents = await archive.readFile(testFile);
        expect(contents).to.equal(testFileContents);
      });

      it('reads file contents (utf-8)', async () => {
        const contents = await archive.readFile(testFile, { encoding: 'utf8' });
        expect(contents).to.equal(testFileContents);
      });

      it('reads file contents (base64)', async () => {
        const contents = await archive.readFile(testFile, { encoding: 'base64' });
        expect(contents).to.equal('VGVzdCBnZXR0aW5nIGNvbnRlbnQgZnJvbSBmaWxlLCDDpMO8DQo=');
      });

      it('reads file contents (hex)', async () => {
        const contents = await archive.readFile(testFile, { encoding: 'hex' });
        expect(contents).to.equal(
          '546573742067657474696e6720636f6e74656e742066726f6d2066696c652c20c3a4c3bc0d0a',
        );
      });

      xit('reads file contents (binary)', async () => {
        const contents = await archive.readFile(testFile, { encoding: 'binary' });
        const binaryContents = Buffer.from(testFileContents, 'utf-8');
        if (contents instanceof ArrayBuffer) {
          expect(contents.byteLength).to.equal(binaryContents.byteLength);
          expect(new Uint8Array(contents).toString()).to.equal(
            new Uint8Array(binaryContents).toString(),
          );
        } else {
          expect.fail(`${typeof contents} should be an ArrayBuffer`);
        }
      });
    });

    describe('readdir()', () => {
      const expectedFiles = [
        'node_modules',
        'dat-archive-test.js',
        'dat.json',
        'index.html',
        'package-lock.json',
        'package.json',
        'reporter.js',
        'test.txt',
      ];

      it('reads contents of the directory as an array', async () => {
        const files = await archive.readdir('/');
        expect(files).to.have.length(expectedFiles.length);
        expect(files).to.have.members(expectedFiles);
      });

      it('opts.recursive returns a recursive listing', async () => {
        const files = await archive.readdir('/node_modules/chai/lib', { recursive: true });
        expect(files).to.contain('chai.js');
        expect(files).to.contain('chai/core/assertions.js');
        expect(files).to.contain('chai/core');
      });

      it('opts.recursive lists directories with unix-style (/) separators, no preceding slash', async () => {
        const files = await archive.readdir('/node_modules/chai/lib', { recursive: true });
        expect(files).to.contain('chai/core/assertions.js');
      });

      it('opts.stat returns an array of stat objects', async () => {
        const files = await archive.readdir('/', { stat: true });
        expect(files).to.have.length(expectedFiles.length);
        files.forEach((f) => {
          expect(f).to.be.a('object');
          expect(f).to.have.property('name');
          expect(f).to.have.property('stat');
          expect(f.name).to.be.a('string');
          expect(f.stat).to.be.a('object');
        });
      });
    });
  });

  describe('create', () => {
    it('creates an archive with specified options in the manifest', async () => {
      const archive = await create(
        api,
        { persist: false, autoSwarm: false },
        {
          title: 'Test',
          description: 'Test description',
        },
      );
      const info = await archive.getInfo();
      expect(info.isOwner).to.be.true;
      expect(info.title).to.eql('Test');
      expect(info.description).to.eql('Test description');
    });
  });

  describe('fork', () => {
    it('copies contents of an archive into a new Dat', async () => {
      const srcDat = await api.createDat({ persist: false, autoSwarm: false });
      const srcArchive = await createDatArchive(srcDat.drive);
      await srcArchive.configure({
        title: 'Test',
        description: 'Test description',
      });
      const dstArchive = await fork(api, srcDat.drive, { persist: false, autoSwarm: false }, {});

      const srcInfo = await srcArchive.getInfo();
      const dstInfo = await dstArchive.getInfo();
      expect(dstInfo.isOwner).to.be.true;
      expect(dstInfo.title).to.eql('Test');
    });
  });
});
