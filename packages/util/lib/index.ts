import { Hyperdrive } from "@sammacbeth/dat-types/lib/hyperdrive";

export function exportSecretKey(drive: Hyperdrive) {
  if (drive.writable) {
    return drive.metadata.secretKey;
  }
  throw new Error('drive is not writable');
}

/**
 * Updates the drive in place to make it writable by importing a secret key.
 * @param drive 
 * @param secretKey 
 */
export function importSecretKey(drive: Hyperdrive, secretKey: Buffer): Promise<void> {
  if (drive.writable) {
    throw new Error('drive is already writable');
  }
  // because we're doing nasty things with the internals!
  const metadata: any = drive.metadata;
  const anydrive: any = drive;
  drive.metadata.secretKey = secretKey;
  return new Promise((resolve, reject) => {
    metadata._storage.secretKey.write(0, secretKey, (err) => {
      if (err) {
        return reject(err);
      }
      metadata._open(() => {
        drive.content = null;
        anydrive._open(resolve);
      });
    })
  })
}