# sams-dat-api

This repository contains a collection of modules for working with Dat's hyper*
ecosystem in a unified manner. It is written in Typescript and includes full
type annotations for Hyperdrive and Hypercore.

It currently contains the following modules:
 * `@sammacbeth/dat-types`: Typescript definitions used by other modules.
 * `@sammacbeth/dat-api-core`: Core API.
 * `@sammacbeth/dat-network-hyperdiscovery`: Dat discovery swarm using the [hyperdiscovery] module.
 * `@sammacbeth/dat-network-hyperwebrtc`: Dat discovery swarm using [hyperdiscovery] plus [discovery-swarm-webrtc].
 * `@sammacbeth/dat-api-v1`: Dat API for v1 Dats, i.e. Hyperdrive 9.x with hyperdiscovery.
 * `@sammacbeth/dat-api-v1wrtc`: As above but using `@sammacbeth/dat-network-hyperwebrtc`.
 * `@sammacbeth/dat2-api`: Dat API for v2 Dats (experimental).
 * `@sammacbeth/dat-archive`: Factory for the `DatArchive` API.
 * `@sammacbeth/dat-protocol-handler`: Resolves dat URLs to Node Streams, backed by the core API.
 * `@sammacbeth/dat-publisher`: Command line tool for creating and publishing Dats.
 * `@sammacbeth/dat-util`: Utility functions for dat (secret key import and export).

## Usage

```typescript
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
    '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5', {
      persist: false,
      driveOptions: {
        sparse: true,
      },
    },
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
```

## License

MIT

  [hyperdiscovery]: https://github.com/datproject/hyperdiscovery
  [discovery-swarm-webrtc]: https://github.com/geut/discovery-swarm-webrtc