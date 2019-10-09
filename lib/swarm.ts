import { Duplex } from "stream";
import { EventEmitter } from "events";

export type Replicable = {
  key: Buffer
  discoveryKey: Buffer
  ready(cb: () => void): void
  replicate(opts: any): Duplex
}

export default interface Swarm extends EventEmitter {
  events?: string[]
  add(feed: Replicable): void
  remove(feed: Replicable): void
  close(): void
}
