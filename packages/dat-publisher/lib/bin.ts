// tslint:disable: no-console
import commander = require('commander');
import create from './create';
import seed from './seed';
import update from './update';

const program = new commander.Command('dat-publisher');
program
  .command('update <address> <pubdir>')
  .description('update the existing dat at <address> with the contents of <pubdir>')
  .requiredOption('-s, --secret <secretKey>', 'secret key for publishing dat')
  .option('-d, --datDir <dir>', 'load/create dat to disk at <dir>')
  .option('-v, --verbose', 'be more verbose than normal')
  .option('--delete', 'Delete files that are removed from source directory')
  .option('--seedtime <seedtime>', 'seconds to seed for after updating', (val) => parseInt(val, 10), 300)
  .option('--loadtimeout <timeout>', 'timeout (in seconds) when loading the current version of the dat', (val) => parseInt(val, 10), 60)
  .action(async (address, pubdir, cmd) => {
    try {
      const { datDir, secret, verbose, seedtime, loadtimeout } = cmd;
      const addressBuf = Buffer.from(address, 'hex');
      const secretKey = Buffer.from(secret, 'hex');
      await update(addressBuf, secretKey, pubdir, { verbose, saveDir: datDir, seedTime: seedtime, loadTimeout: loadtimeout});
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program
  .command('create <pubdir> <datdir>')
  .description('create a dat at <datdir> with the contents of <pubdir>')
  .action(async (pubdir, datdir) => {
    try {
      await create(pubdir, datdir);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

  program
  .command('seed <datdir>')
  .description('seed the dat at <datdir> (as created by e.g. the create command) to the network')
  .action(async (datdir) => {
    try {
      await seed(datdir);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  });

program.parse(process.argv);
