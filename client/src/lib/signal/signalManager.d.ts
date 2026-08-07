/** Types for signal.js, which is plain JS. */
declare class SignalManager {
  sub<Payload>(signalName: string, id: string, callback: (data: Payload) => void): void
  unsub(signalName: string, id: string): void
  unsubAll(id: string): void
  emit<Payload>(signalName: string, data?: Payload): void
  emitPrivate<Payload>(signalName: string, data: Payload, ids: string[]): void
}

export declare const signal: SignalManager
