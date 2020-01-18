// tslint:disable: no-console
import { IDat } from '@sammacbeth/dat-types/lib/dat';
import crypto = require('crypto');
import fs = require('fs-extra');
import { Stats } from 'fs-extra';
import { join } from 'path';
import pump = require('pump');
import { promisify } from 'util';

export default async function copy(
  src: string,
  dest: IDat,
  destPrefix: string = '',
  options: { overwrite?: boolean; errorOnExist?: boolean; verbose?: boolean; delete?: boolean } = {
    delete: false,
    errorOnExist: false,
    overwrite: true,
    verbose: false,
  },
) {
  const datMkdir = promisify(dest.drive.mkdir.bind(dest.drive));
  const log = (...msg) => {
    if (options.verbose) {
      console.log(...msg);
    }
  };
  const files = await fs.readdir(src);
  const sync = files.map(async (file) => {
    const fsPath = join(src, file);
    const datPath = join(destPrefix, file);
    const fSource = await fs.stat(fsPath);
    const fTarget = await tryStatDat(dest, datPath);
    if (fSource.isDirectory()) {
      if (!fTarget) {
        log('Add new directory', datPath);
        await datMkdir(datPath);
      }
      return copy(fsPath, dest, datPath, options);
    }
    if (!fTarget) {
      log('Add new file', datPath);
      return new Promise((resolve, reject) => {
        pump(fs.createReadStream(fsPath), dest.drive.createWriteStream(datPath), (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }
    // file exists
    if (!options.overwrite && options.errorOnExist) {
      throw new Error(`copy failed, file already exists ${datPath}`);
    } else if (!options.overwrite) {
      // don't overwrite
      log('Skip existing file', datPath);
      return;
    }
    // compare checksums to see if copy is needed
    const [sourceChecksum, targetChecksum] = await Promise.all([
      checksum(fs.createReadStream(fsPath)),
      checksum(dest.drive.createReadStream(datPath)),
    ]);
    if (sourceChecksum === targetChecksum) {
      log('File already exists (unchanged)', datPath);
    } else {
      log('File changed, updating', datPath);
      return new Promise((resolve, reject) => {
        pump(fs.createReadStream(fsPath), dest.drive.createWriteStream(datPath), (err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }
  });
  // wait for all subdirectories to sync
  await Promise.all(sync);
  if (options.delete) {
    // check for extra folders on dest side
    const destFiles = new Set<string>(
      await promisify(dest.drive.readdir.bind(dest.drive))(destPrefix),
    );
    files.forEach((f) => destFiles.delete(f));
    const deletions = [...destFiles].filter((f) => {
      return shouldDeletePath(join(destPrefix, f));
    }).map(async (f) => {
      try {
        await datDelete(dest, join(destPrefix, f), { verbose: options.verbose });
      } catch (e) {
        console.warn('Error deleting', join(destPrefix, f), e);
      }
    });
    await Promise.all(deletions);
  }
}

async function datDelete(dat: IDat, path: string, options = { verbose: false }) {
  const stat = await tryStatDat(dat, path);
  if (!stat) {
    // file doesn't exist
    return;
  }
  if (stat.isDirectory()) {
    const files = await promisify(dat.drive.readdir.bind(dat.drive))(path);
    const deletions = files.map((f) => {
      return datDelete(dat, join(path, f));
    });
    await Promise.all(deletions);
    if (options.verbose) {
      console.log('delete directory', path);
    }
    await promisify(dat.drive.rmdir.bind(dat.drive))(path);
  } else {
    if (options.verbose) {
      console.log('delete file', path);
    }
    await promisify(dat.drive.unlink.bind(dat.drive))(path);
  }
}

async function tryStatDat(dat: IDat, path: string): Promise<Stats | null> {
  return new Promise((resolve) => {
    dat.drive.stat(path, (err, result) => {
      if (err) {
        return resolve(null);
      }
      resolve(result);
    });
  });
}

function checksum(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve) => {
    const hash = crypto.createHash('md5');
    stream.on('data', (data) => {
      hash.update(data);
    });
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
}

const DEFAULT_IGNORE = new Set([
  join('dat.json'),
  join('.well-known', 'dat'),
  join('.well-known')
])

function shouldDeletePath(path: string) {
  if (DEFAULT_IGNORE.has(path)) {
    return false;
  }
  if (path.startsWith('/') && DEFAULT_IGNORE.has(path.slice(1))) {
    return false;
  }
  return true;
}