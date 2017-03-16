import { app, BrowserWindow, ipcMain } from 'electron'
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'
import { enableLiveReload } from 'electron-compile'
import processes from 'child_process'
import _ from 'lodash'
import guri from './guri.js'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({strategy: 'react-hmr'});

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  if (isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Processes spawned in rendere are not killed when the application exists
// Handle such communication in main thread instead to get them to exit
let listPorts = () => {
   const call = processes
                  .spawnSync(guri.executable,
                             ['-list'],
                             {encoding: 'ascii'})

   const lines = call.output[1].split(/[\r\n]/)
                               .filter(buf => !!buf)
   let ports

   ports = _.reduce(lines, (acc, line) => {
     let port = _.reduce(
       line.split(/\s/),
       (acc1, pair) => {
         let [k ,v] = pair.split(/=/)
         return _.set(acc1, k || "path", v)
       },
       {})
    return acc.concat([port])
  }, [])

  return ports
}

ipcMain.on('list', (event) => {
   event.returnValue = listPorts()
})

let _ports = listPorts()
setInterval(function() {
   const
      newports = listPorts(),
      added = _.difference(newports, _ports),
      removed = _.difference(_ports, newports)

   _ports = newports

   if (added.length > 0 || removed.length > 0) {
      if (mainWindow)
         mainWindow.webContents.send('port:list', {
            ports: newports,
            added,
            removed
         })
   }
}.bind(this), 1500)

let children = {}
let data = {}

const spawn = (port) => {
   let proc = processes.spawn(guri.executable,
                              [port],
                              { encoding: 'ascii' }),
       opened = false,
       pid = null

   if (!data[port])
      data[port] = []

   const onOpen = (proc) => {
      if (opened)
         return

      pid = proc.pid

      opened = true

      if (mainWindow) {
         mainWindow.webContents.send('port:open', {port: port,
                                                   pid: proc.pid,
                                                   data: data[port]})
      }
   }


   proc.stdin.once('data', () => onOpen(proc))
   proc.stderr.once('data', () => onOpen(proc))

   proc.on('exit', (code, signal) => {
      if (mainWindow)
         mainWindow.webContents.send('port:close', {port: port,
                                                    pid: pid,
                                                    code: code})

      delete children[port]
      //delete data[port]
   })

   proc.on('error', (err) => {
      console.log('some error occured!!!', err)
      if (mainWindow)
         mainWindow.webContents.send('port:error', {port: port,
                                                    pid: proc.pid,
                                                    error: err})
   })

   proc.stderr.on('data', (input) => {
      data[port].push({data: input, fd: 'stderr'})

      if (mainWindow)
         mainWindow.webContents.send('port:data', {port: port,
                                                   fd: 'stderr',
                                                   pid: proc.pid,
                                                   data: input})
   })

   proc.stdout.on('data', (input) => {
      data[port].push({data: input, fd: 'stdout'})

      if (mainWindow)
         mainWindow.webContents.send('port:data', {port: port,
                                                   fd: 'stdout',
                                                   pid: proc.pid,
                                                   data: input})
   })

   return proc
}

// async spawn serial adapter
ipcMain.on('open', (event, port) => {
   console.log('port:open: ' + port)

   if (!children[port])
      children[port] = spawn(port)

    event.returnValue = children[port].pid
})

ipcMain.on('state', (event, port) => {
   console.log('port:state: ' + port)


   if (mainWindow)
      mainWindow.webContents.send('port:state', {
         port: port,
         pid: children[port] ? children[port].pid : null,
         data: data[port] || []
      })
})

ipcMain.on('close', (event, port, signal) => {
   console.log('port:close: ' + port)

   if (children[port]) {
      children[port].kill(signal || "SIGTERM")
      event.returnValue = children[port].pid
   } else {
      event.returnValue = null
   }

})
