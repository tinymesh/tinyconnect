//import React from 'react'
import os from 'os'
import process from 'process'

let arch, platform, executable

try {
   arch = (function() {
      let arch

      switch (os.arch()) {
         case 'x86':
         case 'ia32':
            return "386"

         case 'x64':
            return "amd64"

         case 'arm':
         case 'arm64':
            return os.arch()

         // mips, ppc, x32, etc...
         default:
            throw new Error("unsupported architecture " + os.arch())
      }
   })()


   platform = (function() {
      switch (os.platform()) {
         case "linux":
         case "darwin":
            return os.platform()

         case "win32":
            return  "windows"

         // mips, ppc, x32, etc...
         default:
            throw new Error("unsupported platform " + os.platform())
      }
   })()

   executable = (function() {
      const
         suffix = "win32" === os.platform()  ? '.exe' : '',
         file = './guri-' + platform + '-' + arch + suffix

      return require.resolve(file)
   })()

} catch (e) {
   console.error(e.stack)
   process.exit(1)
}

export default {arch, platform, executable}
