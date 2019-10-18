import wrtc = require('wrtc');
import Dat1Loader from '../lib/v1';
import API from '../lib/';

const api = new API(new Dat1Loader());

const datAddr = '41f8a987cfeba80a037e51cc8357d513b62514de36f2f9b3d3eeec7a8fb3b5a5';

(async function() {
  const dat = await api.getDat(datAddr, true, {
    persist: false,
    sparse: true,
  });

  function onExit() {
    console.log('shutting down');
    try {
      dat.leaveSwarm();
      dat.close();
      api.loader.swarm.close();
    } catch (e) {
      console.warn(e);
      process.exit(1);
    }
  }
  process.on('exit', onExit);
  process.on('SIGINT', onExit);

  console.log('loaded');
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
