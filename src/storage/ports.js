import {ipcRenderer, remote} from 'electron'
import _ from 'lodash'

import BaseStore from './base'
import Dispatcher from './dispatcher'
import {ConnectionStore} from './connection'


class Ports {
   get ACTIONS() {
      return {
         ports: {
            list: 'port:list',
         },

         conn: {
            state: 'port:state',
            open:  'port:open',
            close: 'port:close',
            error: 'port:error',
            data:  'port:data',
         }
      }
   }

   constructor() {
      ipcRenderer.on(this.ACTIONS.ports.list, (ev, {ports, added, removed}) => {
         Dispatcher.dispatch({
            action: this.ACTIONS.ports.list,
            ports,
            added,
            removed})
      })

      ipcRenderer.on(this.ACTIONS.conn.open, (ev, {pid, port, data}) =>
         Dispatcher.dispatch({
            action: this.ACTIONS.conn.open,
            port,
            data,
            pid
         })
      )

      ipcRenderer.on(this.ACTIONS.conn.close, (ev, {port, pid, error}) =>
         Dispatcher.dispatch({
            action: this.ACTIONS.conn.close,
            port,
            pid,
            error
         })
      )

      ipcRenderer.on(this.ACTIONS.conn.error, (ev, {port, pid, error}) =>
         Dispatcher.dispatch({
            action: this.ACTIONS.conn.error,
            port,
            pid,
            error
         })
      )

      ipcRenderer.on(this.ACTIONS.conn.state, (ev, {port, pid, data}) =>
         Dispatcher.dispatch({
            action: this.ACTIONS.conn.state,
            port,
            pid,
            data
         })
      )

      ipcRenderer.on(this.ACTIONS.conn.data, (ev, {port, pid, fd, data}) =>
         Dispatcher.dispatch({
            action: this.ACTIONS.conn.data,
            port,
            pid,
            fd,
            data
         })
      )
   }

   list() {
      return ipcRenderer.sendSync('list')
   }

   open(port) {
      return ipcRenderer.sendSync('open', port)
   }

   close(port) {
      return ipcRenderer.sendSync('close', port)
   }

   state(port) {
      ipcRenderer.send('state', port)
   }

}

const PortsAPI = new Ports()

export {PortsAPI}

// storage of ports
class PortsStore extends BaseStore {
   constructor() {
      super()

      this.subscribe(this._subscribe.bind(this))

      this._ports = PortsAPI.list()
      this._added = []
      this._removed = []


   }

   _subscribe(action) {
      switch (action.action) {
         case PortsAPI.ACTIONS.ports.list:
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
