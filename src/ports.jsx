// make the list of serial ports available
//  - rescan very nth second
//  - add prop `ports` to child element

import React from 'react'
import _ from 'lodash'

import {PortsAPI, PortsStore} from './storage/ports'
import {ConnectionStore} from './storage/connection'


export class PortView extends React.Component {
   constructor() {
      super()

      this.connect = this.connect.bind(this)
      this.disconnect = this.disconnect.bind(this)
      this.configure = this.configure.bind(this)

      this.state = {
         conn: null
      }
   }

   componentWillMount() {
      const {port} = this.props

      this._mounted = true

      ConnectionStore.addChangeListener(this._connListener = () => {
         if (this._mounted)
            this.setState({conn: ConnectionStore.conn(port)})
      })

      // async state request
      PortsAPI.state(port)
   }

   componentWillUnmount() {
      this._mounted = false
   }

   configure(ev) {
      ev.preventDefault()
   }

   connect(ev) {
      ev.preventDefault()

      const {port} = this.props
      PortsAPI.open(port)
   }

   disconnect(ev) {
      ev.preventDefault()

      const {port} = this.props
      PortsAPI.close(port)
   }


   render() {
      const
         {port} = this.props,
         {conn} = this.state,
         pid = conn ? conn.pid : null

      return (
         <div className="port">
            <div className="top">
               <button className="button-link" onClick={this.props.goBack}>Go Back</button>
               <button style={{display: pid ? 'inline-block' : 'none'}} className="button-link danger" onClick={this.disconnect}>Close (X)</button>
               <button style={{display: pid ? 'none' : 'inline-block'}} className="button-link success" onClick={this.connect}>Open (V)</button>
               {/*<button className="button-link" onClick={this.configure}>Configure (U)</button>*/}
            </div>

            <div className="header">
               <h4>{port}</h4>

{/*
               <span className="right">
                  <em>
                     (Network ID - KA41, Unique ID - ::1, System ID 1::)
                  </em>
               </span>
*/}
            </div>


            <pre>
               <code>{conn && _.join(_.map(conn.output, ({data}) => data.toString()), "")}</code>
            </pre>
         </div>
      )
   }
}

const connected = port => !!(ConnectionStore.conn(port) || {}).pid

export class PortSelector extends React.Component {
   constructor() {
      super()

      this.state = {
         ports: PortsStore.ports,
         port: null
      }

      this.pickPort = this.pickPort.bind(this)
      this.goBack = this.goBack.bind(this)

      PortsStore.addChangeListener(this._listener = () => {
         if (this._mounted)
            this.setState({ports: PortsStore.ports})
      })
   }

   componentWillMount() {
      this._mounted = true
   }

   componentWillUnmount() {
      this._mounted = false
   }

   pickPort(ev) {
      ev.preventDefault()

      const port = ev.target.value

      this.setState({port})
   }

   goBack() {
      this.setState({port: null})
   }

   isNew(port) {
      return -1 !== _.indexOf(PortsStore.added, port)
   }

   render() {
      const {children} = this.props

      const {ports, port} = this.state

      if (null !== port)
         return React.cloneElement(children, {port, ports, goBack: this.goBack})
      else {
         // dirty way to get state for all the ports
         _.each(ports, (p) => PortsAPI.state(p))

         return (
            <div>
               <h4>Available Serial Ports</h4>
               <ul className="list-group">
                  {_.map(ports, (p, idx) =>
                     <li key={idx} className="list-group-item">
                        <button
                           className={(this.isNew(p) ? 'new' : '') + " button-link"}
                           value={p}
                           onClick={this.pickPort}>

                           {p} {connected(p) ? ' — Connected' : ''}
                        </button>
                     </li>)}
               </ul>
            </div>
         )
      }
   }
}

