import wrtc = require('wrtc');
import API from '../lib/v1wrtc';

const api = new API({
  wrtcOpts: {
    simplePeer: {
      wrtc,
    }
  }
});

const datAddr = '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5';

(async function() {
  const dat = await api.load(Buffer.from(datAddr, 'hex'), {
    persist: false,
    sparse: false,
  });
  console.log('loaded');
  await dat.joinSwarm();
  await dat.ready;
  console.log('ready');
  dat.drive.readdir('/', (err, files) => {
    if (err) {
      console.error(err);
    } else {
      console.log(files);
    }
  });
  dat.drive.checkout(32).download((err) => console.log('Downloaded V32', err));
  dat.drive.checkout(33).download((err) => console.log('Downloaded V33', err));
})();
