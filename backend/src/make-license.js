import readline from 'node:readline'
import { createLicenseKey } from './license.js'

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(String(answer || '').trim())
    })
  })
}

let name = process.argv.slice(2).join(' ').trim()
if (!name) {
  console.log('')
  console.log('Write the shop name, then press Enter.')
  console.log('Use the same spelling on every PC.')
  console.log('This shop: Hasan Shinwari Genral Store')
  console.log('')
  name = await ask('Shop name: ')
}

if (!name) {
  console.log('No shop name was written. Run make-license.bat again.')
  process.exit(1)
}

const key = createLicenseKey(name)
console.log('')
console.log('Shop: ' + name)
console.log('Key:  ' + key)
console.log('')
console.log('Type this same shop name and this same key on every PC for this shop.')
console.log('Do not change one letter. Shop data on each PC stays on that PC.')
console.log('')
