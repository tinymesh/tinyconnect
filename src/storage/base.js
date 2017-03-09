import { EventEmitter } from 'events'
import Dispatcher from './dispatcher'

export default class BaseStore extends EventEmitter {
  constructor() {
    super()
  }

  subscribe(subscription) {
    this._dispatchToken = Dispatcher.register(subscription)
  }

  get dispatchToken() {
    return this._dispatchToken
  }

  emitChange() {
    this.emit('CHANGE')
  }

  addChangeListener(cb) {
    this.on('CHANGE', cb)
  }

  removeChangeListener(cb) {
    this.removeListener('CHANGE', cb)
  }
}
