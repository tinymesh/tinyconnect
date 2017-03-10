import _ from 'lodash'

import BaseStore from './base'
import Dispatcher from './dispatcher'
import {PortsAPI, PortsStore} from './ports'

// storage of ports
class ConnectionStore extends BaseStore {


   constructor() {
      super()

      this.subscribe(this._subscribe.bind(this))

      this._connections = {}
   }

   _subscribe(action) {
      switch (action.action) {
         case PortsAPI.ACTIONS.conn.open:
            if (!this._connections[action.port] || !this._connections[action.port].pid) {
               this._connections[action.port] = {
                  port: action.port,
                  pid: action.pid,
                  output: action.data
               }
            } else
               throw new Error("connection " + action.port + " already exists!")

            this.emitChange()
            break

         case PortsAPI.ACTIONS.conn.state:
            this._connections[action.port] = {
               port: action.port,
               pid: action.pid,
               output: action.data,
            }
            this.emitChange()
            break

         case PortsAPI.ACTIONS.conn.close:
            if (this._connections[action.port]) {
               this._connections[action.port].pid = null
               this.emitChange()
            }

            break

         case PortsAPI.ACTIONS.conn.data:
            this._connections[action.port].output.push({
               data: action.data,
               fd: action.fd
            })
            this.emitChange()
            break

         case PortsAPI.ACTIONS.conn.error:
            console.log("howtohandle?", action)
            this.emitChange()
      }
   }

   conn(port) {
      return this._connections[port]
   }

}
const Storage = new ConnectionStore()

export {Storage as ConnectionStore}



