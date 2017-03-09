import processes from 'child_process'
import _ from 'lodash'

import BaseStore from './base'
import Dispatcher from './dispatcher'

export class PortsAPI {
   static list() {
      const ports = processes.spawnSync('./tm-serial-adapter', ['-list'], {encoding: 'ascii'})

      return ports.output[1]
         .split(/[\r\n]/)
         .filter((buf) => !!buf)
   }

   static open(port) {
      console.log('PortsAPI: open', port)
   }

   static close(port) {
      console.log('PortsAPI: close', port)
   }
}

// storage of ports
class PortsStore extends BaseStore {
   static get ACTION() {
      return 'ports:change'
   }

   constructor() {
      super()

      this.subscribe(this._subscribe.bind(this))

      this._ports = PortsAPI.list()
      this._added = []
      this._removed = []

      this._interval = setInterval(function() {
         const
            newports = PortsAPI.list(),
            added = _.difference(newports, this._ports),
            removed = _.difference(this._ports, newports)

         if (added.length > 0 || removed.length > 0) {
            Dispatcher.dispatch({
               action: PortsStore.ACTION,
               ports: newports,
               added,
               removed
            })
         }
      }.bind(this), 1500)

   }

   _subscribe(action) {
      console.log('action', action)
      if (PortsStore.ACTION === action.action) {
         this._ports = action.ports
         this._added = action.added
         this._removed = action.removed
         this.emitChange()
      }
   }

   get ports() {
      return this._ports
   }

   get added() {
      return this._added
   }

   get removed() {
      return this._removed
   }

   port(port) {
      return this._ports[port]
   }

}
const Storage = new PortsStore()

export {Storage as PortsStore}


