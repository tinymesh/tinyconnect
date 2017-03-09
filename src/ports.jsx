// make the list of serial ports available
//  - rescan very nth second
//  - add prop `ports` to child element

import React from 'react'
import _ from 'lodash'

import {PortsStore} from './storage/ports'


export class PortView extends React.Component {
   render() {
      return (
         <div>
            i need to check if port is configured
         </div>
      )
   }
}


export class PortSelector extends React.Component {
   constructor() {
      super()

      this.state = {
         ports: PortsStore.ports,
         port: null
      }

      this.pickPort = this.pickPort.bind(this)

      PortsStore.addChangeListener(this._listener = () =>
         this.setState({ports: PortsStore.ports}))
   }

   pickPort(ev) {
      ev.preventDefault()

      const port = ev.target.value

      this.setState({port})
   }

   isNew(port) {
      return -1 !== _.indexOf(PortsStore.added, port)
   }

   render() {
      const {children} = this.props

      const {ports, port} = this.state

      if (null !== port)
         return React.cloneElement(children, {port, ports})
      else
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

                           {p}
                        </button>
                     </li>)}
               </ul>
            </div>
         )
   }
}
