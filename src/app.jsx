import React from 'react'

//export default class App extends React.Component {
//  render() {
//    return (<div>
//      <h2>Welcome to React!</h2>
//    </div>);
//  }
//}


// PortSelector: Shows list of ports, or `children` if port selected
// PortView: Show the port console

import {PortSelector, PortView} from './ports.jsx'

const App = () =>
   <div className="container">
      <PortSelector>
         <PortView />
      </PortSelector>
   </div>


export default App
//         <PortView>
//
//            <Authenticated>
//               <Configuration />
//            </Authenticated>
//
//         </PortView>
