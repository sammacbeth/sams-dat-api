import apiFactory from '@sammacbeth/dat-api-v1';
import raf = require('random-access-file');

// create an API using file persistence
const api = apiFactory({
  persistantStorageFactory: (address) => Promise.resolve((file) => raf(`data/${address}/${file}`)),
});

(async () => {
  // create a dat and work with it's hyperdrive
  const dat = await api.createDat({ persist: true });
  await dat.ready;
  console.log('Created a Dat at address', dat.drive.key.toString('hex'));
  dat.drive.writeFile('file.txt', Buffer.from('hello world', 'utf8'), () =>
    console.log('wrote some data into the dat!'),
  );

  // join and leave the network
  dat.joinSwarm();
  dat.leaveSwarm();

  // load an existing dat in memory
  const existing = await api.getDat(
    '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5',
    { persist: false, sparse: true },
  );
  // wait for data
  await existing.ready;
  console.log('Loaded remote dat');
  const files = await new Promise((resolve, reject) => {
    existing.drive.readdir('/', (err, files) => {
      if (err) {
        return reject('error listing directory');
      }
      resolve(files);
    });
  });
  console.log('Dat has files:', files);

  // close all dats and cleanup
  api.shutdown();
})();
