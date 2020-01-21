import 'mocha';
import { networkInterfaces } from 'os';
import isIpPrivate = require('private-ip');

import HyperDiscovery from '../';

const datKey = Buffer.from(
  'ee172d7cd9235b2cf86ea9481e8a40e48cea29c743036621edc79a4765aa0281',
  'hex',
);
const discKey = Buffer.from(
  'e5caa90b5c2cd1fe5d3c176addf818a0aa5b9e3c9dc0488e09bc13cf9d99bce3',
  'hex',
);
const fakeFeed = {
  discoveryKey: discKey,
  key: datKey,
  ready(cb) {
    cb(null);
  },
  // tslint:disable-next-line: no-empty
  close() {},
  replicate({}) {
    return null;
  },
};

const addresses = new Set();
for (const addrs of Object.values(networkInterfaces())) {
  for (const { address } of addrs) {
    if (isIpPrivate(address)) {
      addresses.add(address);
    }
  }
}

describe('Hyperdiscovery', function() {
  this.timeout(10000);

  let swarms = [];

  afterEach(() => {
    // cleanup swarms
    swarms.forEach((s) => {
      s.remove(fakeFeed);
      s.close();
    });
    swarms = [];
  });

  it('announces to the network', (done) => {
    const randomPort = 4000 + Math.floor(Math.random() * 10000);
    const disc = new HyperDiscovery({ autoListen: true, port: randomPort });
    disc.add(fakeFeed);
    const disc2 = new HyperDiscovery({ autoListen: false });
    disc2.on('peer', (peer) => {
      if (peer.port === disc.port && !addresses.has(peer.host)) {
        // this is probably me!
        done();
      }
    });
    disc2.add(fakeFeed);
    swarms.push(disc);
    swarms.push(disc2);
  });
});
