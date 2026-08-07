// Diaza implementation of the observer pattern
// Naming convention for signals: NAMESPACE:UPPER_SNAKE and for simple implementations just UPPER_SNAKE


class SignalManager {
  constructor(){
    this.subs = {};
  }
  sub(signalName, id, callback){
    if(typeof id !== "string"){
      console.warn(`SignalManager: Signal subscriptions for "${signalName}" require a valid identifier - rejected.`);
      return;
    }
    if(this.subs[signalName] == undefined){
      this.subs[signalName] = {};
    }
    if( this.subs[signalName][id] !== undefined){
      console.warn(`SignalManager: Tried to overwrite existing subscription for signal "${signalName}" with id "${id}" all callbacks must have unique ids - rejected.`);
      return;
    }
    this.subs[signalName][id] = callback;
  }
  unsub(signalName, id){
    if(this.subs[signalName] == undefined) return;

    if(this.subs[signalName][id] !== undefined){
      delete this.subs[signalName][id];
    }
  }
  unsubAll(id){
    Object.keys(this.subs).forEach((signalName) => {
      if(this.subs[signalName][id] !== undefined){
        delete this.subs[signalName][id];
      }
    });
  }
  emit(signalName, data){
    if(this.subs[signalName] == undefined) return;

    Object.keys(this.subs[signalName]).forEach((id) => {
      if(this.subs[signalName][id] == undefined){
        return;
      }
      this.subs[signalName][id](data);
    });
  }
  emitPrivate(signalName, data, ids){
    ids.forEach((id) => {
      if(this.subs[signalName] == undefined || this.subs[signalName][id] == undefined) return;
      this.subs[signalName][id](data);
    });
  }
}

export const signal = new SignalManager();

if(import.meta.env.DEV && window !== undefined) {
  window._signal = signal; // Expose for debugging in dev mode
}